import { db, saveSubmission, updateProgress } from '../shared/db';
import { DEFAULT_SETTINGS, validRequest, type Job, type Request, type Settings, type Submission } from '../shared/types';
import { planUploads } from '../shared/sync';
import { commitSolution, GitHubError, identity, pullRepository, repositories, repository } from './github';
import { actionAllowed, senderContext } from './sender';

const TOKEN = 'githubToken';
async function settings(): Promise<Settings> { return { ...DEFAULT_SETTINGS, ...(await chrome.storage.local.get('settings')).settings }; }
async function token(): Promise<string|undefined> { return (await chrome.storage.local.get(TOKEN))[TOKEN]; }
async function queue(submissionId: string): Promise<Job> {
  const s = await db.get<Submission>('submissions', submissionId);
  const config = await settings();
  if (!s || !config.selectedRepository) throw new Error('Select a repository first');
  const id = `${config.selectedRepository}:${submissionId}`;
  const existing = await db.get<Job>('jobs', id);
  if (existing?.status === 'completed') { const again = {...existing,status:'pending' as const,attempts:0,nextAttemptAt:undefined}; await db.put('jobs',again); void processQueue(); return again; }
  if (existing?.status === 'failed') { const again = {...existing,status:'pending' as const,attempts:0,nextAttemptAt:undefined}; await db.put('jobs',again); void processQueue(); return again; }
  if (existing) return existing;
  const job: Job = { id, submissionId, targetRepository: config.selectedRepository, status:'pending', attempts:0, createdAt:new Date().toISOString() };
  await db.put('jobs', job);
  void processQueue(); return job;
}
let processing = false;
async function processQueue(): Promise<void> {
  if (processing) return; processing = true;
  try {
    const auth = await token(); if (!auth) return;
    const jobs = await db.jobs();
    const due = jobs.filter(j => (j.status === 'pending' || j.status === 'processing' || (j.status === 'failed' && !!j.nextAttemptAt)) && (!j.nextAttemptAt || j.nextAttemptAt <= new Date().toISOString())).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    for (const job of due) {
      const s = await db.get<Submission>('submissions', job.submissionId);
      if (!s) { await db.put('jobs',{...job,status:'failed',errorCode:'MISSING_SUBMISSION'}); continue; }
      await db.put('jobs',{...job,status:'processing'});
      try {
        const completedIds = new Set(jobs.filter(j=>j.targetRepository===job.targetRepository && j.status==='completed').map(j=>j.submissionId));
        const all = (await db.submissions()).filter(row=>row.submissionId===s.submissionId || completedIds.has(row.submissionId));
        const progress = await db.progress();
        const canonical = all.filter(row=>row.problemId===s.problemId && row.language===s.language).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))[0] || s;
        const result = await commitSolution(auth, job.targetRepository, canonical, progress.find(p=>p.problemId===s.problemId), all, progress, (await settings()).readmeSyncEnabled);
        await db.put('submissions',{...s,githubCommitSha:result.sha,githubFilePath:result.path});
        await db.put('jobs',{...job,status:'completed',commitSha:result.sha,errorCode:undefined});
      } catch (e) {
        const attempts = job.attempts+1;
        const code = e instanceof GitHubError ? e.code : 'UNKNOWN';
        const retryable = !['AUTH_INVALID','NO_WRITE_PERMISSION','NOT_FOUND','MISSING_SUBMISSION'].includes(code) && attempts < 5;
        await db.put('jobs',{...job,status:'failed',attempts,errorCode:code,lastAttemptAt:new Date().toISOString(),nextAttemptAt:retryable ? new Date(Date.now()+Math.min(3600000, 30000*2**attempts)).toISOString() : undefined});
      }
    }
  } finally { processing = false; }
}
chrome.runtime.onInstalled.addListener(async ({reason}) => {
  try { await chrome.storage.local.setAccessLevel({ accessLevel:'TRUSTED_CONTEXTS' }); } catch { /* older Chrome */ }
  await chrome.alarms.create('queue', {periodInMinutes: 1});
  if (reason === 'install' || (reason === 'update' && !(await token()))) await chrome.tabs.create({url:chrome.runtime.getURL('onboarding.html')});
});
chrome.runtime.onStartup.addListener(() => { void processQueue(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'queue') void processQueue(); });

