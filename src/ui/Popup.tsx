import { ArrowRight, ArrowUpRight, Github, RefreshCw, Settings2 } from 'lucide-react';
import type { Job, Settings, Submission } from '../shared/types';
import { Brand, Button, Eyebrow, Notice, StatusPill } from './components';
import { relativeDate } from './data';

interface Props {
  settings: Settings; connected: boolean; submissions: Submission[]; jobs: Job[];
  error: string; openDashboard: () => Promise<void>; openSettings: () => void; sync: () => Promise<void>;
}
export function Popup({ settings, connected, submissions, jobs, error, openDashboard, openSettings, sync }: Props) {
  const unique = [...new Map(submissions.map(s => [s.problemId, s])).values()];
  const pending = jobs.filter(job => job.status === 'pending' || job.status === 'processing').length;
  const failed = jobs.filter(job => job.status === 'failed').length;
  return <main className="popup-page">
    <header className="popup-header"><Brand compact/><button aria-label="Open settings" className="icon-button" onClick={openSettings}><Settings2 size={18}/></button></header>
    <div className="popup-intro"><Eyebrow index="01">YOUR DAILY PRACTICE</Eyebrow><h1>Keep the<br/>momentum<span className="red-period">.</span></h1><p>Every accepted solution is another step forward.</p></div>
    <div className="popup-metrics"><div><strong>{String(unique.length).padStart(2, '0')}</strong><span>PROBLEMS SOLVED</span></div><div><strong>{String(pending).padStart(2, '0')}</strong><span>PENDING SYNC</span></div><div><strong>{String(failed).padStart(2, '0')}</strong><span>NEEDS ATTENTION</span></div></div>
    <div className="popup-section-heading"><Eyebrow>RECENT ACTIVITY</Eyebrow><span>{settings.commitMode.toUpperCase()} MODE</span></div>
    <div className="popup-activity">{submissions.length ? [...submissions].sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)).slice(0,3).map(s => <div className="popup-activity-row" key={s.submissionId}><span className="activity-index">{s.problemId.padStart(4,'0')}</span><span><strong>{s.problemTitle}</strong><small>{s.language} · {relativeDate(s.submittedAt)}</small></span><ArrowUpRight size={15}/></div>) : <div className="popup-empty">Your accepted solutions will show up here.</div>}</div>
    <div className="popup-actions"><Button onClick={() => void openDashboard()}>Open dashboard <ArrowRight size={16}/></Button><button className="icon-button popup-sync" aria-label="Sync with GitHub" onClick={() => void sync()}><RefreshCw size={17}/></button></div>
    <footer className="popup-footer"><StatusPill connected={connected}/><span>{settings.selectedRepository ? <><Github size={13}/>{settings.selectedRepository}</> : 'NO REPOSITORY SELECTED'}</span></footer>
    {!connected && <a className="popup-connect" href={chrome.runtime?.getURL?.('onboarding.html') || 'onboarding.html'} target="_blank" rel="noreferrer">Connect GitHub <ArrowRight size={15}/></a>}
    <Notice message={error}/>
  </main>;
}
