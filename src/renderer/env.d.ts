// Ambient declarations for the renderer project.
// `window.necroamp` is typed by src/preload/necroamp-window.d.ts. Only
// app/bridge/necroamp-client.ts reads it, and it treats the value as unknown so a
// missing bridge is handled (R8.10).

// CSS Modules are resolved by Vite. Class names are plain strings at runtime.
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// Plain stylesheets are imported for side effects only (tokens.css, global.css).
declare module '*.css';
