import type { Progress, Submission } from '../shared/types';

export function uniqueProblems(submissions: Submission[]): Submission[] {
  const byId = new Map<string, Submission>();
  for (const submission of [...submissions].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))) byId.set(submission.problemId, submission);
  return [...byId.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function streaks(submissions: Submission[]): { current: number; longest: number } {
  const days = [...new Set(submissions.map(s => s.submittedAt.slice(0, 10)))].sort();
  if (!days.length) return { current: 0, longest: 0 };
  let longest = 0, run = 0, previous = '';
  for (const day of days) {
    run = previous && (Date.parse(day) - Date.parse(previous)) === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run); previous = day;
  }
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  return { current: previous === today || previous === yesterday ? run : 0, longest };
}

export function dateLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? 'Unknown' : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return dateLabel(iso);
}

export function activityDays(submissions: Submission[], length = 365): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const submission of uniqueProblems(submissions)) {
    const key = submission.submittedAt.slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Array.from({ length }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (length - index - 1));
    const date = day.toISOString().slice(0, 10);
    return { date, count: counts.get(date) || 0 };
  });
}

export function topTopics(submissions: Submission[], limit = 6): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const submission of uniqueProblems(submissions)) for (const topic of submission.topics) counts.set(topic, (counts.get(topic) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, value]) => ({ name, value }));
}

export function progressFor(progress: Progress[], id: string): Progress | undefined {
  return progress.find(record => record.problemId === id);
}
