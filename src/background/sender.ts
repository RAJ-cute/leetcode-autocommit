import type { Request } from '../shared/types';

export type SenderContext = 'content' | 'extension' | 'invalid';

// Extension pages opened in a browser tab also have sender.tab. Classify by
// the browser-supplied URL first, rather than treating every tab as a content script.
export function senderContext(
  sender: Pick<chrome.runtime.MessageSender, 'id' | 'url' | 'tab'>,
  extensionId: string,
  extensionOrigin: string
): SenderContext {
  if (!sender.url || (sender.id && sender.id !== extensionId)) return 'invalid';
  if (sender.url.startsWith(extensionOrigin) && new URL(sender.url).origin === new URL(extensionOrigin).origin) return 'extension';
  if (sender.id === extensionId && sender.tab && /^https:\/\/leetcode\.com\//.test(sender.url)) return 'content';
  return 'invalid';
}

export function actionAllowed(context: SenderContext, request: Request): boolean {
  if (context === 'extension') return request.action !== 'CAPTURE' && request.action !== 'SAVE_ACCEPTANCE';
  if (context === 'content') return request.action === 'CAPTURE' || request.action === 'SAVE_ACCEPTANCE' || request.action === 'OPEN_DASHBOARD';
  return false;
}
