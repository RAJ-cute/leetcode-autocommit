import type { ReactNode } from 'react';
import { ArrowUpRight, CircleCheck, Inbox, ShieldCheck } from 'lucide-react';
import type { Job, Submission } from '../shared/types';
import { dateLabel } from './data';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="LeetCode AutoCommit">
    <span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span>
    <span className="brand-wordmark">LEETCODE<span className="brand-dot">.</span><small>AUTOCOMMIT</small></span>
  </div>;
}

export function Eyebrow({ children, index }: { children: ReactNode; index?: string }) {
  return <div className="eyebrow">{index && <span className="eyebrow-index">{index} /</span>}{children}</div>;
}

export function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button', className = '' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'red'; disabled?: boolean; type?: 'button' | 'submit'; className?: string;
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`button button--${variant} ${className}`}>{children}</button>;
}

export function Notice({ message, tone = 'error', onDismiss }: { message: string; tone?: 'error' | 'success'; onDismiss?: () => void }) {
  if (!message) return null;
  return <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}><span>{message}</span>{onDismiss && <button aria-label="Dismiss message" onClick={onDismiss}>×</button>}</div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-state-icon"><Inbox size={24} strokeWidth={1.4}/></div><Eyebrow index="00">AWAITING DATA</Eyebrow><h3>{title}</h3><p>{body}</p>{action}</div>;
}

export function StatusPill({ job, connected }: { job?: Job; connected?: boolean }) {
  if (job) return <span className={`status-pill status-pill--${job.status}`}><span className="status-dot"/>{job.status}</span>;
  return <span className={`status-pill ${connected ? 'status-pill--completed' : 'status-pill--failed'}`}><span className="status-dot"/>{connected ? 'Connected' : 'Disconnected'}</span>;
}

export function StatCard({ label, value, footnote, accent = false }: { label: string; value: string | number; footnote?: string; accent?: boolean }) {
  return <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}><div className="stat-card-top"><span>{label}</span><span aria-hidden="true">↗</span></div><strong>{value}</strong>{footnote && <small>{footnote}</small>}</div>;
}

export function SubmissionRow({ submission, job, onOpen }: { submission: Submission; job?: Job; onOpen: () => void }) {
  return <button className="submission-row" onClick={onOpen}>
    <span className="submission-number">{submission.problemId.padStart(4, '0')}</span>
    <span className="submission-title"><strong>{submission.problemTitle}</strong><small>{submission.topics.slice(0, 2).join(' · ') || 'Other'}</small></span>
    <span className={`difficulty difficulty--${submission.difficulty.toLowerCase()}`}>{submission.difficulty}</span>
    <span className="submission-language">{submission.language}</span>
    <span className="submission-date">{dateLabel(submission.submittedAt)}</span>
    {job ? <StatusPill job={job}/> : <CircleCheck size={16} className="submission-accepted"/>}
    <ArrowUpRight size={16} className="submission-arrow"/>
  </button>;
}

export function PrivacyBadge() {
  return <div className="privacy-badge"><ShieldCheck size={14}/><span>LOCAL FIRST. PRIVATE BY DESIGN.</span></div>;
}
