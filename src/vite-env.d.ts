/// <reference types="vite/client" />

/** Version from package.json, injected by Vite at build time. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** URL of the full delta app that the widget links to. Empty → "./" (same host as the widget). */
  readonly VITE_DELTA_APP_URL?: string
  /** Imprint (Impressum). Without a name, the app shows no imprint link. */
  readonly VITE_IMPRINT_NAME?: string
  readonly VITE_IMPRINT_STREET?: string
  readonly VITE_IMPRINT_CITY?: string
  readonly VITE_IMPRINT_EMAIL?: string
  readonly VITE_IMPRINT_PHONE?: string
  readonly VITE_IMPRINT_VAT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
