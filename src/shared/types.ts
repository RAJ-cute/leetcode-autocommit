export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type CommitMode = 'manual' | 'automatic';
export type RevisionStatus = 'none' | 'pending' | 'completed';
export interface Submission {
  submissionId: string; problemId: string; problemSlug: string; problemTitle: string;
  problemUrl: string; difficulty: Difficulty; topics: string[]; language: string;
  sourceCode: string; runtime?: string; memory?: string; submittedAt: string;
  accepted: true; githubCommitSha?: string; githubFilePath?: string;
}
export interface Progress {
  problemId: string; revisionStatus: RevisionStatus; revisionPriority: 'low'|'medium'|'high';
  personalComment: string; approachNotes: string; timeComplexity: string; spaceComplexity: string;
  lastRevisedAt?: string; updatedAt: string;
}
export interface Job {
  id: string; submissionId: string; targetRepository: string; status: 'pending'|'processing'|'failed'|'completed';
  attempts: number; createdAt: string; nextAttemptAt?: string; errorCode?: string; commitSha?: string;
}
export interface Settings {
  githubUsername?: string; selectedRepository?: string; commitMode: CommitMode;
  preferredLanguage: string; readmeSyncEnabled: boolean; automaticRetry: boolean;
}
export const DEFAULT_SETTINGS: Settings = { commitMode: 'manual', preferredLanguage: 'cpp', readmeSyncEnabled: true, automaticRetry: true };
export type Request =
  | { action: 'CAPTURE'; payload: Submission }
  | { action: 'CONNECT'; payload: { token: string } }
  | { action: 'REPOSITORIES' | 'STATUS' | 'DISCONNECT' | 'SYNC' | 'OPEN_DASHBOARD' }
  | { action: 'SELECT_REPOSITORY'; payload: { repository: string } }
  | { action: 'SET_MODE'; payload: { mode: CommitMode } }
  | { action: 'QUEUE'; payload: { submissionId: string } }
  | { action: 'UPDATE_PROGRESS'; payload: { problemId: string; personalComment: string; approachNotes: string; timeComplexity: string; spaceComplexity: string; revisionStatus: RevisionStatus; revisionPriority: 'low'|'medium'|'high' } }
  | { action: 'SAVE_ACCEPTANCE'; payload: { submissionId: string; comment: string; revision: boolean; push: boolean } };

export function isRecord(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }
const str = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;
export function validSubmission(v: unknown): v is Submission {
  if (!isRecord(v)) return false;
  const keys = ['submissionId','problemId','problemSlug','problemTitle','problemUrl','difficulty','topics','language','sourceCode','submittedAt','accepted','runtime','memory'];
  if (Object.keys(v).some(k => !keys.includes(k))) return false;
  if (!str(v.submissionId, 32) || !/^\d+$/.test(v.submissionId as string) || !str(v.problemId, 32) || !str(v.problemSlug, 160) || !/^[a-z0-9-]+$/.test(v.problemSlug as string) || !str(v.problemTitle, 240) || !str(v.language, 40) || !str(v.sourceCode, 500_000) || !str(v.submittedAt, 40) || !Number.isFinite(Date.parse(v.submittedAt as string)) || v.accepted !== true) return false;
  if (!['Easy','Medium','Hard'].includes(v.difficulty as string) || !Array.isArray(v.topics) || v.topics.length > 30 || !v.topics.every(t => str(t, 80))) return false;
  if ((v.runtime !== undefined && !str(v.runtime, 80)) || (v.memory !== undefined && !str(v.memory, 80))) return false;
  return v.problemUrl === `https://leetcode.com/problems/${v.problemSlug}/`;
}
export function validRepository(v: unknown): v is string { return typeof v === 'string' && /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/.test(v) && !v.endsWith('/.') && !v.endsWith('/..'); }
export function validRequest(v: unknown): v is Request {
  if (!isRecord(v) || typeof v.action !== 'string' || JSON.stringify(v).length > 650_000) return false;
  const bare = ['REPOSITORIES','STATUS','DISCONNECT','SYNC','OPEN_DASHBOARD'];
  if (bare.includes(v.action)) return Object.keys(v).length === 1;
  if (Object.keys(v).length !== 2 || !isRecord(v.payload)) return false;
  const p = v.payload;
  if (v.action === 'CAPTURE') return validSubmission(p);
  if (v.action === 'CONNECT') return Object.keys(p).length === 1 && str(p.token, 300) && /^[A-Za-z0-9_]+$/.test(p.token as string);
  if (v.action === 'SELECT_REPOSITORY') return Object.keys(p).length === 1 && validRepository(p.repository);
  if (v.action === 'SET_MODE') return Object.keys(p).length === 1 && (p.mode === 'manual' || p.mode === 'automatic');
  if (v.action === 'QUEUE') return Object.keys(p).length === 1 && str(p.submissionId, 32) && /^\d+$/.test(p.submissionId as string);
  if (v.action === 'UPDATE_PROGRESS') return Object.keys(p).length === 7 && str(p.problemId,32) && ['none','pending','completed'].includes(p.revisionStatus as string) && ['low','medium','high'].includes(p.revisionPriority as string) && ['personalComment','approachNotes','timeComplexity','spaceComplexity'].every(k => typeof p[k] === 'string' && (p[k] as string).length <= 5000);
  if (v.action === 'SAVE_ACCEPTANCE') return Object.keys(p).length === 4 && str(p.submissionId,32) && /^\d+$/.test(p.submissionId as string) && typeof p.comment === 'string' && p.comment.length <= 5000 && typeof p.revision === 'boolean' && typeof p.push === 'boolean';
  return false;
}
