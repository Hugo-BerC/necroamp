# Rate limits, pagination and offline behavior

Algorithms and test cases for list calls, caching and degradation. Rules: `tech.md` (GitHub calls in main, tests offline and deterministic), `structure.md` open decision 13 (rate-limit and caching strategy needs a human decision). GitHub header names and limit values are ASSUMED until confirmed on `https://docs.github.com/`. Do not hard-code numbers from memory. Take them from responses.

## Rate-limit state

State held in main and exposed to the renderer (read-only):

| Field | Meaning |
|---|---|
| `remaining` | Calls left in the current window, from the last response |
| `limit` | Window size, from the last response |
| `resetAt` | When the window resets, as a timestamp |
| `limited` | True when a call was refused for rate reasons or `remaining` is at or below the safety threshold |

Rules:
1. Update the state from every response, success or error.
2. The safety threshold is a parameter. Below it, only user-initiated calls proceed. Background polling stops.
3. When `limited`, no request leaves the process until `resetAt`. Return `rate-limited` with `resetAt`.
4. Clock and state are injected, so tests do not wait.

## Conditional requests and caching

- Store the entity tag with each cached response (ASSUMED: the API returns one for most GET calls).
- Send it back on refresh. A "not modified" reply refreshes the cache timestamp and returns the cached body.
- Cache is in memory behind an interface: `get(key)`, `set(key, value, meta)`, `clear()`. Lifetime and maximum entries are parameters.
- Key: API host, owner, repository, path or resource, reference, query parameters. Never the token. Clear the cache on sign-out, because it may hold private content.
- Persistent caching is open decision 13. Do not write cache files until decided.

## Pagination algorithm

```
fetchPages(request, pageSize, maxPages, signal):
  results = []
  for page in 1..maxPages:
    if signal aborted: return partial result with reason "cancelled"
    items = call(request, page, pageSize)
    results += items
    if items.length < pageSize: return complete result
  return partial result with reason "page-cap"
```

Rules:
- Results carry `complete: true | false` and a reason, so the UI can offer "load more".
- Page size has an upper bound that comes from the API's documented maximum (confirm in docs).
- Total items are capped as well, to protect memory.
- Page size and cap are validated parameters, not renderer-controlled raw numbers.
- Some endpoints return wrappers (an object with a list inside). Parse with the schema for that endpoint. Do not assume an array.

## Error and retry policy

| Error | Retry? | Notes |
|---|---|---|
| `unauthenticated` (401) | No | Clear token. |
| `forbidden` (403) | No | Distinguish rate limit from missing permission. |
| `not-found` (404) | No | Also what a private repository looks like without access. ASSUMED. |
| `rate-limited` | After reset only | No retry loop. |
| `network` | Yes, bounded | Exponential backoff with jitter, ceiling, max attempts. |
| 5xx | Yes, bounded | Same as network. |
| `validation` | No | Schema mismatch. Surface and log without payload. |

Backoff is a pure function `(attempt, base, ceiling, random) -> delay`. Property test: the delay never exceeds the ceiling and never decreases as the attempt grows (before jitter).

## Offline behavior

1. Treat repeated `network` errors as offline. No extra probe requests to other hosts.
2. Return cached data with `stale: true` and `fetchedAt`, or an `offline` error if nothing is cached.
3. Pause Actions polling while offline. Resume with backoff, and resume at once after a successful user-initiated call.
4. Never block app startup, playback or other features on GitHub state.
5. The UI is told the state (`online`, `offline`, `rate-limited`, `signed-out`) so it can show a plain label.

## Test cases (fake clock, fake fetch, no token)

- Remaining at threshold: background poll skipped, user call proceeds.
- Remaining zero: no request until reset, then request proceeds.
- Pagination: empty first page, short page, exactly full pages then empty, cap reached, cancel mid-way.
- Not-modified reply returns cached body.
- Malformed body returns `validation`.
- Network failure sequence produces increasing delays up to the ceiling and then stays there.
- Offline with cache returns stale data. Offline without cache returns `offline`.
- Sign-out clears cache and cancels in-flight calls.
- The mock fails the test if any unmocked request is attempted.
