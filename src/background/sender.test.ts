import { describe, expect, it } from 'vitest';
import { actionAllowed, senderContext } from './sender';

const id = 'abcdefghijklmnopabcdefghijklmnop';
const origin = `chrome-extension://${id}/`;

describe('message sender isolation', () => {
  it('accepts onboarding opened in a tab as an extension page', () => {
    const context = senderContext({ id, url: `${origin}onboarding.html`, tab: { id: 1 } as chrome.tabs.Tab }, id, origin);
    expect(context).toBe('extension');
    expect(actionAllowed(context, { action: 'CONNECT', payload: { token: 'github_pat_test' } })).toBe(true);
    expect(senderContext({ url: `${origin}onboarding.html`, tab: { id: 1 } as chrome.tabs.Tab }, id, origin)).toBe('extension');
  });
  it('keeps privileged requests out of LeetCode content scripts', () => {
    const context = senderContext({ id, url: 'https://leetcode.com/problems/two-sum/', tab: { id: 2 } as chrome.tabs.Tab }, id, origin);
    expect(context).toBe('content');
    expect(actionAllowed(context, { action: 'CONNECT', payload: { token: 'github_pat_test' } })).toBe(false);
  });
  it('rejects other origins and other extensions', () => {
    expect(senderContext({ id, url: 'https://example.com/', tab: { id: 3 } as chrome.tabs.Tab }, id, origin)).toBe('invalid');
    expect(senderContext({ id: 'other', url: `${origin}dashboard.html` }, id, origin)).toBe('invalid');
  });
});
