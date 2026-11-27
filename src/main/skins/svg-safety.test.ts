import { describe, expect, it } from 'vitest';
import { validateSvg } from './svg-safety';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const enc = (text: string): Uint8Array => new TextEncoder().encode(text);
const svg = (inner: string, attrs = ''): string =>
  `<svg ${NS} viewBox="0 0 10 10"${attrs}>${inner}</svg>`;
const verdict = (text: string) => validateSvg(enc(text));

describe('validateSvg accepts safe art', () => {
  it.each([
    ['a plain shape', svg('<rect x="0" y="0" width="5" height="5" fill="#fff"/>')],
    [
      'an xml declaration and a BOM',
      `\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n${svg('<g/>')}`,
    ],
    [
      'gradients, filters and a same-document reference',
      svg(
        '<defs><linearGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
          '<filter id="f"><feTurbulence baseFrequency="0.02" numOctaves="3"/><feGaussianBlur stdDeviation="2"/></filter></defs>' +
          '<rect width="9" height="9" fill="url(#g)" filter="url(#f)"/>',
      ),
    ],
    ['text with predefined entities', svg('<text x="1" y="1">a &amp; b &#169;</text>')],
    ['a comment without markup', svg('<!-- note --><g/>')],
    ['use with a fragment href', svg('<g id="a"/><use href="#a"/>')],
    ['a quoted url() reference', svg('<g id="a"/><rect fill="url(\'#a\')" width="1" height="1"/>')],
    [
      'xlink fragment href',
      svg('<g id="a"/><use xlink:href="#a"/>', ' xmlns:xlink="http://www.w3.org/1999/xlink"'),
    ],
    [
      'stroke attributes',
      svg('<path d="M0 0L5 5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
    ],
    [
      'a use chain of depth three',
      svg(
        '<g id="a"><use href="#b"/></g><g id="b"><use href="#c"/></g><g id="c"><use href="#d"/></g><g id="d"/>',
      ),
    ],
  ])('%s', (_name, text) => {
    expect(verdict(text)).toEqual({ ok: true });
  });
});

describe('validateSvg rejects unsafe constructs', () => {
  it.each([
    ['a script element', svg('<script>alert(1)</script>')],
    ['foreignObject', svg('<foreignObject width="1" height="1"><div/></foreignObject>')],
    ['an event handler', svg('<rect width="1" height="1" onload="x()"/>')],
    ['an uppercase event handler', svg('<rect width="1" height="1" onClick="x()"/>')],
    ['a style attribute', svg('<rect width="1" height="1" style="fill:red"/>')],
    ['a class attribute', svg('<rect width="1" height="1" class="a"/>')],
    ['a style element', svg('<style>rect{fill:red}</style>')],
    ['an image element', svg('<image href="#a" width="1" height="1"/>')],
    ['an anchor', svg('<a href="#a"><rect width="1" height="1"/></a>')],
    [
      'an animate element',
      svg('<rect id="a" width="1" height="1"><animate attributeName="x"/></rect>'),
    ],
    ['an iframe', svg('<iframe/>')],
    ['an external href', svg('<use href="https://evil.test/x.svg#a"/>')],
    ['a protocol-relative href', svg('<use href="//evil.test/x.svg#a"/>')],
    ['a data href', svg('<use href="data:image/svg+xml;base64,AAAA"/>')],
    ['a javascript href', svg('<use href="javascript:alert(1)"/>')],
    ['a file href', svg('<use href="file:///etc/passwd"/>')],
    ['an external url()', svg('<rect width="1" height="1" fill="url(https://evil.test/a.png)"/>')],
    ['a url() without a fragment', svg('<rect width="1" height="1" fill="url(a.png)"/>')],
    [
      'a url() mixed with another value',
      svg('<g id="a"/><rect fill="url(#a) url(x.png)" width="1" height="1"/>'),
    ],
    ['an @import', svg('<rect width="1" height="1" font-family="@import url(x)"/>')],
    ['a dangling same-document reference', svg('<use href="#missing"/>')],
    ['a dangling url() reference', svg('<rect fill="url(#missing)" width="1" height="1"/>')],
    ['a DOCTYPE', `<!DOCTYPE svg [<!ENTITY a "b">]>${svg('<g/>')}`],
    ['an entity use', svg('<text>&xxe;</text>')],
    ['an entity in an attribute', svg('<rect width="&amp;" height="1"/>')],
    ['CDATA', svg('<text><![CDATA[x]]></text>')],
    ['a comment containing markup', svg('<!-- <script> --><g/>')],
    ['an unterminated comment', svg('<!-- never closed')],
    ['a processing instruction after the start', `${svg('<g/>')}<?pi x?>`],
    ['a second root', `${svg('<g/>')}${svg('<g/>')}`],
    ['text outside text elements', svg('hello')],
    ['content before the root', `hello${svg('<g/>')}`],
    ['mismatched nesting', svg('<g><rect/></g></g>')],
    ['a wrong closing tag', svg('<g></rect>')],
    ['an unclosed element', `<svg ${NS}><g>`],
    ['a duplicate attribute', svg('<rect width="1" width="2"/>')],
    ['a duplicate id', svg('<g id="a"/><g id="a"/>')],
    ['an invalid id', svg('<g id="1a"/>')],
    ['a missing namespace', '<svg viewBox="0 0 1 1"><g/></svg>'],
    ['a wrong namespace', '<svg xmlns="http://evil.test/ns"><g/></svg>'],
    ['a non-svg root', '<g xmlns="http://www.w3.org/2000/svg"/>'],
    ['an unquoted attribute', `<svg ${NS}><rect width=1/></svg>`],
    ['an attribute without a value', `<svg ${NS}><rect width/></svg>`],
    ['a missing attribute separator', `<svg ${NS}><rect width="1"height="1"/></svg>`],
    ['an empty document', ''],
    ['whitespace only', '   '],
    ['a broken xml declaration', '<?xml version="1.0"'],
    ['a closing tag without a name', svg('</>')],
    ['a tag without a name', svg('<>')],
    ['a use cycle', svg('<g id="a"><use href="#b"/></g><g id="b"><use href="#a"/></g>')],
    ['a use that contains itself', svg('<g id="a"><use href="#a"/></g>')],
    [
      'a use chain deeper than three',
      svg(
        '<g id="a"><use href="#b"/></g><g id="b"><use href="#c"/></g><g id="c"><use href="#d"/></g><g id="d"><use href="#e"/></g><g id="e"/>',
      ),
    ],
    ['too many numOctaves', svg('<filter id="f"><feTurbulence numOctaves="7"/></filter>')],
    ['a huge stdDeviation', svg('<filter id="f"><feGaussianBlur stdDeviation="65"/></filter>')],
    [
      'a non-numeric stdDeviation',
      svg('<filter id="f"><feGaussianBlur stdDeviation="x"/></filter>'),
    ],
    ['a markup character in a value', svg('<rect fill="a&lt;b" width="1" height="1"/>')],
  ])('%s', (_name, text) => {
    expect(verdict(text).ok).toBe(false);
  });

  it('rejects invalid UTF-8 and an empty buffer', () => {
    expect(validateSvg(Uint8Array.from([0xff, 0xfe, 0xfd])).ok).toBe(false);
    expect(validateSvg(new Uint8Array(0)).ok).toBe(false);
  });
});

describe('validateSvg limits', () => {
  it('rejects a file over the size cap', () => {
    const big = svg(`<desc>${'a'.repeat(256 * 1024)}</desc>`);
    expect(verdict(big)).toEqual({ ok: false, reason: 'size' });
  });

  it('rejects more than 5000 elements', () => {
    expect(verdict(svg('<g/>'.repeat(5001))).ok).toBe(false);
    expect(verdict(svg('<g/>'.repeat(4000))).ok).toBe(true);
  });

  it('rejects nesting deeper than 32 levels', () => {
    expect(verdict(svg('<g>'.repeat(40) + '</g>'.repeat(40))).ok).toBe(false);
    expect(verdict(svg('<g>'.repeat(20) + '</g>'.repeat(20))).ok).toBe(true);
  });

  it('rejects more than 40 filter primitives but not feFunc or feMergeNode children', () => {
    const primitives = (n: number) =>
      svg(`<filter id="f">${'<feOffset dx="1"/>'.repeat(n)}</filter>`);
    expect(verdict(primitives(41)).ok).toBe(false);
    expect(verdict(primitives(40)).ok).toBe(true);
    const merge = svg(
      '<filter id="f"><feMerge>' + '<feMergeNode in="a"/>'.repeat(50) + '</feMerge></filter>',
    );
    expect(verdict(merge).ok).toBe(true);
  });

  it('rejects more than 256 use elements', () => {
    expect(verdict(svg('<g id="a"/>' + '<use href="#a"/>'.repeat(257))).ok).toBe(false);
  });

  it('never throws on arbitrary bytes', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const bytes = new Uint8Array(64).map((_, i) => (seed * 31 + i * 17) % 256);
      expect(() => validateSvg(bytes)).not.toThrow();
    }
  });
});
