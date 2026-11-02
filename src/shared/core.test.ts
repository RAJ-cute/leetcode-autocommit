import { describe, expect, it } from 'vitest';
import { validRequest, validSubmission, type Submission } from './types';
import { problemReadme, rootReadme, solutionPath } from './generate';
const s: Submission = {submissionId:'123',problemId:'1',problemSlug:'two-sum',problemTitle:'Two Sum',problemUrl:'https://leetcode.com/problems/two-sum/',difficulty:'Easy',topics:['Array','Hash Table'],language:'cpp',sourceCode:'int main() {}',submittedAt:'2026-01-01T00:00:00.000Z',accepted:true};
describe('capture validation',()=>{
  it('accepts exact accepted submission and rejects false or oversized data',()=>{expect(validSubmission(s)).toBe(true);expect(validSubmission({...s,accepted:false})).toBe(false);expect(validSubmission({...s,sourceCode:'x'.repeat(500001)})).toBe(false);});
  it('rejects privileged actions with unexpected fields',()=>{expect(validRequest({action:'QUEUE',payload:{submissionId:'123',url:'https://evil.example'}})).toBe(false);expect(validRequest({action:'CAPTURE',payload:{...s,token:'secret'}})).toBe(false);});
});
describe('repository generation',()=>{
  it('normalizes paths and does not permit traversal',()=>{expect(solutionPath({...s,problemTitle:'../../Two Sum',topics:['../Array']})).not.toContain('..');});
  it('keeps unsupported languages in separate files',()=>{expect(solutionPath({...s,language:'elixir'})).not.toBe(solutionPath({...s,language:'haskell'}));});
  it('counts unique problems once',()=>{const readme=rootReadme([s,{...s,submissionId:'456',language:'python3'}],[]);expect(readme).toContain('| 1 | 1 | 0 | 0 | 2 | 2 |');});
  it('escapes user content in Markdown',()=>{expect(problemReadme(s,{problemId:'1',revisionStatus:'none',revisionPriority:'medium',personalComment:'[bad](https://evil.example)',approachNotes:'',timeComplexity:'',spaceComplexity:'',updatedAt:''})).toContain('\\[bad\\]');});
});
