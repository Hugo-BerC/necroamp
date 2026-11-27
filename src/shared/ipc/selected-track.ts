/**
 * Resolves a persisted selection against the tracks actually present. A selection that matches
 * no track falls back to the first track, or to null for an empty list. Pure and framework-free.
 */
export function resolveSelectedTrackId(
  items: readonly { readonly trackId: string }[],
  selectedTrackId: string | null | undefined,
): string | null {
  if (selectedTrackId !== null && selectedTrackId !== undefined) {
    if (items.some((item) => item.trackId === selectedTrackId)) return selectedTrackId;
  }
  return items[0]?.trackId ?? null;
}
