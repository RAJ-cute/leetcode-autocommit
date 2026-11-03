import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Download, Github, KeyRound, RefreshCw, ShieldCheck, Trash2, Upload, Zap } from 'lucide-react';
import type { Job, Request, Settings } from '../shared/types';
import { clearLocalData, db, importBackup } from '../shared/db';
import { send } from './api';
import { Button, Eyebrow, Notice, StatusPill } from './components';

interface Props {
  settings: Settings; connected: boolean; jobs: Job[];
  act: (request: Request, message?: string) => Promise<void>; refresh: () => Promise<void>;
}

export function SettingsView({ settings, connected, jobs, act, refresh }: Props) {
  const [token, setToken] = useState('');
  const [repository, setRepository] = useState(settings.selectedRepository || '');
  const [repositories, setRepositories] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setRepository(settings.selectedRepository || ''); }, [settings.selectedRepository]);

  async function loadRepositories() {
    setError(''); setBusy(true);
    try { const result = await send({ action: 'REPOSITORIES' }); setRepositories((result.repositories as { full_name: string }[]).map(item => item.full_name)); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function replaceToken() {
    setError(''); setBusy(true);
    try { await send({ action: 'CONNECT', payload: { token } }); setToken(''); setMessage('Token validated and replaced.'); await refresh(); await loadRepositories(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function exportBackup() {
    try {
      const [submissions, progress, queue] = await Promise.all([db.submissions(), db.progress(), db.jobs()]);
      const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, submissions, progress, jobs: queue }, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'leetcode-autocommit-backup.json'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Backup downloaded.');
    } catch (err) { setError((err as Error).message); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError(''); setMessage('');
    try {
      if (file.size > 20_000_000) throw new Error('Backup exceeds 20 MB.');
      await importBackup(JSON.parse(await file.text())); await refresh(); setMessage('Backup imported. Existing local records were kept.');
    } catch (err) { setError((err as Error).message); }
  }
  async function clearData() {
    if (!window.confirm('Delete all local submissions, notes, and pending jobs? Export a backup first.')) return;
    try { await clearLocalData(); await refresh(); setMessage('Local data cleared. GitHub files were not changed.'); }
    catch (err) { setError((err as Error).message); }
  }

  return <div className="settings-stack">
    <div className="section-heading"><div><Eyebrow index="01">ACCOUNT & CONNECTION</Eyebrow><h2>Connected workspace</h2></div><StatusPill connected={connected}/></div>
    <section className="settings-panel settings-panel--account">
      <div className="settings-account"><span className="settings-account-icon"><Github size={25}/></span><div><small>GITHUB ACCOUNT</small><strong>{connected ? `@${settings.githubUsername}` : 'Not connected'}</strong><span>{settings.selectedRepository || 'Choose a repository to start syncing'}</span></div></div>
      <div className="settings-grid">
        <div className="settings-field"><label htmlFor="settings-token">REPLACE ACCESS TOKEN</label><div className="settings-input-icon"><KeyRound size={16}/><input id="settings-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="Paste a new fine-grained token"/></div><small>Validated before replacing the current token.</small></div>
        <div className="settings-field settings-field--button"><Button disabled={!token.trim() || busy} onClick={() => void replaceToken()}>Validate token <ArrowRight size={15}/></Button></div>
      </div>
      <div className="settings-grid settings-grid--repo"><div className="settings-field"><label htmlFor="settings-repository">TARGET REPOSITORY</label><select id="settings-repository" value={repository} onChange={event => setRepository(event.target.value)}><option value="">Select a repository</option>{[...new Set([repository, ...repositories])].filter(Boolean).map(name => <option key={name} value={name}>{name}</option>)}</select></div><div className="settings-field settings-field--button"><Button variant="ghost" disabled={!connected || busy} onClick={() => void loadRepositories()}><RefreshCw size={15}/> Load repositories</Button><Button disabled={!repository} onClick={() => void act({ action: 'SELECT_REPOSITORY', payload: { repository } }, 'Repository selected.')}>Save</Button></div></div>
      <div className="account-actions">
        <button className="setup-replay" onClick={() => void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html?guide=1') })}><BookOpen size={16}/> View setup tutorial</button>
        {connected && <button className="danger-link" onClick={() => { if (window.confirm('Disconnect GitHub? Your local solutions and notes will remain.')) { setToken(''); setRepositories([]); void act({ action: 'DISCONNECT' }, 'GitHub disconnected.'); } }}>Disconnect GitHub</button>}
      </div>
    </section>

    <div className="section-heading"><div><Eyebrow index="02">AUTOMATION</Eyebrow><h2>Make it yours</h2></div><Zap size={21} className="section-icon"/></div>
    <section className="settings-panel"><div className="setting-row"><div><strong>Commit mode</strong><p>Choose what happens when LeetCode accepts a solution.</p></div><div className="segmented"><button className={settings.commitMode === 'manual' ? 'is-active' : ''} onClick={() => void act({ action: 'SET_MODE', payload: { mode: 'manual' } }, 'Manual mode enabled.')}>Manual</button><button className={settings.commitMode === 'automatic' ? 'is-active' : ''} onClick={() => void act({ action: 'SET_MODE', payload: { mode: 'automatic' } }, 'Automatic mode enabled.')}>Automatic</button></div></div><div className="setting-row"><div><strong>Repository sync</strong><p>Pull committed solutions and retry pending uploads.</p></div><Button variant="ghost" disabled={!connected || !settings.selectedRepository} onClick={() => void act({ action: 'SYNC' })}><RefreshCw size={15}/> Sync now</Button></div><div className="queue-summary"><span><i className="queue-dot queue-dot--pending"/>{jobs.filter(j => j.status === 'pending' || j.status === 'processing').length} pending</span><span><i className="queue-dot queue-dot--failed"/>{jobs.filter(j => j.status === 'failed').length} failed</span><span><i className="queue-dot queue-dot--done"/>{jobs.filter(j => j.status === 'completed').length} synced</span></div></section>

    <div className="section-heading"><div><Eyebrow index="03">LOCAL DATA</Eyebrow><h2>Keep control</h2></div><ShieldCheck size={21} className="section-icon"/></div>
    <section className="settings-panel"><div className="setting-row"><div><strong>Download a backup</strong><p>Your submissions, notes, and queue in a JSON file.</p></div><Button variant="ghost" onClick={() => void exportBackup()}><Download size={15}/> Export</Button></div><div className="setting-row"><div><strong>Restore from a backup</strong><p>Validated records are added. Existing records stay intact.</p></div><label className="button button--ghost file-button"><Upload size={15}/> Import<input type="file" accept=".json,application/json" onChange={event => void importFile(event.target.files?.[0])}/></label></div><div className="setting-row"><div><strong>Clear local data</strong><p>Removes submissions and notes from this browser only.</p></div><Button variant="ghost" className="button--danger" onClick={() => void clearData()}><Trash2 size={15}/> Clear</Button></div></section>
    <Notice message={error} onDismiss={() => setError('')}/><Notice message={message} tone="success" onDismiss={() => setMessage('')}/>
  </div>;
}
