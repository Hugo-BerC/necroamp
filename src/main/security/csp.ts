import { parseDevOrigin } from './trusted-origins';

/**
 * Content Security Policy builders (design section 3.4, ADR 0003 item 6).
 *
 * The production policy is a frozen constant that no option can modify. The development policy is
 * produced by a separate code path, so production output cannot inherit a development allowance.
 */
export type CspOptions =
  { readonly mode: 'production' } | { readonly mode: 'development'; readonly devOrigin: string };

type Directive = readonly [name: string, sources: readonly string[]];

const PRODUCTION_DIRECTIVES: readonly Directive[] = Object.freeze([
  ['default-src', ["'none'"]],
  ['script-src', ["'self'"]],
  ['style-src', ["'self'"]],
  ['img-src', ["'self'"]],
  ['font-src', ["'self'"]],
  ['connect-src', ["'none'"]],
  ['object-src', ["'none'"]],
  ['base-uri', ["'none'"]],
  ['form-action', ["'none'"]],
  ['frame-ancestors', ["'none'"]],
  ['frame-src', ["'none'"]],
  ['worker-src', ["'none'"]],
  ['media-src', ["'none'"]],
  ['manifest-src', ["'none'"]],
] as const);

/** Directives a `<meta http-equiv>` policy ignores (CSP3). Omitted from the meta copy. */
const META_IGNORED: ReadonlySet<string> = new Set(['frame-ancestors', 'report-uri', 'sandbox']);

function serialize(directives: readonly Directive[], omit: ReadonlySet<string>): string {
  return directives
    .filter(([name]) => !omit.has(name))
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Development-only directives. `unsafe-inline` for scripts and styles exists only for the Vite
 * React Fast Refresh preamble and CSS hot update (ADR 0003 item 6). Remove any allowance that
 * runtime validation shows is not needed. `unsafe-eval` and remote script sources never appear.
 */
function developmentDirectives(devOrigin: string): readonly Directive[] {
  const dev = parseDevOrigin(devOrigin);
  if (dev === null) {
    throw new Error('buildCsp: the development origin must be a loopback http origin with a port.');
  }
  return PRODUCTION_DIRECTIVES.map(([name, sources]): Directive => {
    if (name === 'script-src') return [name, ["'self'", "'unsafe-inline'"]];
    if (name === 'style-src') return [name, ["'self'", "'unsafe-inline'"]];
    if (name === 'connect-src') return [name, [dev.origin, `ws://${dev.host}`]];
    return [name, sources];
  });
}

function directivesFor(options: CspOptions): readonly Directive[] {
  return options.mode === 'development'
    ? developmentDirectives(options.devOrigin)
    : PRODUCTION_DIRECTIVES;
}

export function buildCsp(options: CspOptions): string {
  return serialize(directivesFor(options), new Set());
}

/** Same policy without the directives a `<meta>` element ignores. */
export function buildMetaCsp(options: CspOptions): string {
  return serialize(directivesFor(options), META_IGNORED);
}
