/**
 * Imprint (Impressum) data, read from VITE_IMPRINT_* environment variables at build time.
 * See `.env.example`. If no name is set, the app shows no imprint link.
 */

export interface Imprint {
  /** Name of the person or organisation responsible for the site. */
  name: string
  /** Street and house number. */
  street: string
  /** Postal code and city. */
  city: string
  email: string
  phone?: string
  /** VAT ID (USt-IdNr.), only for businesses. */
  vatId?: string
}

type Env = Record<string, string | undefined>

const trim = (v: string | undefined) => (v ?? '').trim()
const optional = (v: string | undefined) => trim(v) || undefined

/** Parses the imprint from an env-like object. Returns null if the name is missing. */
export function parseImprint(env: Env): Imprint | null {
  const name = trim(env.VITE_IMPRINT_NAME)
  if (!name) return null
  return {
    name,
    street: trim(env.VITE_IMPRINT_STREET),
    city: trim(env.VITE_IMPRINT_CITY),
    email: trim(env.VITE_IMPRINT_EMAIL),
    phone: optional(env.VITE_IMPRINT_PHONE),
    vatId: optional(env.VITE_IMPRINT_VAT_ID),
  }
}

export const IMPRINT: Imprint | null = parseImprint(import.meta.env as unknown as Env)

/** URL hash under which the imprint page is shown. */
export const IMPRINT_HASH = '#impressum'
