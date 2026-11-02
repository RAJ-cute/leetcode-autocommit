// Development-only visual fixture. preview.html is not an entry in the extension build.
import { createRoot } from 'react-dom/client';
import { Dashboard } from './Dashboard';
import type { Progress, Submission } from '../shared/types';
import './style.css';

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
createRoot(document.getElementById('root')!).render(<Dashboard submissions={submissions} progress={progress} jobs={[]} settings={{commitMode:'automatic',preferredLanguage:'cpp',readmeSyncEnabled:true,automaticRetry:true,githubUsername:'developer',selectedRepository:'developer/leetcode-solutions'}} connected error="" notice="" clearMessages={()=>{}} act={async()=>{}} refresh={async()=>{}}/>);
