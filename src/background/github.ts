import { validRepository, validSubmission, type Progress, type Submission } from '../shared/types';
import { metadataPath, problemReadme, readmePath, rootReadme, solutionPath } from '../shared/generate';

const API = 'https://api.github.com';
const TIMEOUT = 15000;
export class GitHubError extends Error { constructor(public code: string) { super(code); } }
function sha(value: unknown): string { if (typeof value!=='string' || !/^[a-f0-9]{40}$/i.test(value)) throw new GitHubError('BAD_RESPONSE'); return value; }
function branch(value: unknown): string { if (typeof value!=='string' || value.length>200 || !/^[A-Za-z0-9._/-]+$/.test(value) || value.split('/').some(part=>!part || part==='.' || part==='..')) throw new GitHubError('BAD_RESPONSE'); return value; }
async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(API + path, { ...init, redirect: 'error', signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers } });
    if (!response.ok) throw new GitHubError(response.status === 401 ? 'AUTH_INVALID' : response.status === 403 ? 'FORBIDDEN_OR_RATE_LIMITED' : response.status === 404 ? 'NOT_FOUND' : response.status === 422 ? 'CONFLICT' : `HTTP_${response.status}`);
    return await response.json() as T;
  } catch (e) { if (e instanceof GitHubError) throw e; throw new GitHubError('NETWORK'); }
  finally { clearTimeout(timer); }
}
const repoPath = (repo: string) => { if (!validRepository(repo)) throw new GitHubError('INVALID_REPOSITORY'); return `/repos/${repo.split('/').map(encodeURIComponent).join('/')}`; };
async function isEmptyRepository(token: string, base: string): Promise<boolean> {
  const branches = await request<unknown>(token, `${base}/branches?per_page=1`);
  if (!Array.isArray(branches)) throw new GitHubError('BAD_RESPONSE');
  return branches.length === 0;
}
function base64(content: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export async function identity(token: string): Promise<{ login: string }> {
  const v = await request<{login: string}>(token, '/user');
  if (!v || typeof v.login !== 'string') throw new GitHubError('BAD_RESPONSE'); return { login: v.login };
}
export async function repositories(token: string): Promise<{full_name:string}[]> {
  const rows = await request<unknown>(token, '/user/repos?per_page=100&affiliation=owner,collaborator&sort=updated');
  if (!Array.isArray(rows)) throw new GitHubError('BAD_RESPONSE');
  return rows.filter((r): r is {full_name:string} => !!r && typeof r.full_name === 'string').map(r => ({full_name:r.full_name}));
}
export async function repository(token: string, repo: string): Promise<{default_branch:string; permissions?:{push:boolean}}> {
  const r = await request<{default_branch:string;permissions?:{push:boolean}}>(token, repoPath(repo));
  if (!r || r.permissions?.push !== true) throw new GitHubError('NO_WRITE_PERMISSION');
  branch(r.default_branch);
  return r;
}
interface Ref { object: {sha:string} }
interface Commit { sha:string; tree:{sha:string} }
interface Tree { sha:string; tree?:{path:string;sha:string;type:string}[]; truncated?:boolean }
interface BlobData { content?:string; encoding?:string }
function decodeBlob(blob: BlobData): string {
  if (blob.encoding !== 'base64' || typeof blob.content !== 'string' || blob.content.length>3_000_000) throw new GitHubError('BAD_RESPONSE');
  return new TextDecoder().decode(Uint8Array.from(atob(blob.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
}
export async function commitSolution(token: string, repo: string, s: Submission, p: Progress|undefined, all: Submission[], progress: Progress[], rootEnabled: boolean): Promise<{sha:string;path:string;changed:boolean}> {
  const branch = (await repository(token, repo)).default_branch;
  const base = repoPath(repo);
  const refPath = `${base}/git/ref/heads/${encodeURIComponent(branch)}`;
  for (let attempt=0; attempt<3; attempt++) {
    let ref: Ref;
    try { ref = await request<Ref>(token, refPath); }
    catch (error) {
      if (!(error instanceof GitHubError) || error.code !== 'HTTP_409' || !await isEmptyRepository(token, base)) throw error;
      const path = solutionPath(s);
      try {
        await request(token, `${base}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
          method:'PUT', body:JSON.stringify({message:`feat(leetcode): add ${s.problemTitle.replace(/[\r\n]/g,' ').slice(0,100)} solution`,content:base64(s.sourceCode)})
        });
      } catch (initializationError) {
        // Another writer may have initialized the repository first. Retry against its new head.
        if (!(initializationError instanceof GitHubError) || !['HTTP_409','CONFLICT'].includes(initializationError.code)) throw initializationError;
      }
      continue;
    }
    const head = await request<Commit>(token, `${base}/git/commits/${sha(ref?.object?.sha)}`);
    const tree = await request<Tree>(token, `${base}/git/trees/${sha(head?.tree?.sha)}?recursive=1`);
    if (tree.truncated || !Array.isArray(tree.tree)) throw new GitHubError('TREE_TOO_LARGE');
    const path = solutionPath(s);
    const {sourceCode,githubCommitSha,githubFilePath,...metadata} = s;
    const files = [{path, content:s.sourceCode}, {path:readmePath(s),content:problemReadme(s,p)}, {path:metadataPath(s),content:JSON.stringify({version:1,submission:metadata,progress:p||null},null,2)+'\n'}];
    if (rootEnabled) {
      let rootContent = rootReadme(all,progress);
      const root = tree.tree.find(e=>e.path==='README.md'&&e.type==='blob');
      if (root) {
        const blob = await request<BlobData>(token, `${base}/git/blobs/${sha(root.sha)}`);
        const existing = decodeBlob(blob);
        const start = existing.indexOf('<!-- LeetCode AutoCommit generated README;');
        const endTag = '<!-- /LeetCode AutoCommit -->';
        const end = existing.indexOf(endTag,start);
        rootContent = start >= 0 && end >= 0 ? existing.slice(0,start)+rootContent+existing.slice(end+endTag.length) : `${existing.trimEnd()}\n\n${rootContent}`;
      }
      files.push({path:'README.md',content:rootContent});
    }
    const changes: {path:string;mode:'100644';type:'blob';content:string}[] = [];
    for (const file of files) {
      const existing = tree.tree.find(e => e.path === file.path && e.type === 'blob');
      const encoded = new TextEncoder().encode(`blob ${new TextEncoder().encode(file.content).length}\0${file.content}`);
      const digest = await crypto.subtle.digest('SHA-1', encoded);
      const sha = [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
      if (existing?.sha !== sha) changes.push({...file,mode:'100644',type:'blob'});
    }
    if (!changes.length) return {sha:ref.object.sha,path,changed:false};
    const newTree = await request<Tree>(token, `${base}/git/trees`, {method:'POST',body:JSON.stringify({base_tree:sha(head.tree.sha),tree:changes})});
    const message = `feat(leetcode): add ${s.problemTitle.replace(/[\r\n]/g,' ').slice(0,100)} solution [${s.difficulty}]`;
    const created = await request<Commit>(token, `${base}/git/commits`, {method:'POST',body:JSON.stringify({message,tree:sha(newTree.sha),parents:[sha(head.sha)]})});
    try {
      await request<Ref>(token, `${base}/git/refs/heads/${encodeURIComponent(branch)}`, {method:'PATCH',body:JSON.stringify({sha:sha(created.sha),force:false})});
      return {sha:created.sha,path,changed:true};
    } catch (e) {
      const current = await request<Ref>(token, refPath);
      if (sha(current?.object?.sha) === sha(created.sha)) return {sha:created.sha,path,changed:true};
      if (attempt === 2) throw e;
    }
  }
  throw new GitHubError('CONFLICT');
}
export async function pullRepository(token: string, repo: string): Promise<{records:{submission:Submission;progress?:Progress}[];empty?:boolean}> {
  const branch = (await repository(token,repo)).default_branch;
  const base = repoPath(repo);
  let ref: Ref;
  try { ref = await request<Ref>(token,`${base}/git/ref/heads/${encodeURIComponent(branch)}`); }
  catch (error) {
    if (error instanceof GitHubError && error.code === 'HTTP_409' && await isEmptyRepository(token, base)) return {records:[],empty:true};
    throw error;
  }
  const head = await request<Commit>(token,`${base}/git/commits/${sha(ref?.object?.sha)}`);
  const tree = await request<Tree>(token,`${base}/git/trees/${sha(head?.tree?.sha)}?recursive=1`);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new GitHubError('TREE_TOO_LARGE');
  const metadata = tree.tree.filter(e=>e.type==='blob'&&e.path.endsWith('.leetcode.json'));
  if (metadata.length>1000) throw new GitHubError('TOO_MANY_RECORDS');
  const records:{submission:Submission;progress?:Progress}[]=[];
  for (const entry of metadata) {
    try {
      const raw = JSON.parse(decodeBlob(await request<BlobData>(token,`${base}/git/blobs/${sha(entry.sha)}`))) as unknown;
      if (!raw || typeof raw!=='object' || Array.isArray(raw)) continue;
      const meta = raw as Record<string,unknown>;
      if (meta.version!==1 || !meta.submission || typeof meta.submission!=='object' || Array.isArray(meta.submission)) continue;
      const sourcePath = entry.path.slice(0,-'.leetcode.json'.length);
      const source = tree.tree.find(e=>e.path===sourcePath&&e.type==='blob');
      if (!source) continue;
      const code = decodeBlob(await request<BlobData>(token,`${base}/git/blobs/${sha(source.sha)}`));
      const s = {...meta.submission as Record<string,unknown>,sourceCode:code};
      if (!validSubmission(s) || solutionPath(s)!==sourcePath) continue;
      let p:Progress|undefined;
      if (meta.progress && typeof meta.progress==='object' && !Array.isArray(meta.progress)) {
        const candidate=meta.progress as Progress;
        if (candidate.problemId===s.problemId && ['none','pending','completed'].includes(candidate.revisionStatus) && ['low','medium','high'].includes(candidate.revisionPriority) && ['personalComment','approachNotes','timeComplexity','spaceComplexity'].every(k=>typeof candidate[k as keyof Progress]==='string'&&(candidate[k as keyof Progress] as string).length<=5000) && Number.isFinite(Date.parse(candidate.updatedAt))) p=candidate;
      }
      records.push({submission:{...s,githubCommitSha:ref.object.sha,githubFilePath:sourcePath},progress:p});
    } catch { /* Ignore malformed external metadata; never import it. */ }
  }
  return {records};
}
