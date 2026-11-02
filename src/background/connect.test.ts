import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('GitHub connection from onboarding tab', () => {
  it('accepts a valid token message and stores the token only after GitHub confirms identity', async () => {
    const id = 'abcdefghijklmnopabcdefghijklmnop';
    let listener: ((request: unknown, sender: chrome.runtime.MessageSender, respond: (result: unknown) => void) => boolean | void) | undefined;
    const saved: Record<string, unknown>[] = [];
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer github_pat_example');
      return new Response(JSON.stringify({ login: 'example-user' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('chrome', {
      runtime: {
        id, getURL: (path: string) => `chrome-extension://${id}/${path}`,
        getManifest: () => ({ version: '0.1.1' }),
        onInstalled: { addListener: vi.fn() }, onStartup: { addListener: vi.fn() },
        onMessage: { addListener: (callback: typeof listener) => { listener = callback; } }
      },
      alarms: { onAlarm: { addListener: vi.fn() } },
      storage: { local: { get: async () => ({}), set: async (value: Record<string, unknown>) => { saved.push(value); } } }
    });
    await import('./index');
    const response = await new Promise<Record<string, unknown>>(resolve => {
      listener!({ action: 'CONNECT', payload: { token: 'github_pat_example' } },
        { id, url: `chrome-extension://${id}/onboarding.html`, tab: { id: 1 } as chrome.tabs.Tab },
        result => resolve(result as Record<string, unknown>));
    });
    expect(response).toMatchObject({ ok: true, username: 'example-user' });
    expect(saved[0]).toMatchObject({ githubToken: 'github_pat_example', settings: { githubUsername: 'example-user' } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
