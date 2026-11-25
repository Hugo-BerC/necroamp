# GitHub Actions monitoring

Scope: read-only monitoring of workflow runs for repositories the user chose. Field and status names below are ASSUMED. Confirm on `https://docs.github.com/` before writing schemas. Notification sounds are open decision 15 (needs human decision).

## Data model (design, for `src/shared/github/`)

| Concept | Fields the UI needs |
|---|---|
| Watched repository | owner, name, enabled flag |
| Workflow run | id, workflow name, branch, event, status, conclusion (nullable), started time, updated time, URL to the run page |
| Run status | A closed enum from the docs, for example queued, in progress, completed. Unknown values map to `unknown`, never crash. |
| Conclusion | A closed enum from the docs, for example success, failure, cancelled. Unknown maps to `unknown`. |

Schemas are strict about types and lenient about extra provider fields (strip them). Enums accept unknown strings through a fallback so a new provider value does not break the monitor.

## Polling

1. Poll only watched repositories, only while signed in, online, and monitoring is enabled.
2. Interval is a parameter with a minimum. Default is chosen with the cache and rate-limit note, not hard-coded in the poller.
3. Use conditional requests. A not-modified reply costs little and produces no event.
4. Back off when nothing is in progress. Poll faster only while a run is in progress, within the floor.
5. Skip a cycle when the rate-limit state is `limited` or below the threshold.
6. Stop on sign-out, window close and when the user disables monitoring. Cancel in-flight requests.
7. The app window hidden or minimized does not stop monitoring, because notifications are the point. A setting to pause is the user's choice. ASSUMED: acceptable. Confirm with the product owner.

## Transition detection

Pure function `diff(previousRuns, currentRuns) -> events`:
- New run seen: `run-started` only if it is not already completed.
- Status change: `run-progressed`.
- Completed: `run-completed` with the conclusion.
- Unchanged: no event.
- First poll after sign-in or a long gap seeds state and emits no events, to avoid a notification burst.

Property tests (qa-engineer): replaying the same snapshot twice emits no events; events never reference a run absent from the input; ordering is deterministic.

## Notifications

- The monitor emits typed events. A separate notifier maps events to user-visible output. GitHub code never plays audio.
- Which events notify, and sound assets, are user settings and decision 15. Default behavior: none until enabled.
- Notification text uses fields validated as strings with length caps. Treat workflow and branch names as untrusted text: render as plain text, never HTML.
- Opening a run page goes through the allow-listed external-link wrapper.

## Failure behavior

- `unauthenticated`: stop polling, set signed-out.
- `rate-limited`: pause until reset and tell the UI.
- `network`: apply backoff and mark state offline.
- `not-found`: mark the watched repository unavailable. Do not remove it automatically.
- `validation`: skip that cycle, log without payload.

## Tests

- Fake clock drives polling. No real waiting.
- Recorded or hand-written run list fixtures with fake names. Fixtures go in `src/main/github/__fixtures__/`.
- Transition table tests, first-poll seeding, unknown enum values, sign-out stopping the poller, rate-limit pause.
- No test uses a real token or network.
