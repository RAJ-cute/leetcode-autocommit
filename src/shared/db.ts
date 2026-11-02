import { validRepository, validSubmission, type Job, type Progress, type Submission } from './types';
const NAME = 'leetcode-autocommit';
const VERSION = 1;
type Store = 'submissions'|'progress'|'jobs'|'revisionHistory'|'metadata';
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('submissions', { keyPath: 'submissionId' });
      db.createObjectStore('progress', { keyPath: 'problemId' });
      db.createObjectStore('jobs', { keyPath: 'id' });
      db.createObjectStore('revisionHistory', { keyPath: 'id' });
      db.createObjectStore('metadata', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Local database unavailable'));
  });
}
async function operation<T>(store: Store, mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = work(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('Local database operation failed'));
      tx.onabort = () => reject(new Error('Local database transaction failed'));
    });
  } finally { db.close(); }
}
export const db = {
  get: <T>(store: Store, key: string) => operation<T|undefined>(store, 'readonly', s => s.get(key)),
  all: <T>(store: Store) => operation<T[]>(store, 'readonly', s => s.getAll()),
  put: <T>(store: Store, value: T) => operation<IDBValidKey>(store, 'readwrite', s => s.put(value)),
  remove: (store: Store, key: string) => operation<undefined>(store, 'readwrite', s => s.delete(key)),
  submissions: () => db.all<Submission>('submissions'),
  progress: () => db.all<Progress>('progress'),
  jobs: () => db.all<Job>('jobs')
};
export async function saveSubmission(s: Submission): Promise<boolean> {
  if (await db.get<Submission>('submissions', s.submissionId)) return false;
  await db.put('submissions', s);
  return true;
}
export async function updateProgress(problemId: string, patch: Partial<Progress>): Promise<Progress> {
  const before = await db.get<Progress>('progress', problemId);
  const next: Progress = { problemId, revisionStatus: 'none', revisionPriority: 'medium', personalComment: '', approachNotes: '', timeComplexity: '', spaceComplexity: '', ...before, ...patch, updatedAt: new Date().toISOString() };
  await db.put('progress', next);
  if (before?.revisionStatus !== next.revisionStatus) await db.put('revisionHistory', { id: crypto.randomUUID(), problemId, status: next.revisionStatus, at: next.updatedAt });
  return next;
}
export async function importBackup(raw: unknown): Promise<void> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid backup');
  const data = raw as Record<string,unknown>;
  if (data.version !== 1 || !Array.isArray(data.submissions) || !Array.isArray(data.progress) || !Array.isArray(data.jobs) || data.submissions.length > 5000 || data.progress.length > 5000 || data.jobs.length > 10000) throw new Error('Unsupported backup');
  const submissions = data.submissions.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid submission');
    const {githubCommitSha,githubFilePath,...base} = row as Record<string,unknown>;
    if (!validSubmission(base) || (githubCommitSha !== undefined && (typeof githubCommitSha !== 'string' || !/^[a-f0-9]{40}$/.test(githubCommitSha))) || (githubFilePath !== undefined && (typeof githubFilePath !== 'string' || githubFilePath.includes('..') || githubFilePath.length > 500))) throw new Error('Invalid submission');
    return row as Submission;
  });
  const progress = data.progress.map(row => {
    const p = row as Progress;
    if (!p || typeof p !== 'object' || typeof p.problemId !== 'string' || p.problemId.length > 32 || !['none','pending','completed'].includes(p.revisionStatus) || !['low','medium','high'].includes(p.revisionPriority) || !['personalComment','approachNotes','timeComplexity','spaceComplexity'].every(k=>typeof p[k as keyof Progress] === 'string' && (p[k as keyof Progress] as string).length <= 5000)) throw new Error('Invalid progress');
    return p;
  });
  const jobs = data.jobs.map(row => {
    const j = row as Job;
    if (!j || typeof j !== 'object' || typeof j.id !== 'string' || j.id.length > 200 || typeof j.submissionId !== 'string' || !/^\d+$/.test(j.submissionId) || !validRepository(j.targetRepository) || !['pending','processing','failed','completed'].includes(j.status) || !Number.isInteger(j.attempts) || j.attempts < 0 || j.attempts > 100) throw new Error('Invalid queue record');
    return j;
  });
  const database = await open();
  try {
    await new Promise<void>((resolve,reject)=>{
      const tx = database.transaction(['submissions','progress','jobs'],'readwrite');
      for (const [name,rows,key] of [['submissions',submissions,'submissionId'],['progress',progress,'problemId'],['jobs',jobs,'id']] as const) {
        const store = tx.objectStore(name);
        for (const row of rows) {
          const id = (row as unknown as Record<string,unknown>)[key] as string;
          const get = store.get(id);
          get.onsuccess = () => { if (get.result === undefined) store.put(row); };
        }
      }
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(new Error('Import failed')); tx.onabort=()=>reject(new Error('Import failed'));
    });
  } finally { database.close(); }
}
export async function clearLocalData(): Promise<void> {
  const database = await open();
  try { await new Promise<void>((resolve,reject)=>{const tx=database.transaction(['submissions','progress','jobs','revisionHistory','metadata'],'readwrite');for(const name of ['submissions','progress','jobs','revisionHistory','metadata'])tx.objectStore(name).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('Clear failed'));}); }
  finally { database.close(); }
}
