import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, Github, KeyRound, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import type { CommitMode, Settings } from '../shared/types';
import { send } from './api';
import { Brand, Button, Eyebrow, Notice, PrivacyBadge } from './components';

interface Props { config: Settings; connected: boolean; onRefresh: () => Promise<void>; initialError?: string }
const tokenUrl = 'https://github.com/settings/personal-access-tokens/new?name=LeetCode%20AutoCommit&description=Accepted%20solutions%20archive&contents=write&metadata=read';

export function Onboarding({ config, connected, onRefresh, initialError }: Props) {
  const [token, setToken] = useState('');
  const [visible, setVisible] = useState(false);
  const [repositories, setRepositories] = useState<string[]>([]);
  const [repository, setRepository] = useState(config.selectedRepository || '');
  const [mode, setMode] = useState<CommitMode>(config.commitMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(new URLSearchParams(window.location.search).has('guide') ? 0 : connected ? 2 : 0);

  useEffect(() => { window.scrollTo(0, 0); }, [stage]);

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
      setStage(3);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="onboarding-page">
    <div className="onboarding-top"><Brand/><span className="onboarding-top-caption">YOUR CODING ARCHIVE / BUILD 0.1.9</span></div>
    <div className="onboarding-grid">
      <section className="onboarding-art" aria-label="LeetCode AutoCommit introduction">
        <div className="art-copy"><Eyebrow index="01">YOUR CODING ARCHIVE</Eyebrow><h1>Keep every<br/><em>accepted solve.</em></h1><p>Save accepted LeetCode code locally and commit it to the GitHub repository you choose.</p></div>
        <div className="onboarding-story" aria-label="How it works"><div><span>01</span><strong>Capture</strong><p>Accepted code is saved in your browser.</p></div><div><span>02</span><strong>Review</strong><p>Add notes and mark problems to revisit.</p></div><div><span>03</span><strong>Commit</strong><p>Sync your solutions to your repository.</p></div></div>
        <div className="art-footer"><span>YOUR WORK, KEPT IN ORDER</span><span>LOCAL FIRST</span></div>
      </section>
      <main className="onboarding-form-area">
        <div className="onboarding-form-inner">
          <div className="steps" aria-label="Setup progress"><div className={`step ${stage === 0 ? 'step--active' : ''}`}><span>{stage > 0 ? <Check size={13}/> : '1'}</span>Prepare</div><div className="step-line"/><div className={`step ${stage === 1 ? 'step--active' : ''}`}><span>{stage > 1 ? <Check size={13}/> : '2'}</span>Connect</div><div className="step-line"/><div className={`step ${stage >= 2 ? 'step--active' : ''}`}><span>{stage === 3 ? <Check size={13}/> : '3'}</span>Finish</div></div>
          <div className="form-heading"><h2>{stage === 0 ? <>Start with<br/><span>GitHub.</span></> : stage === 1 ? <>Connect your<br/><span>GitHub.</span></> : stage === 2 ? <>Choose your<br/><span>workspace.</span></> : <>You’re ready<br/><span>to solve.</span></>}</h2><p>{stage === 0 ? 'Follow these steps once. You will create a repository and a token that can write only to it.' : stage === 1 ? 'Paste the token you just copied. We will check it with GitHub before saving it.' : stage === 2 ? `Signed in as ${config.githubUsername || 'your GitHub account'}. Pick the repository and how uploads should start.` : 'Your repository is connected. Here is what happens on your next accepted submission.'}</p></div>
          <Notice message={error} onDismiss={() => setError('')}/>
          {error.includes('older extension worker') && <div className="worker-recovery"><p>The extension must restart its background worker. Your token has not been saved by this attempt.</p><Button variant="red" onClick={() => chrome.runtime.reload()}>Reload extension <RefreshCw size={15}/></Button><small>After reload, click the extension icon to open setup again.</small></div>}
          {stage === 0 ? <>
            <div className="setup-guide">
              <section className="guide-section"><span className="guide-number">01</span><div><h3>Create a repository</h3><p>Make a new repository on GitHub for your solutions, or use one you already own. An empty repository works.</p><a href="https://github.com/new" target="_blank" rel="noopener noreferrer">Create a GitHub repository <ArrowUpRight size={15}/></a></div></section>
              <section className="guide-section"><span className="guide-number">02</span><div><h3>Create a fine-grained token</h3><ol><li>Open the token form and give it a name and expiration.</li><li>Set <strong>Resource owner</strong> to the account that owns your repository.</li><li>Choose <strong>Only select repositories</strong>, then select that repository.</li><li>Under <strong>Repository permissions</strong>, set <strong>Contents</strong> to <strong>Read and write</strong>. Leave <strong>Metadata</strong> at <strong>Read-only</strong>.</li><li>Click <strong>Generate token</strong> and copy it before leaving GitHub.</li></ol><a href={tokenUrl} target="_blank" rel="noopener noreferrer">Open GitHub token form <ArrowUpRight size={15}/></a></div></section>
            </div>
            <p className="guide-note"><LockKeyhole size={15}/> Treat the token like a password. Paste it only into the extension on the next step.</p>
            <Button onClick={() => setStage(connected ? 2 : 1)}>{connected ? 'Continue setup' : 'I have my token'} <ArrowRight size={17}/></Button>
            <a className="guide-docs" href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token" target="_blank" rel="noopener noreferrer">Read GitHub’s full token guide <ArrowUpRight size={14}/></a>
          </> : stage === 1 ? <>
            <button className="guide-back" type="button" onClick={() => setStage(0)}><ArrowLeft size={15}/> Review token instructions</button>
            <div className="instruction-card"><div className="instruction-icon"><KeyRound size={20}/></div><div><strong>Your token needs one repository</strong><p>Contents: read and write · Metadata: read-only. The resource owner must match the repository owner.</p></div></div>
            <label className="field-label" htmlFor="github-token">PERSONAL ACCESS TOKEN</label>
            <div className="token-field"><LockKeyhole size={18}/><input id="github-token" type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} placeholder="github_pat_••••••••••••••" value={token} onChange={event => setToken(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && token.trim()) void connect(); }}/><button type="button" onClick={() => setVisible(value => !value)}>{visible ? 'HIDE' : 'SHOW'}</button></div>
            <p className="field-hint"><ShieldCheck size={14}/> Your token stays in Chrome local storage. It is never sent to LeetCode.</p>
            <Button disabled={!token.trim() || busy} onClick={() => void connect()}>{busy ? <>Validating <RefreshCw size={16} className="spin"/></> : <>Validate and continue <ArrowRight size={17}/></>}</Button>
          </> : stage === 2 ? <>
            <div className="connected-identity"><span className="connected-icon"><Github size={20}/></span><span><small>GITHUB CONNECTED</small><strong>@{config.githubUsername}</strong></span><Check size={17}/></div>
            <button className="guide-back" type="button" onClick={() => setStage(0)}><ArrowLeft size={15}/> Review setup guide</button>
            <div className="section-inline"><label className="field-label" htmlFor="repository-select">TARGET REPOSITORY</label><button className="text-action" onClick={() => void send({ action: 'REPOSITORIES' }).then(result => setRepositories((result.repositories as { full_name: string }[]).map(item => item.full_name))).catch(err => setError((err as Error).message))}><RefreshCw size={14}/> Refresh</button></div>
            <div className="select-wrap"><Github size={18}/><select id="repository-select" value={repository} onChange={event => setRepository(event.target.value)}><option value="">Select an existing repository</option>{repositories.map(name => <option value={name} key={name}>{name}</option>)}</select><ChevronRight size={16}/></div>
            {repositories.length === 0 && <p className="field-hint">No repositories listed yet. Check the token’s resource owner, selected repository, and Contents permission, then refresh.</p>}
            <label className="field-label mode-heading">COMMIT MODE</label>
            <div className="mode-grid"><button className={`mode-card ${mode === 'manual' ? 'mode-card--selected' : ''}`} onClick={() => setMode('manual')}><span className="mode-radio"/><strong>Manual</strong><small>Review each solution before pushing.</small></button><button className={`mode-card ${mode === 'automatic' ? 'mode-card--selected' : ''}`} onClick={() => setMode('automatic')}><span className="mode-radio"/><strong>Automatic</strong><small>Commit as soon as it is accepted.</small></button></div>
            <Button disabled={!repository || busy} onClick={() => void finish()}>{busy ? 'Checking permissions…' : <>Finish setup <ArrowRight size={17}/></>}</Button>
          </> : <>
            <div className="setup-complete"><span><Check size={24}/></span><div><strong>{repository}</strong><p>{mode === 'automatic' ? 'Accepted solutions will be saved locally and queued for upload.' : 'Accepted solutions will be saved locally. You can choose when to upload each one.'}</p></div></div>
            <div className="next-steps"><h3>Try your first solve</h3><p>Open a LeetCode problem and submit an accepted solution. Then use the extension icon to check its saved and upload status.</p><a href="https://leetcode.com/problemset/" target="_blank" rel="noopener noreferrer">Open LeetCode problems <ArrowUpRight size={15}/></a></div>
            <Button onClick={() => window.location.assign(chrome.runtime.getURL('dashboard.html'))}>Open your dashboard <ArrowRight size={17}/></Button>
          </>}
          <div className="form-footer"><PrivacyBadge/><span>NO BACKEND · NO TRACKERS</span></div>
        </div>
      </main>
    </div>
  </div>;
}
