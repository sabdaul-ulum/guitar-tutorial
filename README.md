# Petik — Next.js guitar learning

## Getting started

The application uses Next.js 16.4.0 App Router, React 19.3.0, Pitchy 4.1.0, and Meyda 5.6.3. Dependency versions are locked in `package-lock.json`.

Use Node.js 24 LTS (`.nvmrc`):

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build && npm start` for a local production build. Run `npm test` for exercise rules, curriculum validation, and synthetic audio tests. CI runs installation, tests, build, whitespace checks, and a production dependency audit.

## Lessons and routes

Ten practice courses contain 51 microphone exercises: single chords, transitions and strumming. All lessons are available without prerequisites. No theory-only guides or manual completion.

- `/`: learning overview.
- `/setup`: input selection, optional AGC, and dBFS diagnostics.
- `/tuner`: single-note tuning with an animated low/high indicator and string selector.
- `/learn`: course catalog.
- `/learn/[id]`: individual exercises.
- `/transitions`: legacy transition catalog URL; sidebar exercises appear only under their courses.

Single-chord introductions finish after string checks (which may be skipped) and five accepted strums. All exercises show a completion dialog with next-lesson and retry actions; retry preserves saved completion. Navigation groups are collapsible, the active course opens automatically, and Continue practice selects the first unfinished lesson. Below 801 px, navigation opens in a fullscreen keyboard-accessible menu. Transition exercises choose a random chord without immediate repetition every four beats. Basic strumming runs at 60–80 BPM; alternating eighth-note strumming and D D U U D U syncopation run at 40–80 BPM, all in 10 BPM steps. Pick direction is guidance only, not detected by the microphone.

Song exercises and guide routes are removed. Existing exercise IDs preserve saved progress; obsolete IDs are filtered out.

Rhythm exercises have an initial four-beat countdown; resuming or restarting a segment does not repeat it. Passing requires at least 13/16 correct targets at the maximum tempo. Simulation does not save completion.

## Audio and progress

Meyda extracts a spectrum from one continuous 16384-sample analyser snapshot approximately 420 ms after onset, not from stitched 2048-sample tuner snapshots. FFT duration varies at 44.1/48/96 kHz. The scheduler separates visual targets from delayed results and matches onset timestamps against the target chord. Pausing, resuming, and restarting segments discard pending targets.

Reconnect the microphone to recover suspended audio and recalibrate. Remain quiet during the two-second calibration. Calibration uses the median signal level, a threshold 10 dB above the noise floor, and relative dB onset detection. A 60 Hz high-pass filter reduces rumble; it does not disable system voice isolation. AGC is disabled by default, and diagnostics show the browser's actual input settings.

Single-note validation requires a pitch within 35 cents of the target and clarity of at least 0.9. These thresholds need validation against real guitar recordings; they are not universal accuracy guarantees. The dBFS meter makes quiet signals visible, not proof of chord recognition. If the guitar is not captured, check input selection, system voice isolation, input gain, and microphone distance, then recalibrate in silence.

Progress schema v2 and microphone resources are shared through the layout. The microphone stays active across navigation until disconnected through the input panel. Unfinished exercise attempts are not saved when navigating. Audio stays on the device and is not uploaded. Stored progress is validated; storage failures retain session progress and show a warning. Completion from older prototypes is not imported.

## Structure and limitations

- `app/`: Next.js routes, metadata, layout composition, and additional styles.
- `components/guitar/`: shared guitar diagrams and string controls.
- `components/layout/`: application navigation and shell.
- `features/learning/components/`: lesson and practice views.
- `features/learning/hooks/`: React practice orchestration and effect lifecycles.
- `features/learning/domain/`: curriculum, adaptive exercise rules, and rhythm scheduling.
- `features/audio/components/`: microphone provider, input controls, and tuner.
- `features/audio/lib/`: Web Audio adapter and signal/chord analysis.
- `features/progress/`: progress validation, serialization, and storage provider.
- `app/globals.css`: global base design tokens and animations; Tailwind CSS v4 utility classes across components.

Tests live beside their domain or audio module. Dependencies use explicit imports, not barrel exports. Keep browser APIs inside adapters, providers, and hooks; domain modules remain deterministic when supplied a clock or random source. `usePracticeSession` owns practice behavior; `Practice` renders it. React effect events keep microphone and timer callbacks synchronized with committed state without resubscribing on each frame.

Internal identifiers, comments, tests, and developer documentation use English. User-facing UI and lesson instructions remain Indonesian.

Polyphonic chord recognition is experimental. Automatic latency calibration and an audible metronome are not implemented. Timing uses `performance.now()` and main-thread intervals, not an AudioWorklet scheduler. Noise or clipping pauses rhythm practice. String checks confirm pitch, not which physical string was played.

`ponytail:` the microphone pipeline still has a 650 ms onset debounce and approximately 420 ms analysis delay. Eighth-note targets above roughly 46 BPM can be missed; the configured 80 BPM ceiling is a practice goal, not validated microphone support. Upgrade attack capture and validate real guitar before claiming reliable fast-strum scoring.

## Curriculum rationale

Courses progress through A/D, E, minor chords, C/G, eighth-note strumming before syncopation, Dsus2/Dsus4/Asus2, dominant sevenths, power chords and major/minor barre chords (F, Bm, Gm, B). Each new chord has single-string checks before transition exercises. Open-to-barre transitions precede mixed barre practice. Seventh and sus2 detection requires fundamental-note evidence to avoid harmonic leakage, and rejects audible added tones when checking simpler chord subsets. E7/A7/D7 and Cmaj7/Am7 have introductions and transitions. Synthetic all-pairs tests cover ±20-cent detuning; real-guitar microphone validation is still required. Palm mute, fingerstyle and slash chords require technique-specific assessment. These courses cover basic to intermediate chord accompaniment, not a complete advanced syllabus. Only skills supported by audio practice appear in the catalog. BPM limits and scoring are app-specific. Tuning is available through `/tuner`; stop if playing hurts.

## Release validation

Synthetic tests do not establish real guitar accuracy. See `CONTRIBUTING.md` for browser, keyboard, mobile, permission, disconnected-input, storage-failure, and guitar/Scarlett checks at 44.1/48/96 kHz. Report checks that were not performed.

References: https://github.com/ianprime0509/pitchy · https://meyda.js.org/audio-features
