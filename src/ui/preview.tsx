// Development-only visual fixture. preview.html is not an entry in the extension build.
import { createRoot } from 'react-dom/client';
import { Dashboard } from './Dashboard';
import { Onboarding } from './Onboarding';
import { Popup } from './Popup';
import type { Job, Progress, Submission } from '../shared/types';
import { syncFeedback } from '../shared/sync';
import '@fontsource-variable/manrope';
import '@fontsource-variable/fredoka';
import './style.css';
import './catalog.css';

const names = [
  ['1','Two Sum','Easy','Array','cpp'],['3','Longest Substring Without Repeating Characters','Medium','Sliding Window','python3'],
  ['42','Trapping Rain Water','Hard','Two Pointers','cpp'],['53','Maximum Subarray','Medium','Dynamic Programming','java'],
  ['206','Reverse Linked List','Easy','Linked List','typescript'],['200','Number of Islands','Medium','Graph','python3'],
  ['704','Binary Search','Easy','Binary Search','rust'],['322','Coin Change','Medium','Dynamic Programming','cpp']
] as const;
const submissions: Submission[] = names.map(([problemId,problemTitle,difficulty,topic,language],index)=>({
  submissionId:String(1000+index),problemId,problemSlug:problemTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),problemTitle,
  problemUrl:`https://leetcode.com/problems/${problemTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')}/`,
  difficulty,topics:[topic],language,sourceCode:'class Solution {\n  // Accepted solution\n}',
  runtime:'2 ms',memory:'18 MB',submittedAt:new Date(Date.now()-(index*3+1)*86_400_000).toISOString(),accepted:true
}));
const progress: Progress[] = [
  {problemId:'42',revisionStatus:'pending',revisionPriority:'high',personalComment:'Revisit the two-pointer invariant.',approachNotes:'Water is bounded by the shorter side.',timeComplexity:'O(n)',spaceComplexity:'O(1)',updatedAt:new Date().toISOString()},
  {problemId:'3',revisionStatus:'completed',revisionPriority:'medium',personalComment:'Sliding window with a set.',approachNotes:'',timeComplexity:'O(n)',spaceComplexity:'O(n)',updatedAt:new Date().toISOString()}
];
const settings = {commitMode:'automatic' as const,preferredLanguage:'cpp',readmeSyncEnabled:true,automaticRetry:true,githubUsername:'developer',selectedRepository:'developer/leetcode-solutions'};
const screen = new URLSearchParams(window.location.search).get('screen');
const syncPreview = new URLSearchParams(window.location.search).has('sync-noop')
  ? syncFeedback({imported:0,conflicts:0,queued:0,retried:0,pending:0,localCount:submissions.length,empty:false})
  : undefined;
const jobs: Job[] = new URLSearchParams(window.location.search).has('failed')
  ? [{id:'developer/leetcode-solutions:1000',submissionId:'1000',targetRepository:'developer/leetcode-solutions',status:'failed',attempts:1,createdAt:new Date().toISOString(),errorCode:'NETWORK_ERROR'}]
  : [];
createRoot(document.getElementById('root')!).render(screen === 'onboarding'
  ? <Onboarding config={settings} connected={false} onRefresh={async()=>{}}/>
  : screen === 'popup'
    ? <Popup settings={settings} connected submissions={submissions} jobs={jobs} error="" notice={syncPreview?.message} openDashboard={async()=>{}} openSettings={()=>{}} sync={async()=>{}}/>
    : <Dashboard submissions={submissions} progress={progress} jobs={jobs} settings={settings} connected error="" notice={syncPreview?.message || ''} noticeTone={syncPreview?.tone} clearMessages={()=>{}} act={async()=>{}} refresh={async()=>{}}/>);
