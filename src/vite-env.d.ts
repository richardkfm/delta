/// <reference types="vite/client" />

/** Version from package.json, injected by Vite at build time. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** URL of the full delta app that the widget links to. Empty → "./" (same host as the widget). */
  readonly VITE_DELTA_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