chrome.runtime.onMessage.addListener((raw: unknown, sender, sendResponse) => {
  const context = senderContext(sender, chrome.runtime.id, chrome.runtime.getURL(''));
  if (!validRequest(raw)) { sendResponse({ok:false,error:'Malformed request. Check the token and try again.'}); return; }
  if (!actionAllowed(context, raw)) { sendResponse({ok:false,error:'This action is not allowed from this page.'}); return; }
  void handle(raw, context === 'content').then(data=>sendResponse({ok:true,...data})).catch(e=>sendResponse({ok:false,error:e instanceof GitHubError ? e.code : e instanceof Error ? e.message : 'Operation failed'}));
  return true;
});
async function handle(req: Request, content: boolean): Promise<Record<string, unknown>> {
  switch(req.action) {
    case 'CAPTURE': {
      if (!content) throw new Error('Invalid sender');
      const added = await saveSubmission(req.payload);
      const config = await settings();
      if (added && config.commitMode === 'automatic' && config.selectedRepository) await queue(req.payload.submissionId);
      return {new:added,mode:config.commitMode,repository:config.selectedRepository};
    }
    case 'OPEN_DASHBOARD': await chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')}); return {};
    case 'CONNECT': {
      const user = await identity(req.payload.token);
      await chrome.storage.local.set({[TOKEN]:req.payload.token,settings:{...(await settings()),githubUsername:user.login}});
      return {username:user.login};
    }
    case 'REPOSITORIES': { const auth = await token(); if (!auth) throw new Error('Connect GitHub first'); return {repositories:await repositories(auth)}; }
    case 'SELECT_REPOSITORY': { const auth = await token(); if (!auth) throw new Error('Connect GitHub first'); await repository(auth,req.payload.repository); await chrome.storage.local.set({settings:{...(await settings()),selectedRepository:req.payload.repository}}); return {}; }
    case 'SET_MODE': await chrome.storage.local.set({settings:{...(await settings()),commitMode:req.payload.mode}}); return {};
    case 'DISCONNECT': await chrome.storage.local.remove(TOKEN); await chrome.storage.local.set({settings:{...DEFAULT_SETTINGS}}); return {};
    case 'STATUS': return {settings:await settings(),connected:!!(await token()),jobs:await db.jobs(),version:chrome.runtime.getManifest().version};
    case 'QUEUE': return {job:await queue(req.payload.submissionId)};
    case 'UPDATE_PROGRESS': {
      const {problemId,...patch} = req.payload;
      await updateProgress(problemId,patch);
      const latest = (await db.submissions()).filter(s=>s.problemId===problemId).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))[0];
      if (latest && (await settings()).selectedRepository) await queue(latest.submissionId);
      return {};
    }
    case 'SAVE_ACCEPTANCE': {
      if (!content) throw new Error('Invalid sender');
      const s = await db.get<Submission>('submissions',req.payload.submissionId);
      if (!s) throw new Error('Submission not found');
      const current = await db.get<import('../shared/types').Progress>('progress',s.problemId);
      await updateProgress(s.problemId,{personalComment:req.payload.comment || current?.personalComment || '',revisionStatus:req.payload.revision?'pending':current?.revisionStatus||'none'});
      if (req.payload.push) await queue(s.submissionId);
      return {};
    }
    case 'SYNC': {
      const config=await settings(),auth=await token();
      if (!config.selectedRepository || !auth) throw new Error('Connect a repository first');
      const remote=await pullRepository(auth,config.selectedRepository);
      let imported=0,conflicts=0;
      const conflictIds = new Set<string>();
      for (const record of remote.records) {
        const local=await db.get<Submission>('submissions',record.submission.submissionId);
        if (!local) { await db.put('submissions',record.submission); imported++; }
        else if (local.sourceCode!==record.submission.sourceCode) { conflicts++; conflictIds.add(local.submissionId); }
        else if (!local.githubCommitSha) await db.put('submissions',{...local,githubCommitSha:record.submission.githubCommitSha,githubFilePath:record.submission.githubFilePath});
        if (!local || local.sourceCode===record.submission.sourceCode) {
          const id=`${config.selectedRepository}:${record.submission.submissionId}`;
          const existingJob = await db.get<Job>('jobs',id);
          if (existingJob?.status !== 'completed') await db.put('jobs',{id,submissionId:record.submission.submissionId,targetRepository:config.selectedRepository,status:'completed',attempts:existingJob?.attempts || 0,createdAt:existingJob?.createdAt || record.submission.submittedAt,commitSha:record.submission.githubCommitSha} satisfies Job);
        }
        if (record.progress) {
          const before=await db.get<import('../shared/types').Progress>('progress',record.progress.problemId);
          if (!before || before.updatedAt < record.progress.updatedAt) await db.put('progress',record.progress);
          else if (before.updatedAt > record.progress.updatedAt && JSON.stringify(before)!==JSON.stringify(record.progress)) conflicts++;
        }
      }
      const submissions = await db.submissions();
      const jobs = await db.jobs();
      const plan = planUploads(submissions,jobs,config.selectedRepository,conflictIds,!!remote.empty);
      for (const submissionId of plan.queueIds) {
        const id = `${config.selectedRepository}:${submissionId}`;
        await db.put('jobs',{id,submissionId,targetRepository:config.selectedRepository,status:'pending',attempts:0,createdAt:new Date().toISOString()} satisfies Job);
      }
      for (const job of plan.retryJobs) await db.put('jobs',{...job,status:'pending',attempts:0,errorCode:undefined,nextAttemptAt:undefined});
      const pending = (await db.jobs()).filter(job=>job.targetRepository===config.selectedRepository && (job.status==='pending' || job.status==='processing')).length;
      void processQueue();
      return {imported,conflicts,queued:plan.queueIds.length,retried:plan.retryJobs.length,pending,localCount:submissions.length,empty:!!remote.empty};
    }
  }
}
