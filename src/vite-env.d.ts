/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the full delta app that the widget links to. Empty → "./" (same host as the widget). */
  readonly VITE_DELTA_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
