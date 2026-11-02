import { afterEach, describe, expect, it, vi } from 'vitest';
import { send } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('onboarding request recovery', () => {
  it('trims pasted token whitespace before messaging the service worker', async () => {
    const sendMessage = vi.fn(async () => ({ ok: true, username: 'example' }));
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    await send({ action: 'CONNECT', payload: { token: '  github_pat_example\n' } });
    expect(sendMessage).toHaveBeenCalledWith({ action: 'CONNECT', payload: { token: 'github_pat_example' } });
  });
  it('explains the legacy worker response instead of blaming the token', async () => {
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn(async () => ({ ok: false, error: 'Invalid request' })) } });
    await expect(send({ action: 'CONNECT', payload: { token: 'github_pat_example' } })).rejects.toThrow('older extension worker');
  });
});
