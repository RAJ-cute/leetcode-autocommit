import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Github, KeyRound, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import type { CommitMode, Settings } from '../shared/types';
import { send } from './api';
import { Brand, Button, Eyebrow, Notice, PrivacyBadge } from './components';

interface Props { config: Settings; connected: boolean; onRefresh: () => Promise<void>; initialError?: string }

export function Onboarding({ config, connected, onRefresh, initialError }: Props) {
  const [token, setToken] = useState('');
  const [visible, setVisible] = useState(false);
  const [repositories, setRepositories] = useState<string[]>([]);
  const [repository, setRepository] = useState(config.selectedRepository || '');
  const [mode, setMode] = useState<CommitMode>(config.commitMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(connected ? 2 : 1);

  useEffect(() => { if (initialError) setError(initialError); }, [initialError]);

  useEffect(() => {
    if (!connected) return;
    void send({ action: 'REPOSITORIES' }).then(result => {
      setRepositories((result.repositories as { full_name: string }[]).map(item => item.full_name));
    }).catch(err => setError((err as Error).message));
  }, [connected]);

  async function connect() {
    setError(''); setVisible(false); setBusy(true);
    try {
      await send({ action: 'CONNECT', payload: { token } });
      setToken(''); setStage(2);
      await onRefresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function finish() {
    setError(''); setBusy(true);
    try {
      await send({ action: 'SELECT_REPOSITORY', payload: { repository } });
      await send({ action: 'SET_MODE', payload: { mode } });
      await onRefresh();
      window.location.assign(chrome.runtime.getURL('dashboard.html'));
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="onboarding-page">
    <div className="onboarding-top"><Brand/><span className="onboarding-top-caption">YOUR CODING ARCHIVE / BUILD 0.1.2</span></div>
    <div className="onboarding-grid">
      <section className="onboarding-art" aria-label="LeetCode AutoCommit introduction">
        <div className="onboarding-art-grid"/>
        <div className="orbit orbit--outer"/><div className="orbit orbit--middle"/><div className="orbit orbit--inner"/>
        <div className="orbit-center"><span className="orbit-center-dots">● ● ●<br/>● ● ●<br/>● ● ●</span></div>
        <div className="orbit-callout orbit-callout--top"><span className="live-dot"/>CONNECTED THINKING</div>
        <div className="orbit-callout orbit-callout--bottom">SOLVE <span>→</span> SAVE <span>→</span> GROW</div>
        <div className="art-copy"><Eyebrow index="01">WELCOME TO THE SYSTEM</Eyebrow><h1>Make every<br/><em>solve</em> count<span className="red-period">.</span></h1><p>Your accepted code, your notes, your progress. Organized beautifully, committed automatically.</p></div>
        <div className="art-footer"><span>BUILD A BODY OF WORK</span><span>SCROLL LESS. SOLVE MORE.</span></div>
      </section>
      <main className="onboarding-form-area">
        <div className="onboarding-form-inner">
          <div className="steps"><div className={`step ${stage >= 1 ? 'step--active' : ''}`}><span>{stage > 1 ? <Check size={13}/> : '01'}</span>Connect</div><div className="step-line"/><div className={`step ${stage === 2 ? 'step--active' : ''}`}><span>02</span>Configure</div></div>
          <div className="form-heading"><Eyebrow index={String(stage).padStart(2, '0')}>SETUP / GITHUB</Eyebrow><h2>{stage === 1 ? <>Connect your<br/><span>GitHub.</span></> : <>Choose your<br/><span>workspace.</span></>}</h2><p>{stage === 1 ? 'One secure connection. Every accepted solution in its place.' : `Signed in as ${config.githubUsername || 'your GitHub account'}. Select the repository you want to build.`}</p></div>
          <Notice message={error} onDismiss={() => setError('')}/>
          {error.includes('older extension worker') && <div className="worker-recovery"><p>The extension must restart its background worker. Your token has not been saved by this attempt.</p><Button variant="red" onClick={() => chrome.runtime.reload()}>Reload extension <RefreshCw size={15}/></Button><small>After reload, click the extension icon to open setup again.</small></div>}
          {stage === 1 ? <>
            <div className="instruction-card"><div className="instruction-icon"><KeyRound size={20}/></div><div><strong>Create a fine-grained token</strong><p>Limit it to your existing solutions repository. Grant Contents read/write and Metadata read-only.</p><a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noreferrer">View GitHub instructions <ArrowUpRight size={14}/></a></div></div>
            <label className="field-label" htmlFor="github-token">PERSONAL ACCESS TOKEN</label>
            <div className="token-field"><LockKeyhole size={18}/><input id="github-token" type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} placeholder="github_pat_••••••••••••••" value={token} onChange={event => setToken(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && token.trim()) void connect(); }}/><button type="button" onClick={() => setVisible(value => !value)}>{visible ? 'HIDE' : 'SHOW'}</button></div>
            <p className="field-hint"><ShieldCheck size={14}/> Your token stays in Chrome local storage. It is never sent to LeetCode.</p>
            <Button disabled={!token.trim() || busy} onClick={() => void connect()}>{busy ? <>Validating <RefreshCw size={16} className="spin"/></> : <>Validate and continue <ArrowRight size={17}/></>}</Button>
          </> : <>
            <div className="connected-identity"><span className="connected-icon"><Github size={20}/></span><span><small>GITHUB CONNECTED</small><strong>@{config.githubUsername}</strong></span><Check size={17}/></div>
            <div className="section-inline"><label className="field-label" htmlFor="repository-select">TARGET REPOSITORY</label><button className="text-action" onClick={() => void send({ action: 'REPOSITORIES' }).then(result => setRepositories((result.repositories as { full_name: string }[]).map(item => item.full_name))).catch(err => setError((err as Error).message))}><RefreshCw size={14}/> Refresh</button></div>
            <div className="select-wrap"><Github size={18}/><select id="repository-select" value={repository} onChange={event => setRepository(event.target.value)}><option value="">Select an existing repository</option>{repositories.map(name => <option value={name} key={name}>{name}</option>)}</select><ChevronRight size={16}/></div>
            {repositories.length === 0 && <p className="field-hint">No repositories listed yet. The token must have access to an existing repository.</p>}
            <label className="field-label mode-heading">COMMIT MODE</label>
            <div className="mode-grid"><button className={`mode-card ${mode === 'manual' ? 'mode-card--selected' : ''}`} onClick={() => setMode('manual')}><span className="mode-radio"/><strong>Manual</strong><small>Review each solution before pushing.</small></button><button className={`mode-card ${mode === 'automatic' ? 'mode-card--selected' : ''}`} onClick={() => setMode('automatic')}><span className="mode-radio"/><strong>Automatic</strong><small>Commit as soon as it is accepted.</small></button></div>
            <Button disabled={!repository || busy} onClick={() => void finish()}>{busy ? 'Checking permissions…' : <>Finish setup <ArrowRight size={17}/></>}</Button>
          </>}
          <div className="form-footer"><PrivacyBadge/><span>NO BACKEND · NO TRACKERS</span></div>
        </div>
      </main>
    </div>
  </div>;
}
