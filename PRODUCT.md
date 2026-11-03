# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

LeetCode solvers who want their accepted code, revision notes, and GitHub archive available during daily practice.

## Product Purpose

LeetCode AutoCommit captures accepted submissions in the browser, keeps a local record of solutions and notes, and commits selected work to a user chosen GitHub repository. A successful session lets the user see what was saved, what needs review, and whether GitHub sync needs attention.

## Operating Context

The product is a Chrome Manifest V3 extension used alongside LeetCode and GitHub. The user connects GitHub with a fine grained personal access token, selects an existing repository, and chooses manual or automatic commits. The popup serves quick access; the dashboard supports review, search, revision tracking, analytics, activity, and settings.

## Capabilities and Constraints

- Accepted code and notes are stored locally before GitHub sync.
- GitHub writes use the selected repository; the extension has no backend or telemetry.
- Manual sync can restore validated committed records and report conflicts without overwriting divergent local source.
- The extension must communicate clear connection, pending upload, failed upload, empty, and first run states.
- LeetCode capture depends on a visible Accepted result and its private submission code endpoint, which may change.
- No live LeetCode or GitHub account flow has been verified in this workspace.

## Brand Commitments

The product name is LeetCode AutoCommit. The interface should describe actual stored or synced work without invented achievement claims.

## Evidence on Hand

The repository has a working React UI, local preview fixture, and automated tests. Preview records are synthetic. There are no supplied testimonials, public usage figures, or approved photographic assets.

## Product Principles

- Make the next useful action obvious during daily practice.
- Represent local and GitHub state accurately.
- Keep setup, retry, and recovery understandable without exposing credentials.
- Preserve a fast path from a saved solution to its code and notes.
