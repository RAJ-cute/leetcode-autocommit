# Development

## Architecture

- `src/content`: watches LeetCode SPA DOM for submission detail links, fetches exact code for a confirmed Accepted submission ID, then sends a bounded validated record.
- `src/background`: owns GitHub credentials and authenticated API calls, queues persistent jobs, and retries with alarms.
- `src/shared`: strict message checks, IndexedDB v1 schema, deterministic paths and README generation.
- `src/ui`: extension-owned React pages with local database access. UI GitHub operations route through the service worker.

The service worker identifies extension pages by their browser-supplied `chrome-extension://` URL even when they are open in a tab. This fixes the onboarding token request being rejected as a content-script request. `src/background/sender.test.ts` covers this case.

## Capture method and limits

The content script arms after a Submit-button click, observes DOM changes and history navigation, and requires a result timestamp after that click. It extracts a numeric ID from a submission detail route or Accepted result link. When no link is present, it asks LeetCode for the latest submission for that problem and uses the ID only if it is Accepted and recent. It then queries `submissionDetails` and requires status code `10` plus nonempty `code`. It separately fetches question metadata. It never reads the editor. Unconfirmed results remain eligible for retry when the page updates.

This is a private LeetCode GraphQL operation, so the field set and availability can change. LeetCode's public help says submitted code can be found on the submission detail page, but it does not guarantee this endpoint. A real browser test with a signed-in LeetCode account is required. The current DOM association is conservative but needs testing across the latest site variants. If a confirmed ID is not discoverable, capture does nothing.

## Implemented phases

1. Foundation: MV3, Vite, strict TypeScript, content/service-worker isolation, IndexedDB stores, design tokens.
2. Authentication: fine-grained PAT validation, repository listing, write permission check, replacement and disconnect.
3. UI: onboarding, extension popup, post-acceptance prompt, dashboard, problems, notes, revision status, analytics, settings.
4. Capture: accepted-ID flow and exact-code query, with fail-closed behavior.
5. GitHub: atomic Git tree/commit/reference flow, generated README sections that preserve unrelated content, and structured metadata files; one engine for both modes.
6. Queue: persistent manual and automatic jobs, alarm retries, duplicate job keys.

## Open work before release

- Live signed-in LeetCode and GitHub end-to-end tests, including account variants and Chrome restart recovery.
- Complete dashboard filters, richer chart breakdown, and deeper cross-device conflict resolution. Manual sync imports validated committed records and keeps newer local notes, but does not merge divergent source code.
- Robust ambiguous network response reconciliation and conflict detection for externally edited README files.
- Chrome Web Store packaging, icon assets, accessibility review, and browser automation.

Do not publish this build as production-ready before these are completed.
