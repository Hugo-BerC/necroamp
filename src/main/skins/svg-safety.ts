import { SKIN_LIMITS } from '@shared/skins';

/**
 * Allowlist SVG validator (ADR 0010). Pure, never throws. SVG skin assets are only ever rendered
 * as images (CSS `url()`), where Chromium runs them in static mode. This is defense in depth: it
 * runs at scan time and again on the bytes served.
 *
 * Contract note: ADR 0010 places this module in `@shared/skins/svg-safety.ts`, which does not
 * exist yet. It lives in main until the orchestrator adds the shared module.
 */
export type SvgVerdict = { readonly ok: true } | { readonly ok: false; readonly reason: string };

const ELEMENTS: ReadonlySet<string> = new Set(
  (
    'svg g defs title desc path rect circle ellipse line polyline polygon text tspan symbol use ' +
    'linearGradient radialGradient stop pattern clipPath mask marker filter feBlend feColorMatrix ' +
    'feComponentTransfer feFuncR feFuncG feFuncB feFuncA feComposite feConvolveMatrix ' +
    'feDiffuseLighting feDisplacementMap feDistantLight fePointLight feSpotLight feDropShadow ' +
    'feFlood feGaussianBlur feMerge feMergeNode feMorphology feOffset feSpecularLighting feTile ' +
    'feTurbulence'
  ).split(' '),
);

const ATTRIBUTES: ReadonlySet<string> = new Set(
  (
    'id x y cx cy r rx ry x1 y1 x2 y2 width height viewBox preserveAspectRatio d points transform ' +
    'fill fill-opacity fill-rule stroke opacity stop-color stop-opacity offset gradientUnits ' +
    'gradientTransform spreadMethod patternUnits patternContentUnits patternTransform clip-path ' +
    'clip-rule mask filter filterUnits primitiveUnits flood-color flood-opacity in in2 result ' +
    'mode type values tableValues slope intercept amplitude exponent k1 k2 k3 k4 operator order ' +
    'kernelMatrix divisor bias targetX targetY edgeMode stdDeviation dx dy baseFrequency ' +
    'numOctaves seed stitchTiles scale xChannelSelector yChannelSelector surfaceScale ' +
    'diffuseConstant specularConstant specularExponent lighting-color azimuth elevation z ' +
    'pointsAtX pointsAtY pointsAtZ limitingConeAngle radius font-family font-size font-weight ' +
    'letter-spacing text-anchor dominant-baseline href xmlns xml:space xlink:href xmlns:xlink ' +
    'markerWidth markerHeight markerUnits refX refY orient'
  ).split(' '),
);

const TEXT_ELEMENTS: ReadonlySet<string> = new Set(['text', 'tspan', 'title', 'desc']);
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const MAX_USE_ELEMENTS = 256;
const MAX_USE_DEPTH = 3;

