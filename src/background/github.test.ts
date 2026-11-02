import { afterEach, describe, expect, it, vi } from 'vitest';
import { commitSolution, pullRepository } from './github';
import type { Submission } from '../shared/types';
const s: Submission = {submissionId:'123',problemId:'1',problemSlug:'two-sum',problemTitle:'Two Sum',problemUrl:'https://leetcode.com/problems/two-sum/',difficulty:'Easy',topics:['Array'],language:'cpp',sourceCode:'int main() {}',submittedAt:'2026-01-01T00:00:00.000Z',accepted:true};
afterEach(()=>vi.unstubAllGlobals());
describe('GitHub commit engine',()=>{
  it('treats a repository with no branches as an empty sync source',async()=>{
    const calls:string[]=[];
    const responses=[
      {status:200,body:{default_branch:'main',permissions:{push:true}}},
      {status:409,body:{message:'Git Repository is empty.'}},
      {status:200,body:[]}
    ];
    vi.stubGlobal('fetch',vi.fn(async (url:string)=>{calls.push(url);const next=responses.shift()!;return new Response(JSON.stringify(next.body),{status:next.status});}));
    await expect(pullRepository('testtoken','owner/repo')).resolves.toEqual({records:[],empty:true});
    expect(calls[2]).toBe('https://api.github.com/repos/owner/repo/branches?per_page=1');
  });
  it('initializes an empty repository with the first solution and completes the remaining files',async()=>{
    const calls:{url:string;init:RequestInit}[]=[];
    const responses=[
      {status:200,body:{default_branch:'main',permissions:{push:true}}},
      {status:409,body:{message:'Git Repository is empty.'}},
      {status:200,body:[]},
      {status:201,body:{commit:{sha:'a'.repeat(40)}}},
      {status:200,body:{object:{sha:'a'.repeat(40)}}},
      {status:200,body:{sha:'a'.repeat(40),tree:{sha:'b'.repeat(40)}}},
      {status:200,body:{sha:'b'.repeat(40),tree:[{path:'Array/Easy/0001-Two-Sum/solution.cpp',sha:'placeholder',type:'blob'}]}},
      {status:201,body:{sha:'c'.repeat(40)}},
      {status:201,body:{sha:'d'.repeat(40)}},
      {status:200,body:{object:{sha:'d'.repeat(40)}}}
    ];
    vi.stubGlobal('fetch',vi.fn(async (url:string,init:RequestInit)=>{calls.push({url,init});const next=responses.shift()!;return new Response(JSON.stringify(next.body),{status:next.status});}));
    const result=await commitSolution('testtoken','owner/repo',s,undefined,[s],[],true);
    expect(result.sha).toBe('d'.repeat(40));
    expect(calls[3]!.url).toBe('https://api.github.com/repos/owner/repo/contents/Array/Easy/0001-Two-Sum/solution.cpp');
    const initial=JSON.parse(calls[3]!.init.body as string);
    expect(atob(initial.content)).toBe(s.sourceCode);
    expect(calls[7]!.url).toBe('https://api.github.com/repos/owner/repo/git/trees');
  });
  it('rejects a malicious branch name before following a repository response',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({default_branch:'../../user',permissions:{push:true}}),{status:200}));
    vi.stubGlobal('fetch',fetcher);
    await expect(commitSolution('testtoken','owner/repo',s,undefined,[s],[],true)).rejects.toMatchObject({code:'BAD_RESPONSE'});
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('uses fixed GitHub endpoints and publishes one atomic tree commit',async()=>{
    const calls: {url:string;init:RequestInit}[]=[];
    const responses = [
      {default_branch:'main',permissions:{push:true}},
      {object:{sha:'a'.repeat(40)}},
      {sha:'a'.repeat(40),tree:{sha:'b'.repeat(40)}},
      {sha:'b'.repeat(40),tree:[]},
      {sha:'c'.repeat(40)},
      {sha:'d'.repeat(40)},
      {object:{sha:'d'.repeat(40)}}
    ];
    vi.stubGlobal('fetch',vi.fn(async (url:string,init:RequestInit)=>{calls.push({url,init});return new Response(JSON.stringify(responses.shift()),{status:calls.length===5||calls.length===6?201:200,headers:{'Content-Type':'application/json'}})}));
    const result=await commitSolution('testtoken','owner/repo',s,undefined,[s],[],true);
    expect(result).toEqual({sha:'d'.repeat(40),path:'Array/Easy/0001-Two-Sum/solution.cpp',changed:true});
    expect(calls.every(c=>c.url.startsWith('https://api.github.com/repos/owner/repo'))).toBe(true);
    expect(calls.every(c=>(c.init.headers as Record<string,string>).Authorization==='Bearer testtoken' && c.init.redirect==='error')).toBe(true);
    const treeBody=JSON.parse(calls[4]!.init.body as string);
    expect(treeBody.tree.map((x:{path:string})=>x.path)).toEqual(['Array/Easy/0001-Two-Sum/solution.cpp','Array/Easy/0001-Two-Sum/README.md','Array/Easy/0001-Two-Sum/solution.cpp.leetcode.json','README.md']);
    expect(JSON.parse(calls[6]!.init.body as string).force).toBe(false);
  });
});
