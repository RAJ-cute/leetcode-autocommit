import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Job, Progress, Request, Settings, Submission } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { syncFeedback, type SyncResult } from '../shared/sync';
import { db } from '../shared/db';
import { send } from './api';
import { Dashboard } from './Dashboard';
import { Onboarding } from './Onboarding';
import { Popup } from './Popup';
import '@fontsource-variable/manrope';
import '@fontsource-variable/fredoka';
import './style.css';
import './catalog.css';

function App() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeTone, setNoticeTone] = useState<'info' | 'success'>('success');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [allSubmissions, allProgress, status] = await Promise.all([
      db.submissions(), db.progress(), send({ action: 'STATUS' })
    ]);
    if (status.version !== chrome.runtime.getManifest().version) throw new Error('This page is connected to an older extension worker. Reload the extension, then reopen setup.');
    setSubmissions(allSubmissions);
    setProgress(allProgress);
    setJobs(status.jobs as Job[]);
    setSettings(status.settings as Settings);
    setConnected(Boolean(status.connected));
    setLoading(false);
  }
  useEffect(() => { void refresh().catch(err => { setError((err as Error).message); setLoading(false); }); }, []);

  async function act(request: Request, message = 'Saved.') {
    setError(''); setNotice('');
    try {
      const result = await send(request);
      await refresh();
      if (request.action === 'SYNC') {
        const feedback = syncFeedback(result as SyncResult);
        setNotice(feedback.message);
        setNoticeTone(feedback.tone);
      } else {
        setNotice(message);
        setNoticeTone('success');
      }
    } catch (err) { setError((err as Error).message); }
  }
  const clearMessages = () => { setError(''); setNotice(''); };
  const page = window.location.pathname.split('/').pop();
  if (loading) return <div className="app-loading" role="status" aria-label="Loading your workspace"><div className="loading-shell"><span/><div><i/><i/><i/></div></div></div>;
  if (page === 'onboarding.html') return <Onboarding config={settings} connected={connected} onRefresh={refresh} initialError={error}/>;
  if (page === 'popup.html') return <Popup settings={settings} connected={connected} submissions={submissions} jobs={jobs} error={error} notice={notice} openDashboard={() => act({ action: 'OPEN_DASHBOARD' }, 'Dashboard opened.')} openSettings={() => { void chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#settings') }); }} sync={() => act({ action: 'SYNC' })}/>;
  return <Dashboard submissions={submissions} progress={progress} jobs={jobs} settings={settings} connected={connected} error={error} notice={notice} noticeTone={noticeTone} clearMessages={clearMessages} act={act} refresh={refresh}/>;
}

createRoot(document.getElementById('root')!).render(<App/>);
