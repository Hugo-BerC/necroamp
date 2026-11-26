import { buildMetaCsp } from './csp';

/**
 * Descriptor of the `<meta http-equiv>` CSP tag that the build injects into the renderer
 * `index.html` (T2.7, design section 3.4). It always uses the production policy, so a production
 * build cannot carry a development allowance. The shape matches Vite's `HtmlTagDescriptor`.
 */
export interface MetaCspTag {
  readonly tag: 'meta';
  readonly attrs: { readonly 'http-equiv': 'Content-Security-Policy'; readonly content: string };
  readonly injectTo: 'head-prepend';
}

export function buildMetaCspTag(): MetaCspTag {
  return {
    tag: 'meta',
    attrs: {
      'http-equiv': 'Content-Security-Policy',
      content: buildMetaCsp({ mode: 'production' }),
    },
    injectTo: 'head-prepend',
  };
}
