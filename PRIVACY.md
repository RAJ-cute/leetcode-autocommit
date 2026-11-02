# Privacy

LeetCode AutoCommit stores accepted source code, problem metadata, notes, revision status, activity, and pending jobs locally in IndexedDB. It stores the GitHub PAT and settings in Chrome local storage. Data does not sync between browsers through Chrome Sync.

The extension reads submission details from LeetCode while you use LeetCode. It sends code and generated Markdown to the GitHub repository you select when you manually push or enable automatic mode. It sends the PAT only to GitHub's API in an Authorization header. There is no custom server, analytics tracker, advertising, or telemetry.

Disconnecting removes the PAT and settings but keeps local submission history. You can export a local JSON backup from Settings. Revoke the token on GitHub to immediately stop its use.
