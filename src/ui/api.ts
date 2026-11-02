import type { Job, Request, Settings } from '../shared/types';

export interface ExtensionStatus {
  settings: Settings;
  connected: boolean;
  jobs: Job[];
}

const errorMessages: Record<string, string> = {
  'Invalid request': 'This page is connected to an older extension worker. Reload the extension, then reopen setup.',
  AUTH_INVALID: 'GitHub rejected this token. Check that it has not expired or been revoked.',
  FORBIDDEN_OR_RATE_LIMITED: 'GitHub refused the request. Check repository access and rate limits.',
  NO_WRITE_PERMISSION: 'This token cannot write to the selected repository. Grant Contents read/write.',
  NETWORK: 'Could not reach GitHub. Check your connection and try again.',
  NOT_FOUND: 'GitHub could not find this repository with the current token.',
  INVALID_REPOSITORY: 'Choose a valid repository from the list.',
  BAD_RESPONSE: 'GitHub returned an unexpected response. Try again shortly.',
  HTTP_409: 'GitHub reported a repository conflict. If this repository was just created, wait a moment and try sync again.'
};

export async function send(request: Request): Promise<Record<string, any>> {
  const normalized: Request = request.action === 'CONNECT'
    ? { action: 'CONNECT', payload: { token: request.payload.token.trim() } }
    : request;
  const response: unknown = await chrome.runtime.sendMessage(normalized);
  if (!response || typeof response !== 'object' || !('ok' in response)) throw new Error('The extension did not respond. Reload it and try again.');
  const result = response as Record<string, any>;
  if (!result.ok) {
    const code = typeof result.error === 'string' ? result.error : 'The action failed.';
    throw new Error(errorMessages[code] || code);
  }
  return result;
}
