import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpenText, Check, Clock3, Code2, Github, Send } from 'lucide-react';
import type { Job, Progress, Request, Submission } from '../shared/types';
import { db } from '../shared/db';
import { Button, Eyebrow, StatusPill } from './components';
import { dateLabel } from './data';

interface Props {
  submission: Submission; progress?: Progress; job?: Job; repository?: string;
  back: () => void; act: (request: Request, message?: string) => Promise<void>;
}
interface HistoryEntry { id: string; problemId: string; status: string; at: string }

export function ProblemDetail({ submission, progress, job, repository, back, act }: Props) {
  const [comment, setComment] = useState(progress?.personalComment || '');
  const [approach, setApproach] = useState(progress?.approachNotes || '');
  const [time, setTime] = useState(progress?.timeComplexity || '');
  const [space, setSpace] = useState(progress?.spaceComplexity || '');
  const [revision, setRevision] = useState<Progress['revisionStatus']>(progress?.revisionStatus || 'none');
  const [priority, setPriority] = useState<Progress['revisionPriority']>(progress?.revisionPriority || 'medium');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void db.all<HistoryEntry>('revisionHistory').then(rows => setHistory(rows.filter(row => row.problemId === submission.problemId).sort((a,b) => b.at.localeCompare(a.at)))).catch(() => {}); }, [submission.problemId]);

  async function save() {
    setSaving(true);
    try { await act({ action: 'UPDATE_PROGRESS', payload: { problemId: submission.problemId, personalComment: comment, approachNotes: approach, timeComplexity: time, spaceComplexity: space, revisionStatus: revision, revisionPriority: priority } }, 'Notes saved locally. GitHub sync queued.'); }
    finally { setSaving(false); }
  }
  const githubUrl = repository && submission.githubFilePath ? `https://github.com/${repository}/blob/HEAD/${submission.githubFilePath.split('/').map(encodeURIComponent).join('/')}` : undefined;

  return <div className="detail-page">
    <button className="back-link" onClick={back}><ArrowLeft size={16}/> ALL PROBLEMS</button>
    <div className="detail-hero"><div><Eyebrow index={submission.problemId.padStart(4, '0')}>ACCEPTED SOLUTION</Eyebrow><h1>{submission.problemTitle}<span className="red-period">.</span></h1><div className="detail-meta"><span className={`difficulty difficulty--${submission.difficulty.toLowerCase()}`}>{submission.difficulty}</span><span>{submission.language}</span><span>{dateLabel(submission.submittedAt)}</span>{job ? <StatusPill job={job}/> : <span className="status-pill">NOT QUEUED</span>}</div></div><div className="detail-links"><a href={submission.problemUrl} target="_blank" rel="noreferrer">LeetCode <ArrowUpRight size={15}/></a>{githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={15}/></a>}</div></div>
    <div className="detail-grid"><div className="detail-main"><section className="code-panel"><div className="code-panel-head"><div><Code2 size={16}/><span>SOLUTION / {submission.language.toUpperCase()}</span></div><span>{submission.sourceCode.split('\n').length} LINES</span></div><pre><code>{submission.sourceCode}</code></pre></section><section className="note-panel"><div className="panel-heading"><Eyebrow index="02">YOUR THINKING</Eyebrow><h2>Notes & approach</h2></div><label className="field-label" htmlFor="detail-comment">PERSONAL COMMENT</label><textarea id="detail-comment" rows={4} value={comment} onChange={event => setComment(event.target.value)} placeholder="What was the key insight? What would you remember next time?" maxLength={5000}/><label className="field-label" htmlFor="detail-approach">APPROACH NOTES</label><textarea id="detail-approach" rows={5} value={approach} onChange={event => setApproach(event.target.value)} placeholder="Break down your approach in your own words..." maxLength={5000}/><div className="complexity-grid"><label><span className="field-label">TIME COMPLEXITY</span><input value={time} onChange={event => setTime(event.target.value)} placeholder="e.g. O(n)" maxLength={5000}/></label><label><span className="field-label">SPACE COMPLEXITY</span><input value={space} onChange={event => setSpace(event.target.value)} placeholder="e.g. O(1)" maxLength={5000}/></label></div><Button disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : <>Save changes <Check size={16}/></>}</Button></section></div>
    <aside className="detail-aside"><section className="side-panel"><div className="panel-heading"><Eyebrow index="01">PERFORMANCE</Eyebrow><h2>Submission data</h2></div><div className="side-info-row"><span>RUNTIME</span><strong>{submission.runtime || 'Unavailable'}</strong></div><div className="side-info-row"><span>MEMORY</span><strong>{submission.memory || 'Unavailable'}</strong></div><div className="side-info-row"><span>SUBMISSION ID</span><strong>{submission.submissionId}</strong></div></section><section className="side-panel"><div className="panel-heading"><Eyebrow index="03">REVISIT THIS</Eyebrow><h2>Revision tracker</h2></div><label className="field-label" htmlFor="detail-revision">STATUS</label><select id="detail-revision" value={revision} onChange={event => setRevision(event.target.value as Progress['revisionStatus'])}><option value="none">Not marked</option><option value="pending">Pending revision</option><option value="completed">Completed</option></select><label className="field-label" htmlFor="detail-priority">PRIORITY</label><select id="detail-priority" value={priority} onChange={event => setPriority(event.target.value as Progress['revisionPriority'])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>{history.length > 0 && <div className="revision-timeline"><span className="field-label">HISTORY</span>{history.slice(0, 5).map(entry => <div key={entry.id}><Clock3 size={13}/><span>{entry.status}</span><small>{dateLabel(entry.at)}</small></div>)}</div>}</section><section className="side-panel side-panel--sync"><Github size={23}/><h3>Keep it committed.</h3><p>Your source and notes stay together in your GitHub repository.</p><Button variant="red" disabled={!repository} onClick={() => void act({ action: 'QUEUE', payload: { submissionId: submission.submissionId } }, 'Commit added to the queue.')}>Push to GitHub <Send size={15}/></Button>{!repository && <small>Connect a repository in Settings first.</small>}</section></aside></div>
  </div>;
}