const NAME = /[A-Za-z][A-Za-z0-9:_-]*/y;
const FRAGMENT = /^#[A-Za-z_][A-Za-z0-9_.-]{0,63}$/;
const URL_REF = /url\(\s*(['"]?)(#[A-Za-z_][A-Za-z0-9_.-]{0,63})\1\s*\)/g;
const FORBIDDEN_VALUE = /javascript:|data:|https?:|file:|ftp:|@import|\/\//i;

interface OpenElement {
  readonly name: string;
  readonly id: string | null;
  readonly useTargets: Set<string>;
}

const fail = (reason: string): SvgVerdict => ({ ok: false, reason });

function isAllowedAttribute(name: string): boolean {
  if (ATTRIBUTES.has(name)) return true;
  // stroke, stroke-width, stroke-linecap, stroke-dasharray and so on.
  return /^stroke-[a-z]+$/.test(name);
}

/** Checks one attribute value. `refs` collects every same-document reference for later checks. */
function checkValue(name: string, value: string, refs: string[]): string | null {
  if (value.length > 8192 || value.includes('<') || value.includes('&')) return 'value';
  if (name === 'xmlns') return value === SVG_NS ? null : 'xmlns';
  if (name === 'xmlns:xlink') return value === XLINK_NS ? null : 'xmlns';
  if (name === 'href' || name === 'xlink:href') {
    if (!FRAGMENT.test(value)) return 'href';
    refs.push(value.slice(1));
    return null;
  }
  if (FORBIDDEN_VALUE.test(value)) return 'reference';
  if (/url\(/i.test(value)) {
    const stripped = value.replace(URL_REF, (_all, _q: string, target: string) => {
      refs.push(target.slice(1));
      return '';
    });
    if (/url\(/i.test(stripped)) return 'url';
  }
  if (name === 'numOctaves' && !(Number(value) >= 0 && Number(value) <= 6)) return 'octaves';
  if (name === 'stdDeviation') {
    for (const part of value.trim().split(/[\s,]+/)) {
      const n = Number(part);
      if (!Number.isFinite(n) || n < 0 || n > 64) return 'deviation';
    }
  }
  return null;
}

function checkText(text: string): boolean {
  // Only the five predefined entities and numeric references are well-formed without a DTD.
  const withoutEntities = text.replace(
    /&(?:amp|lt|gt|quot|apos|#\d{1,6}|#x[0-9a-fA-F]{1,6});/g,
    '',
  );
  return !withoutEntities.includes('&');
}

/** Longest `use` chain reachable from `id`. Returns -1 on a cycle. */
function useDepth(
  id: string,
  edges: ReadonlyMap<string, ReadonlySet<string>>,
  memo: Map<string, number>,
  stack: Set<string>,
): number {
  const cached = memo.get(id);
  if (cached !== undefined) return cached;
  if (stack.has(id)) return -1;
  stack.add(id);
  let best = 0;
  for (const target of edges.get(id) ?? []) {
    const depth = useDepth(target, edges, memo, stack);
    if (depth < 0) {
      stack.delete(id);
      return -1;
    }
    best = Math.max(best, depth + 1);
  }
  stack.delete(id);
  memo.set(id, best);
  return best;
}

function parse(source: string): SvgVerdict {
  let pos = 0;
  const end = source.length;
  const stack: OpenElement[] = [];
  const ids = new Set<string>();
  const refs: string[] = [];
  const edges = new Map<string, Set<string>>();
  let elements = 0;
  let filterPrimitives = 0;
  let useCount = 0;
  let rootSeen = false;
  let rootClosed = false;

  const skipWhitespace = (): void => {
    while (pos < end && ' \t\r\n'.includes(source.charAt(pos))) pos += 1;
  };

  if (source.startsWith('<?xml')) {
    const close = source.indexOf('?>');
    if (close < 0) return fail('xml-declaration');
    const declaration = source.slice(0, close);
    if (declaration.includes('<', 1)) return fail('xml-declaration');
    pos = close + 2;
  }

  while (pos < end) {
    const lt = source.indexOf('<', pos);
    const textEnd = lt < 0 ? end : lt;
    const text = source.slice(pos, textEnd);
    if (text.trim().length > 0) {
      const parent = stack[stack.length - 1];
      if (parent === undefined || !TEXT_ELEMENTS.has(parent.name)) return fail('text');
      if (!checkText(text)) return fail('entity');
    }
    if (lt < 0) break;
    pos = lt;
    if (source.startsWith('<!--', pos)) {
      const close = source.indexOf('-->', pos + 4);
      if (close < 0) return fail('comment');
      if (source.slice(pos + 4, close).includes('<')) return fail('comment');
      pos = close + 3;
      continue;
    }
    if (source.startsWith('<!', pos) || source.startsWith('<?', pos)) return fail('markup');
    if (source.startsWith('</', pos)) {
      NAME.lastIndex = pos + 2;
      const match = NAME.exec(source);
      if (match === null) return fail('close-tag');
      pos = NAME.lastIndex;
      skipWhitespace();
      if (source.charAt(pos) !== '>') return fail('close-tag');
      pos += 1;
      const open = stack.pop();
      if (open === undefined || open.name !== match[0]) return fail('nesting');
      if (stack.length === 0) rootClosed = true;
      continue;
    }
    // Opening tag.
    NAME.lastIndex = pos + 1;
    const nameMatch = NAME.exec(source);
    if (nameMatch === null) return fail('tag');
    const name = nameMatch[0];
    pos = NAME.lastIndex;
    if (!ELEMENTS.has(name)) return fail('element');
    if (rootClosed) return fail('second-root');
    if (!rootSeen && name !== 'svg') return fail('root');
    rootSeen = true;
    elements += 1;
    if (elements > SKIN_LIMITS.svgMaxElements) return fail('elements');
    if (name.startsWith('fe') && !name.startsWith('feFunc') && name !== 'feMergeNode') {
      filterPrimitives += 1;
      if (filterPrimitives > SKIN_LIMITS.svgMaxFilterPrimitives) return fail('filters');
    }
    const seen = new Set<string>();
    const elementRefs: string[] = [];
    let id: string | null = null;
    let selfClosing = false;
    let hasNamespace = false;
    for (;;) {
      const before = pos;
      skipWhitespace();
      const c = source.charAt(pos);
      if (c === '>') {
        pos += 1;
        break;
      }
      if (c === '/' && source.charAt(pos + 1) === '>') {
        selfClosing = true;
        pos += 2;
        break;
      }
      if (pos === before && pos !== end && c !== '') {
        // Attributes must be separated from the previous token by whitespace.
        if (seen.size > 0) return fail('attribute');
      }
      NAME.lastIndex = pos;
      const attr = NAME.exec(source);
      if (attr === null) return fail('attribute');
      const attrName = attr[0];
      pos = NAME.lastIndex;
      if (seen.has(attrName)) return fail('duplicate-attribute');
      seen.add(attrName);
      skipWhitespace();
      if (source.charAt(pos) !== '=') return fail('attribute');
      pos += 1;
      skipWhitespace();
      const quote = source.charAt(pos);
      if (quote !== '"' && quote !== "'") return fail('attribute');
      const close = source.indexOf(quote, pos + 1);
      if (close < 0) return fail('attribute');
      const value = source.slice(pos + 1, close);
      pos = close + 1;
      if (/^on/i.test(attrName) || !isAllowedAttribute(attrName)) return fail('attribute-name');
      const problem = checkValue(attrName, value, elementRefs);
      if (problem !== null) return fail(problem);
      if (attrName === 'xmlns') hasNamespace = true;
      if (attrName === 'id') {
        if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/.test(value) || ids.has(value)) return fail('id');
        ids.add(value);
        id = value;
      }
    }
    if (stack.length === 0 && !hasNamespace) return fail('namespace');
    if (stack.length >= SKIN_LIMITS.svgMaxDepth) return fail('depth');
    refs.push(...elementRefs);
    const useTargets = new Set<string>();
    if (name === 'use') {
      useCount += 1;
      if (useCount > MAX_USE_ELEMENTS) return fail('use-count');
      for (const target of elementRefs) useTargets.add(target);
    }
    const element: OpenElement = { name, id, useTargets };
    // A use target belongs to every ancestor and to this element for cycle detection.
    for (const owner of [...stack, element]) {
      if (owner.id === null) continue;
      const set = edges.get(owner.id) ?? new Set<string>();
      for (const target of useTargets) set.add(target);
      edges.set(owner.id, set);
    }
    if (selfClosing) {
      if (stack.length === 0) rootClosed = true;
    } else {
      stack.push(element);
    }
  }
  if (!rootSeen || stack.length > 0) return fail('unclosed');
  for (const ref of refs) if (!ids.has(ref)) return fail('dangling-reference');
  const memo = new Map<string, number>();
  for (const id of edges.keys()) {
    const depth = useDepth(id, edges, memo, new Set());
    if (depth < 0 || depth > MAX_USE_DEPTH) return fail('use-chain');
  }
  return { ok: true };
}

/** Validates SVG bytes. Never throws. */
export function validateSvg(bytes: Uint8Array): SvgVerdict {
  try {
    if (bytes.byteLength === 0 || bytes.byteLength > SKIN_LIMITS.svgBytes) return fail('size');
    let text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return parse(text);
  } catch {
    return fail('parse');
  }
}
