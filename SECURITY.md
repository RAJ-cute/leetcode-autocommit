# Security

The GitHub PAT is stored only in `chrome.storage.local`, with trusted-context access restriction requested on install. Only the background service worker reads it or sends authenticated GitHub requests. Content scripts can only send capture and dashboard-open actions. Messages are checked by action, shape, size, and sender.

`chrome.storage.local` is not hardware-backed encryption. A compromised machine or browser profile may expose the PAT. Use a fine-grained token restricted to one repository and revoke it if the profile is compromised.

The build bundles code locally, uses MV3 CSP, has no telemetry, and does not render untrusted HTML. Paths are derived from normalized segments. GitHub requests use fixed `api.github.com` endpoints, request timeouts, and `redirect: error` to avoid sending credentials on redirects.

## Manual security checklist

- Inspect built content bundle and verify no token access or authenticated GitHub fetch.
- Try malformed and oversized capture messages from a content script.
- Try a token, arbitrary URL, or path traversal inside a capture payload.
- Verify repository permission failures and revoked PAT behavior.
- Test malicious problem titles and comments in dashboard and generated Markdown.
- Test GitHub redirect, rate limit, conflict, and network interruption.
- Run `npm audit` and review findings before release.

Private LeetCode API changes, local profile compromise, externally edited repository files, and uncertain GitHub results remain risks. Tests do not prove complete security.
