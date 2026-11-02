import type { Submission } from '../shared/types';

// LeetCode's private GraphQL operation is used only after a visible Accepted result
// supplies a numeric submission ID. Failure is explicit; editor text is never used.
const DETAILS = `query submissionDetails($submissionId: Int!) { submissionDetails(submissionId: $submissionId) { code lang { name } runtimeDisplay memoryDisplay timestamp statusCode question { titleSlug } } }`;
const QUESTION = `query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { questionFrontendId title titleSlug difficulty topicTags { name } } }`;
const RECENT = `query recentSubmissions($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String!) { submissionList(offset: $offset, limit: $limit, lastKey: $lastKey, questionSlug: $questionSlug) { submissions { id statusDisplay timestamp } } }`;
const seen = new Set<string>();
let timer: number | undefined;
let armedAt = 0;
let lastLookup = 0;
document.addEventListener('click',event=>{
  const button = event.target instanceof Element ? event.target.closest('button') : null;
  if (button && /^submit$/i.test((button.getAttribute('aria-label') || button.textContent || '').trim()) && /^\/problems\/[a-z0-9-]+\//.test(location.pathname)) armedAt=Date.now();
},true);

function submissionIdFromPage(): string | undefined {
  const url = location.pathname.match(/^\/submissions\/detail\/(\d+)\/?$/) || location.pathname.match(/^\/problems\/[a-z0-9-]+\/submissions\/(\d+)\/?$/);
  if (url) return url[1];
  const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href*="/submissions/detail/"],a[href*="/submissions/"]')];
  for (const a of anchors.reverse()) {
    const id = a.href.match(/^https:\/\/leetcode\.com\/submissions\/detail\/(\d+)\/?/) || a.href.match(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/submissions\/(\d+)\/?/);
    if (id && a.closest('[role="dialog"], [data-state="open"], main, section')?.textContent?.includes('Accepted')) return id[1];
  }
  return undefined;
}
async function graphql(query: string, variables: Record<string, unknown>): Promise<Record<string, unknown>> {
  const controller = new AbortController(); const timer = setTimeout(()=>controller.abort(),12000);
  try {
    const response = await fetch('https://leetcode.com/graphql/', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }), redirect: 'error', signal: controller.signal });
    if (!response.ok) throw new Error('LeetCode details unavailable');
    const json: unknown = await response.json();
    if (!json || typeof json !== 'object' || !('data' in json) || !json.data || typeof json.data !== 'object') throw new Error('Invalid LeetCode response');
    return json.data as Record<string, unknown>;
  } finally { clearTimeout(timer); }
}
function obj(v: unknown): Record<string, unknown> | undefined { return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : undefined; }
function value(v: unknown): string { return typeof v === 'string' ? v : ''; }
async function capture(id: string): Promise<void> {
  if (seen.has(id)) return;
  seen.add(id);
  let completed = false;
  try {
    const data = await graphql(DETAILS, { submissionId: Number(id) });
    const d = obj(data.submissionDetails);
    if (!d || d.statusCode !== 10 || !value(d.code).trim()) return;
    const slug = location.pathname.match(/^\/problems\/([a-z0-9-]+)\//)?.[1] || value(obj(d.question)?.titleSlug);
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;
    const q = obj((await graphql(QUESTION, { titleSlug: slug })).question);
    if (!q || q.titleSlug !== slug) return;
    const timestamp = typeof d.timestamp === 'number' ? d.timestamp : Number(d.timestamp);
    if (!Number.isFinite(timestamp) || (timestamp > 1e12 ? timestamp : timestamp*1000) < armedAt-5000) return;
    const topics = Array.isArray(q.topicTags) ? q.topicTags.map(t => value(obj(t)?.name)).filter(Boolean) : [];
    const submission: Submission = {
      submissionId: id, problemId: value(q.questionFrontendId), problemSlug: slug,
      problemTitle: value(q.title), problemUrl: `https://leetcode.com/problems/${slug}/`,
      difficulty: q.difficulty as Submission['difficulty'], topics,
      language: value(obj(d.lang)?.name), sourceCode: value(d.code),
      submittedAt: new Date(timestamp > 1e12 ? timestamp : timestamp * 1000).toISOString(), accepted: true,
      ...(value(d.runtimeDisplay) ? { runtime: value(d.runtimeDisplay) } : {}), ...(value(d.memoryDisplay) ? { memory: value(d.memoryDisplay) } : {})
    };
    const reply = await chrome.runtime.sendMessage({ action: 'CAPTURE', payload: submission });
    completed = !!reply?.ok;
    if (reply?.ok && reply?.new && reply?.mode === 'manual') showPrompt(submission,reply.repository);
    if (reply?.ok && reply?.new && reply?.mode === 'automatic') toast('Accepted solution saved. GitHub sync queued.');
  } catch { /* Leave the submission available for a later retry. */ }
  finally { if (!completed) seen.delete(id); }
}
function toast(message: string): void {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647';
  const shadow = host.attachShadow({mode:'closed'});
  const style = document.createElement('style'); style.textContent = `div{background:#111;color:#f3f3f0;border:1px solid #503336;border-left:3px solid #e4494d;padding:15px 20px;box-shadow:0 18px 50px #0009;font:600 12px ui-monospace,monospace;letter-spacing:.01em;max-width:320px}`;
  const el = document.createElement('div'); el.textContent = message; el.setAttribute('role','status');
  shadow.append(style,el); document.body.append(host); setTimeout(() => host.remove(), 5000);
}
function showPrompt(s: Submission, repository?: string): void {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:2147483647';
  const shadow = host.attachShadow({mode:'closed'});
  const style = document.createElement('style'); style.textContent = `
    *{box-sizing:border-box} .card{width:min(380px,calc(100vw - 32px));background:#101010;color:#f2f2f0;border:1px solid #484848;box-shadow:0 25px 80px #000b;font-family:Inter,Arial,sans-serif;padding:22px}
    .top{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #303030}.brand{font:800 12px ui-monospace,monospace;letter-spacing:.08em}.brand b{color:#e4494d}.status{font:700 9px ui-monospace,monospace;color:#b8d7c0;letter-spacing:.1em}.status:before{content:'●';margin-right:7px}
    .eyebrow{font:700 9px ui-monospace,monospace;letter-spacing:.16em;color:#e4494d;margin:21px 0 11px}h2{font-size:28px;line-height:1.05;letter-spacing:-.06em;font-weight:600;margin:0 0 15px;word-break:break-word}.meta{display:flex;gap:8px;flex-wrap:wrap;color:#a0a0a0;font:700 10px ui-monospace,monospace;margin-bottom:20px}.meta span{border:1px solid #3a3a3a;padding:6px 8px}.repo{font:10px ui-monospace,monospace;color:#8f8f8f;border-top:1px solid #303030;padding:13px 0 0;margin:0 0 17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    label.field{display:block;color:#aaa;font:700 9px ui-monospace,monospace;letter-spacing:.12em;margin-bottom:8px}textarea{display:block;width:100%;background:#1b1b1b;color:#fff;border:1px solid #444;padding:12px;min-height:88px;font:12px/1.5 Arial,sans-serif;resize:vertical;outline:0}textarea:focus{border-color:#e4494d}textarea::placeholder{color:#777}
    .revision{display:flex;align-items:center;gap:9px;color:#ccc;font:600 11px Arial,sans-serif;margin:18px 0 20px;cursor:pointer}.revision input{accent-color:#e4494d;width:15px;height:15px}.actions{display:flex;gap:8px}.actions button{flex:1;min-height:42px;border:1px solid #555;background:transparent;color:#eee;font:700 10px ui-monospace,monospace;cursor:pointer}.actions button.primary{background:#e4494d;border-color:#e4494d;color:#101010}.actions button:disabled{opacity:.45;cursor:not-allowed}.actions button:not(:disabled):hover{filter:brightness(1.15)}.message{color:#ee8a8d;font:11px/1.4 Arial,sans-serif;min-height:0;margin:10px 0 0}.foot{display:flex;justify-content:space-between;color:#656565;font:700 8px ui-monospace,monospace;letter-spacing:.08em;margin-top:18px}`;
  const node = (tag: keyof HTMLElementTagNameMap, className: string, content?: string) => {const el=document.createElement(tag);el.className=className;if(content!==undefined)el.textContent=content;return el;};
  const card=node('div','card');card.setAttribute('role','dialog');card.setAttribute('aria-label','Accepted solution');
  const top=node('div','top');top.append(node('span','brand','LEETCODE AUTOCOMMIT'),node('span','status','ACCEPTED'));
  const heading=node('h2','',s.problemTitle);const eyebrow=node('div','eyebrow',`${s.problemId.padStart(4,'0')} / SOLUTION SAVED`);
  const meta=node('div','meta');for(const item of [s.difficulty,s.language,s.runtime||'Runtime —',s.memory||'Memory —'])meta.append(node('span','',item));
  const repo=node('p','repo',`TARGET / ${repository||'NO REPOSITORY SELECTED'}`);
  const field=node('label','field','PERSONAL NOTE');
  const comment=document.createElement('textarea');comment.placeholder='What would you remember next time?';comment.maxLength=5000;comment.rows=3;field.append(comment);
  const revisionLabel=node('label','revision');const revision=document.createElement('input');revision.type='checkbox';revisionLabel.append(revision,' Mark for revision');
  const actions=node('div','actions');const skip=document.createElement('button');skip.textContent='Save for later';const push=document.createElement('button');push.className='primary';push.textContent='Push to GitHub →';push.disabled=!repository;
  const message=node('p','message');
  const save = async (sendToGithub:boolean) => {push.disabled=true;skip.disabled=true;try{const response=await chrome.runtime.sendMessage({action:'SAVE_ACCEPTANCE',payload:{submissionId:s.submissionId,comment:comment.value,revision:revision.checked,push:sendToGithub}});if(!response?.ok)throw new Error(response?.error||'Could not save notes');host.remove();toast(sendToGithub?'Saved locally. GitHub sync queued.':'Saved locally for later.')}catch(error){message.textContent=error instanceof Error?error.message:'Could not save notes';push.disabled=!repository;skip.disabled=false;}};
  skip.onclick=()=>void save(false);push.onclick=()=>void save(true);actions.append(skip,push);
  const foot=node('div','foot');foot.append(node('span','','LOCAL FIRST'),node('span','','YOUR WORK, IN ORDER'));
  card.append(top,eyebrow,heading,meta,repo,field,revisionLabel,actions,message,foot);shadow.append(style,card);document.body.append(host);
}
async function recentAcceptedId(): Promise<string|undefined> {
  const slug = location.pathname.match(/^\/problems\/([a-z0-9-]+)\//)?.[1];
  if (!slug || Date.now()-lastLookup<2000 || !document.body.textContent?.includes('Accepted')) return undefined;
  lastLookup=Date.now();
  const list = obj((await graphql(RECENT,{offset:0,limit:1,lastKey:null,questionSlug:slug})).submissionList);
  const row = Array.isArray(list?.submissions) ? obj(list.submissions[0]) : undefined;
  const id = value(row?.id);
  const stamp = Number(row?.timestamp);
  if (!/^\d+$/.test(id) || row?.statusDisplay!=='Accepted' || !Number.isFinite(stamp) || stamp*1000 < armedAt-5000) return undefined;
  return id;
}
function scan(): void {
  if (!armedAt || Date.now()-armedAt>600000) return;
  const id = submissionIdFromPage();
  if (id) { void capture(id); return; }
  void recentAcceptedId().then(found=>{if(found)void capture(found)}).catch(()=>{});
}
const observer = new MutationObserver(() => { clearTimeout(timer); timer = window.setTimeout(scan, 450); });
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('popstate', scan); scan();
