# Development standards

## Required principles

- Use English for identifiers, comments, test descriptions, and developer documentation. Keep user-facing UI, accessibility labels, errors, and lesson instructions in Indonesian.
- Prefer descriptive names and focused functions. Avoid multiple statements on one line; format JSX so control flow is easy to review.
- Separate exercise rules, audio analysis, session management, storage, and rendering. Domain modules must not access the DOM, microphone, or `localStorage`.
- Apply DRY only to genuinely shared rules, KISS for simple solutions, and YAGNI: do not add abstractions or dependencies without a concrete need.
- Validate inputs at trust boundaries. Report invalid configuration explicitly instead of silently producing incorrect values.
- Use named thresholds and a single source of truth. Document timing units (seconds/ms), tempo (BPM), and detection threshold rationale.
- Render untrusted text through React escaping or `textContent`, never `innerHTML`. HTML templates must contain only controlled internal data.
- Handle microphone permission errors, ended tracks, AudioContext state, timers, and event listeners with appropriate cleanup. Never upload audio without explicit consent.
- Provide control labels, keyboard navigation, visible focus, accessible status messages, and reduced-motion support.
- Treat stored progress as untrusted input: validate its schema and provide a fallback. Never assume storage is available.

## Testing and review

- Behavior changes require tests for normal cases, boundaries, invalid inputs, and regressions.
- Domain tests must be deterministic and must not require a microphone.
- Synthetic tests do not establish real guitar accuracy. Detection changes need labelled recordings and real-device testing before being described as reliable.
- Before delivery, run tests, a production build, and whitespace checks. Review changed files and update documented limitations.
- UI changes need browser, keyboard, and target-viewport checks when facilities are available. Report checks that were not performed.
- Do not claim a feature works merely because its UI exists.
- Prefer small, behavior-preserving refactors. Do not rewrite audio or scheduling code for formatting alone.

## Quality gate

Use Node 24 LTS (`.nvmrc`):

```sh
npm ci
npm run check
git diff --check
npm audit --omit=dev
```

CI uses the same commands. `npm run check` performs strict TypeScript checking, runs tests, and builds production output. `.editorconfig` defines two-space indentation and LF line endings. There is no custom scripts folder or formatter/linter gate. New tests use `node:test`; do not add another framework without a concrete need. `git diff --check` checks tracked diffs only; review untracked files separately.

## Pre-release checklist

- Chrome, Firefox, Safari: denied permission, missing/disconnected input, reconnect, suspended AudioContext, and hidden tabs.
- Keyboard: all navigation, input controls, dialog focus, Escape, and focus restoration. Check reduced motion, a 320 px viewport, and mobile devices.
- Rhythm: initial-only countdown, moving targets while analysis is delayed, variable intervals, tempo increases/decreases, segment restart, and pause/resume/retry rejecting stale onsets.
- Storage: blocked/full storage, corrupted JSON, reload, and cross-tab synchronization. Success messages must not claim persistence when saving fails.
- Real guitar and Scarlett at 44.1/48/96 kHz: labelled correct/incorrect chords, E5 versus E/Em, A5 versus A/Am, noise, clipping, detuning, low gain, and latency.
- Record the browser, OS, actual sample rate, input, gain, results, and failures. Synthetic tests do not replace this checklist.

`ponytail:` scheduling remains on the main thread and syncopation is capped at 40 BPM. Add an AudioWorklet or faster attack pipeline only if device tests demonstrate unacceptable jitter or insufficient tempo support.
