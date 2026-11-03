import { ArrowRight, Check, Github, RefreshCw, Settings2 } from 'lucide-react';
import type { Job, Settings, Submission } from '../shared/types';
import { Brand, Button, Eyebrow, StatusPill } from './components';
import { relativeDate } from './data';

interface Props {
  settings: Settings; connected: boolean; submissions: Submission[]; jobs: Job[];
  error: string; notice?: string; openDashboard: () => Promise<void>; openSettings: () => void; sync: () => Promise<void>;
}
export function Popup({ settings, connected, submissions, jobs, error, notice, openDashboard, openSettings, sync }: Props) {
  const unique = [...new Map(submissions.map(s => [s.problemId, s])).values()];
  const pending = jobs.filter(job => job.status === 'pending' || job.status === 'processing').length;
  const failed = jobs.filter(job => job.status === 'failed').length;
  return <main className="popup-page">
    <header className="popup-header"><Brand compact/><button aria-label="Open settings" className="icon-button" onClick={openSettings}><Settings2 size={18}/></button></header>
    <div className="popup-intro"><Eyebrow index="01">YOUR DAILY PRACTICE</Eyebrow><h1>Your collection<br/>is growing<span className="red-period">.</span></h1><p className={error ? 'popup-message--error' : notice ? 'popup-message--notice' : ''} role={error ? 'alert' : notice ? 'status' : undefined}>{error || notice || (failed ? 'Some uploads need attention.' : pending ? 'Your GitHub archive is catching up.' : 'Your recent solutions are ready when you are.')}</p></div>
    <div className="popup-metrics"><div><strong>{String(unique.length).padStart(2, '0')}</strong><span>PROBLEMS SOLVED</span></div><div><strong>{String(pending).padStart(2, '0')}</strong><span>PENDING SYNC</span></div><div><strong>{String(failed).padStart(2, '0')}</strong><span>NEEDS ATTENTION</span></div></div>
    <div className="popup-section-heading"><Eyebrow>RECENT ACTIVITY</Eyebrow><span>{settings.commitMode.toUpperCase()} MODE</span></div>
    <div className="popup-activity">{submissions.length ? [...submissions].sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)).slice(0,3).map(s => <div className="popup-activity-row" key={s.submissionId}><span className="activity-index">{s.problemId.padStart(4,'0')}</span><span><strong>{s.problemTitle}</strong><small>{s.language} · {relativeDate(s.submittedAt)}</small></span><Check size={15} aria-label="Saved locally"/></div>) : <div className="popup-empty">Your accepted solutions will show up here.</div>}</div>
    <div className="popup-actions"><Button onClick={() => void openDashboard()}>Open dashboard <ArrowRight size={16}/></Button><button className="icon-button popup-sync" aria-label="Sync with GitHub" disabled={!connected || !settings.selectedRepository} onClick={() => void sync()}><RefreshCw size={17}/></button></div>
    <footer className="popup-footer"><StatusPill connected={connected}/><span>{settings.selectedRepository ? <><Github size={13}/>{settings.selectedRepository}</> : 'NO REPOSITORY SELECTED'}</span></footer>
    {!connected && <a className="popup-connect" href={chrome.runtime?.getURL?.('onboarding.html') || 'onboarding.html'} target="_blank" rel="noreferrer">Connect GitHub <ArrowRight size={15}/></a>}
  </main>;
}
