import type { Progress, Submission } from './types';
const extensions: Record<string,string> = { cpp:'cpp', c:'c', java:'java', python:'py', python3:'py', javascript:'js', typescript:'ts', go:'go', rust:'rs', csharp:'cs', swift:'swift', kotlin:'kt', ruby:'rb', php:'php', scala:'scala', dart:'dart', mysql:'sql', postgresql:'sql' };
export function safeSegment(s: string): string { return s.normalize('NFKD').replace(/[^A-Za-z0-9 -]/g, '').trim().replace(/\s+/g, '-').slice(0, 90) || 'Other'; }
export function solutionPath(s: Submission): string {
  const topic = [...s.topics].sort((a,b) => a.localeCompare(b))[0] || 'Other';
  const number = /^\d+$/.test(s.problemId) ? s.problemId.padStart(4, '0') : safeSegment(s.problemId);
  const language = s.language.toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = extensions[language] ? `solution.${extensions[language]}` : `solution.${language||'unknown'}.txt`;
  return `${safeSegment(topic)}/${s.difficulty}/${number}-${safeSegment(s.problemTitle)}/${filename}`;
}
export function readmePath(s: Submission): string { return solutionPath(s).replace(/solution\.[^/]+$/, 'README.md'); }
export function metadataPath(s: Submission): string { return `${solutionPath(s)}.leetcode.json`; }
function md(s: string): string { return s.replace(/[\\|`*_{}[\]()#+.!<>]/g, '\\$&').replace(/\r?\n/g, ' '); }
export function problemReadme(s: Submission, p?: Progress): string {
  return `# ${md(s.problemId)}. ${md(s.problemTitle)}\n\n`+
    `- Difficulty: ${s.difficulty}\n- Topics: ${s.topics.map(md).join(', ') || 'Other'}\n`+
    `- Problem: ${s.problemUrl}\n- Latest accepted: ${s.submittedAt}\n`+
    `${s.runtime ? `- Runtime: ${md(s.runtime)}\n` : ''}${s.memory ? `- Memory: ${md(s.memory)}\n` : ''}\n`+
    `## Personal comment\n\n${md(p?.personalComment || '') || '—'}\n\n## Approach notes\n\n${md(p?.approachNotes || '') || '—'}\n\n`+
    `## Complexity\n\n- Time: ${md(p?.timeComplexity || '') || '—'}\n- Space: ${md(p?.spaceComplexity || '') || '—'}\n\n`+
    `## Revision\n\n- Status: ${p?.revisionStatus || 'none'}\n- Priority: ${p?.revisionPriority || 'medium'}\n`;
}
export function rootReadme(submissions: Submission[], progress: Progress[]): string {
  const latest = new Map<string, Submission>();
  for (const s of submissions.sort((a,b) => a.submittedAt.localeCompare(b.submittedAt))) latest.set(s.problemId, s);
  const unique = [...latest.values()].sort((a,b) => b.submittedAt.localeCompare(a.submittedAt));
  const count = (d: string) => unique.filter(s => s.difficulty === d).length;
  const pending = progress.filter(p => p.revisionStatus === 'pending').length;
  const completed = progress.filter(p => p.revisionStatus === 'completed').length;
  const langs = new Set(submissions.map(s => s.language)).size;
  return `<!-- LeetCode AutoCommit generated README; edits to this file may be replaced. -->\n# LeetCode Solutions\n\nAccepted solutions managed with LeetCode AutoCommit.\n\n`+
    `| Unique solved | Easy | Medium | Hard | Accepted submissions | Languages | Revision pending | Revision completed |\n`+
    `|---:|---:|---:|---:|---:|---:|---:|---:|\n| ${unique.length} | ${count('Easy')} | ${count('Medium')} | ${count('Hard')} | ${submissions.length} | ${langs} | ${pending} | ${completed} |\n\n`+
    `## Solutions\n\n| Problem | Difficulty | Language | Solved |\n|---|---|---|---|\n`+
    unique.map(s => `| [${md(s.problemId)}. ${md(s.problemTitle)}](${encodeURI(readmePath(s))}) | ${s.difficulty} | ${md(s.language)} | ${s.submittedAt.slice(0,10)} |`).join('\n')+'\n<!-- /LeetCode AutoCommit -->\n';
}
