# 0005: `cleanText` keeps C1 control and Unicode format characters

- Owner: desktop-engineer (`src/main/library/text.ts`)
- Severity: low (display text only; React renders it as inert text, never as markup)
- Block: Audio Engine B, metadata normalization
- Found by: qa-engineer, gate B
- Status: open. Does not block the gate.

## Expected

`cleanText` is documented as "strips control characters" for untrusted tag text and file names. Unicode category Cc includes the C1 range U+0080 to U+009F (for example NEL, U+0085).

## Actual

Only U+0000 to U+001F and U+007F are removed. C1 controls pass. So do U+202E (right-to-left override), U+200B (zero-width space) and U+2028 (line separator), which can reorder or hide characters in a title or a file name shown in the playlist.

## Reproduction

```powershell
node -e "import('./src/main/library/text.ts').then(m=>console.log([...m.cleanText('a\u202eb\u0085c\u200bd\u2028e',20)].map(c=>c.codePointAt(0).toString(16)).join(' ')))"
```

Output: `61 202e 62 85 63 200b 64 2028 65`. Every inserted character survived.

The regression is kept as an expected failure in `src/main/library/metadata.property.test.ts` (`it.fails('D-B1: strips C1 control characters as well')`). When the fix lands, that test starts passing, Vitest reports it as a failure of the `it.fails` marker, and the marker must be removed.

## Suggested fix

Remove `\p{Cc}` (all of C0, DEL and C1). Decide separately whether to also remove bidi overrides and isolates (U+202A to U+202E, U+2066 to U+2069) from file names and tags. Keep the code-point based length cap.

## Affected criteria

Block B metadata normalization (REQ-B-META). Spoofing impact is cosmetic: no path, markup or URL is built from this text.
