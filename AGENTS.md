# AGENTS.md

Static, no-build classroom app for sequential English exercises. Students open each external activity in order; the teacher approves each one with a password. `README.md` has the Portuguese product overview.

## Run and verify

- Serve over HTTP; opening `index.html` via `file://` will not load the ES modules:
  `python3 -m http.server 8000` then open `http://localhost:8000`.
- No package manager, build, lint, or test suite exists. Do not add one for routine lesson changes.
- Syntax-check the JS with `node --check app.js && node --check config.js`. UI/state changes require a manual browser check.
- Tailwind and fonts come from CDNs, so the page needs network access.

## Where to edit

- Daily lesson changes go in `config.js` only: `appConfig` (titles, texts, `storagePrefix`, favicon) and the ordered `lessons` array. `app.js` is generic; `index.html` is the shell/theme.
- Array order is the unlock order. Lesson N stays locked until lesson N-1 is approved (`app.js:327`).
- Keep lesson `id`s stable within the same lesson: they are `sessionStorage` keys. Changing an id resets that lesson's state; changing `storagePrefix` resets all progress. Storage is per-tab and clears when the tab closes.

## Lesson swaps

- When the user asks to change the links/activities, treat it as a full lesson swap, not an href-only edit. Update every topic-dependent field in `config.js` in the same change:
  - `appConfig.pageTitle`, `appConfig.subtitle`, `appConfig.progressTexts.empty`, and `appConfig.storagePrefix`
  - every lesson's `id`, `title`, `description`, and `href`, so no label from the previous topic remains.
- Assign new `id`s and a new `storagePrefix` for the new topic; this intentionally clears leftover progress. Keep them stable within that same lesson/day.
- Do not change `TEACHER_PASSWORD_HASH` unless explicitly asked.
- No `index.html` edits are needed: `appConfig` overrides the HTML fallback texts at runtime.

## Behavior to preserve

- States are `next`, `waiting_review`, `done`, `locked`. Clicking `next` opens the link and marks it waiting; clicking a `done` item intentionally does nothing; waiting items can be reopened.
- Approval compares the input against `TEACHER_PASSWORD_HASH` (SHA-256). Keep the pure-JS SHA-256 in `app.js`; `crypto.subtle` is unavailable on insecure origins such as `http://<LAN-IP>:8000`.
- Progress counts approved lessons only; waiting ones do not advance the bar.

## Repo notes

- `atividades-em-lista/` is an untracked leftover Next.js cache/`node_modules` directory (not in Git). Ignore it; it is not part of the app.
- Commits are typically direct swaps of `config.js` for the day's lesson. There is no CI configuration.
