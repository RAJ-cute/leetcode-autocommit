import type { Job, Submission } from './types';

export interface SyncResult {
  imported: number;
  conflicts: number;
  queued: number;
  retried: number;
  pending: number;
  localCount: number;
  empty: boolean;
}

export function planUploads(
  submissions: Submission[],
  jobs: Job[],
  repository: string,
  conflictIds: ReadonlySet<string>,
  emptyRemote: boolean
): { queueIds: string[]; retryJobs: Job[] } {
  const bySubmission = new Map(jobs.filter(job => job.targetRepository === repository).map(job => [job.submissionId, job]));
  const queueIds: string[] = [];
  const retryJobs: Job[] = [];
  for (const submission of submissions) {
    if (conflictIds.has(submission.submissionId)) continue;
    const job = bySubmission.get(submission.submissionId);
    if (!job) queueIds.push(submission.submissionId);
    else if (job.status === 'failed' || (emptyRemote && job.status === 'completed')) retryJobs.push(job);
  }
  return { queueIds, retryJobs };
}

export function syncFeedback(result: SyncResult): { message: string; tone: 'info' | 'success' } {
  const work: string[] = [];
  if (result.imported) work.push(`Imported ${result.imported} solution${result.imported === 1 ? '' : 's'} from GitHub`);
  if (result.queued) work.push(`queued ${result.queued} local solution${result.queued === 1 ? '' : 's'} for upload`);
  if (result.retried) work.push(`requeued ${result.retried} failed upload${result.retried === 1 ? '' : 's'}`);
  if (result.conflicts) work.push(`${result.conflicts} conflict${result.conflicts === 1 ? ' was' : 's were'} kept locally`);
  if (work.length) {
    const summary = work.join('; ');
    return { message: `${summary.charAt(0).toUpperCase()}${summary.slice(1)}. Check each solution card for upload status.`, tone: result.conflicts ? 'info' : 'success' };
  }
  if (result.pending) return { message: `${result.pending} upload${result.pending === 1 ? ' is' : 's are'} already pending. Check each solution card for status.`, tone: 'info' };
  if (result.empty && !result.localCount) return { message: 'Nothing to sync yet. Solve a problem on LeetCode and it will appear here.', tone: 'info' };
  return { message: 'Everything is up to date. No new solutions or uploads.', tone: 'info' };
}
