---
name: testing-strategy
description: "Use when planning, writing or reviewing NecroAmp tests: Vitest unit and integration tests, fast-check property tests, Playwright Electron smoke and end-to-end tests, fixtures, mocking external APIs, security regression tests, audio and skin validation tests, and traceability from acceptance criteria to tests."
license: MIT
metadata:
  owner: qa-engineer
  schema: "1"
---

# Testing strategy

## Scope

Turns acceptance criteria into deterministic, offline tests for NecroAmp. The rules themselves live in `.kiro/steering/tech.md` ("Testing", "Audio engineering rules", "Skin engine rules", "Electron architecture and security") and `product.md` (formats, features). This skill gives the procedures. It does not restate those rules.

Non-goals:
- Writing production code or patching defects. Report them to the owning agent with a reproduction (see the `qa-engineer` agent definition).
- CI workflow files (release-engineer) and `package.json` scripts (desktop-engineer, per `docs/engineering/package-script-policy.md`).
- Choosing new test tools or installing dependencies. Installs need user approval.
- Co-located `*.test.ts(x)` files owned by implementers. QA writes only `tests/**`, `*.property.test.ts`, `*.integration.test.ts`, `vitest.config.ts`, `playwright.config.ts` and `docs/testing/**`.

## Procedures

### 1. Plan from acceptance criteria
1. List the acceptance criteria of the feature (spec, handover note or this skill's per-area criteria). Give each an ID, for example `REQ-EQ-03`.
2. For each criterion choose the cheapest level that can fail for the right reason: pure unit (Vitest), property (fast-check), integration (Vitest, several modules, fakes at the edges), end to end (Playwright Electron).
3. Record the mapping in `docs/testing/` using the format in `references/traceability-and-security-regression.md`. A criterion with no test is listed as a gap, not omitted.

### 2. Vitest unit and integration tests
1. Target framework-free modules first (equalizer math, skin parsing, playlist operations, metadata normalization, time formatting). These need no mocks.
2. Name files by level: `*.property.test.ts`, `*.integration.test.ts`. Keep one behavior per test and assert outcomes, not call counts.
3. Replace only the boundary: network, filesystem outside a temp directory, clock, randomness, Electron modules. Use Vitest's own mocking and fake-timer facilities. Check the Vitest documentation for exact API names before using one.
4. Never use real time, real sleeps or ordering between tests. Inject the clock and ID generators.
5. Run only existing scripts (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`). If a needed script is missing, request it from desktop-engineer.

### 3. fast-check property tests
1. Cover every area required by `tech.md` "Testing". Invariants per area are in `references/property-test-catalog.md`.
2. Build arbitraries that include hostile values: empty, huge, Unicode, `NaN`, infinities, negative zero, prototype-pollution keys such as `__proto__`.
3. Test properties, not examples: idempotence, round trip, bounds, conservation (no element lost or duplicated), "never throws".
4. Keep runs reproducible. When a property fails, copy the reported seed and counterexample into a permanent example-based regression test, then request the fix from the owner.
5. Keep run counts modest so the suite stays fast. Do not raise them to hide flaky generators.

### 4. Mocking external APIs (GitHub)
1. Tests never use a real token or network. Fail the test run if an unmocked request is attempted (a fetch stub that throws).
2. Prefer recorded or hand-written response fixtures stored under `tests/fixtures/github/`. Strip tokens, user names and e-mail addresses from recordings and mark the date and source.
3. Test the error taxonomy with fixtures: 401, 403 rate limited, 404, 5xx, network failure, malformed body. Test pagination end conditions and offline behavior (stale data labeled, no retry storm).
4. Verify the token never appears in IPC payloads, logs or renderer-visible values. See the security regression list.
5. Check Octokit's own documentation for how to inject a fetch or request implementation. Do not guess option names.

### 5. Playwright Electron tests
1. Smoke scope from `tech.md`: launch, load a file, play, change skin. Detail and isolation rules are in `references/electron-e2e-and-fixtures.md`.
2. Launch the built app, use a temporary user-data directory, and close the app in a teardown that runs on failure too.
3. Drive the UI through accessible roles and labels first, test IDs second. Wait on observable state, never on fixed delays.
4. Assert the real renderer security posture where observable (no Node globals, blocked navigation). Details in the security regression list.
5. Visual snapshots and automated accessibility checks are separate, opt-in specs. Keep per-platform baselines.

### 6. Audio and skin validation
1. Audio: decode small fixture files per format (MP3, WAV, FLAC, OGG) on each CI platform and record which formats decode, as `tech.md` requires before promising a format. Compare rendered or analyzed output against references with explicit numeric tolerances, never byte equality (encoders and platforms differ). Use offline rendering where the owner exposes it. Do not use real-time playback timing as an assertion.
2. Skin: for each rejection rule in `tech.md` "Skin engine rules" keep a malicious fixture or generated input and assert the loader rejects it with a typed error and no file access outside the skin root. Bundled skins get a positive test: manifest validates, every referenced asset exists, and an asset register entry exists in `docs/assets.md`.

### 7. Report defects
Write `docs/testing/defects/<id>-<slug>.md` with: owning agent, expected vs actual, minimal reproduction (command, or fast-check seed and counterexample), affected criterion ID, severity. Do not edit the source under test.

## Recommended patterns

- Test pyramid: many pure and property tests, fewer integration tests, a handful of e2e smoke tests.
- Arrange-act-assert with builders for valid objects; override one field per test.
- Contract tests: the same Zod schema from `src/shared` validates both fixtures and handler inputs.
- Temp directories created per test and removed in teardown, never inside `src/`.
- Quarantine, do not retry, a flaky test. Record it in `docs/testing/` with the cause.
- Coverage on pure logic is expected (`tech.md`). Report coverage and gaps in a short note, do not chase a percentage with trivial tests.

## Anti-patterns

- Asserting on implementation details (private calls, whole-object snapshots with volatile fields).
- `sleep` or arbitrary timeouts; `Date.now()` or `Math.random()` in assertions.
- Generators that rarely produce failing inputs (only short ASCII strings, only valid manifests).
- Property tests that re-implement the function under test.
- Mocking the module under test, or mocking so much that the test cannot fail.
- Tests that need a real token, network, display-specific settings or the developer's home directory.
- Large or unlicensed fixtures, real music, real user data.
- Disabling a security setting (sandbox, context isolation) to make a test pass.
- Skipping a failing test without a defect report.
- Editing production code from a test task.

## Security considerations

- Fixtures and recordings contain no secrets, personal data or content that is not license-clean. Tokens in tests are obvious fake strings.
- Malicious skin and path inputs are created in a temp directory. Never point a traversal test at real system paths or perform writes or deletes outside it.
- Security regression tests are mandatory for each security rule in `tech.md`. The list and expected assertions are in `references/traceability-and-security-regression.md`.
- Do not read, print or store credentials. Agent read denies on secret files apply to tests too.
- Test output and snapshots must not include tokens or absolute user paths.

## Acceptance criteria

- Every required property area in `tech.md` "Testing" has at least one fast-check test, listed in `docs/testing/`.
- Every acceptance criterion in scope maps to a test or is listed as a gap.
- The suite passes with the network disabled and without a GitHub token, or the report names the tests that could not run and why (for example Node or pnpm absent).
- Two consecutive runs give the same result; no test depends on wall-clock time or order.
- Each security rule in scope has a regression test that fails when the rule is removed.
- Every defect report names the owner and has a reproduction.
- Platform gaps (formats, snapshots, signing, runners) are listed explicitly.

## Validation checklist

- [ ] Test level chosen per criterion; IDs recorded in the traceability note.
- [ ] Only files inside the QA write scope were changed.
- [ ] No real network, token, clock, randomness or user directory is used.
- [ ] Property arbitraries include hostile and boundary values; failing seeds are preserved as regressions.
- [ ] GitHub fixtures are sanitized and dated.
- [ ] Skin rejection tests cover traversal, absolute paths, symlink escape, remote `url()`, `@import`, unknown fields, and size and count limits.
- [ ] Audio comparisons use stated tolerances; format support is recorded per platform.
- [ ] E2E uses a temp user-data directory and always closes the app.
- [ ] Fixtures are small, license-clean and registered (request a `docs/assets.md` entry from art-director).
- [ ] Defects reported, not patched; script requests sent to desktop-engineer.
- [ ] Coverage and gap note written.

## References

- `references/property-test-catalog.md`: read when writing or reviewing any required fast-check test.
- `references/electron-e2e-and-fixtures.md`: read when setting up Playwright Electron, visual or accessibility specs, or adding fixtures.
- `references/traceability-and-security-regression.md`: read when mapping criteria to tests or writing security regression tests.

Changes needed outside the QA write scope are listed for the owning agent, not made here.
