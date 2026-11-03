# LeetCode AutoCommit

A local-first Chrome MV3 extension for saving accepted LeetCode submissions and committing them to a user-selected GitHub repository. It has no backend or telemetry.

## Build and load

1. Run `npm install` and `npm run build`.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/`.
3. Chrome opens the first-install tutorial automatically. It walks through creating a repository, generating a fine-grained PAT for that repository with **Contents: read and write** and **Metadata: read-only**, connecting GitHub, and choosing an upload mode.
4. After setup, submit an accepted LeetCode solution and check its status from the extension icon or dashboard.

After rebuilding an already loaded unpacked extension, click **Reload** on its card at `chrome://extensions`, then reopen the onboarding or dashboard page. Chrome continues running the previous service worker until the extension is reloaded.

If setup shows **“older extension worker”**, use its **Reload extension** button. Then reopen the extension icon. If the old “Invalid request” text still appears, remove the older unpacked copy and load the current `dist/` folder again. The onboarding header should show **BUILD 0.1.9**.

The extension records accepted submissions locally. Manual mode opens a prompt where you can add a comment, mark revision, push, or save for later. The dashboard supports further editing. Automatic mode queues the same commit engine immediately. Settings provides JSON backup import, export, and local deletion controls.

Each GitHub commit includes a solution, problem README, structured metadata, and a managed section in the root README. Manual sync reads only validated metadata files, restores committed solutions, and reports conflicts without replacing divergent local source code.

The onboarding, dashboard, popup, settings, and post-acceptance prompt share an ivory, lavender, and navy design system. A development-only UI fixture is available at `preview.html` when running Vite; it is not included in `dist/`.

## Important limitation

LeetCode does not publish a stable API for extension submission capture. This version requires a visible Accepted result with a numeric submission ID, then requests that submission's code from LeetCode's private GraphQL endpoint. If the endpoint, data shape, or DOM changes, capture stops rather than committing current editor text. See [DEVELOPMENT.md](DEVELOPMENT.md).

No live LeetCode or GitHub account workflow has been verified in this workspace. Treat this as a development build until the manual acceptance checklist passes.
