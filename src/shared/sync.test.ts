import { describe, expect, it } from 'vitest';
import { planUploads, syncFeedback } from './sync';
import type { Job, Submission } from './types';

const submission: Submission = {
  submissionId: '100', problemId: '1', problemSlug: 'two-sum', problemTitle: 'Two Sum',
  problemUrl: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', topics: ['Array'],
  language: 'cpp', sourceCode: 'return 1;', submittedAt: '2026-11-03T00:00:00.000Z', accepted: true
};
const job = (status: Job['status'], targetRepository = 'owner/solutions'): Job => ({
  id: `${targetRepository}:100`, submissionId: '100', targetRepository, status,
  attempts: 1, createdAt: '2026-11-03T00:00:00.000Z'
});

describe('sync planning', () => {
  it('queues locally saved solutions without an upload job', () => {
    expect(planUploads([submission], [], 'owner/solutions', new Set(), false)).toEqual({queueIds:['100'],retryJobs:[]});
  });

  it('retries only failed jobs for the selected repository', () => {
    expect(planUploads([submission], [job('failed'),job('failed','other/repo')], 'owner/solutions', new Set(), false))
      .toEqual({queueIds:[],retryJobs:[job('failed')]});
  });

  it('keeps conflicts local and restores completed jobs when the remote repository is empty', () => {
    expect(planUploads([submission], [job('completed')], 'owner/solutions', new Set(['100']), true))
      .toEqual({queueIds:[],retryJobs:[]});
    expect(planUploads([submission], [job('completed')], 'owner/solutions', new Set(), true))
      .toEqual({queueIds:[],retryJobs:[job('completed')]});
  });
});

describe('sync feedback', () => {
  it('explains a no-op without claiming a retry started', () => {
    expect(syncFeedback({imported:0,conflicts:0,queued:0,retried:0,pending:0,localCount:0,empty:true}))
      .toEqual({message:'Nothing to sync yet. Solve a problem on LeetCode and it will appear here.',tone:'info'});
  });

  it('reports uploads that were actually queued', () => {
    expect(syncFeedback({imported:0,conflicts:0,queued:1,retried:0,pending:1,localCount:1,empty:false}))
      .toEqual({message:'Queued 1 local solution for upload. Check each solution card for upload status.',tone:'success'});
  });
});
