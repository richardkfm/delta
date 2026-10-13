import type { Location } from '../config/assumptions'
import { DEFAULT_BENCHMARK_ID } from '../config/countries'
import { DEFAULT_STATE, serializeState, type AppState } from '../lib/urlState'

/**
 * State of the embeddable widget "Könntest du dein Auto abschaffen?".
 *
 * One slider moves all four model sliders together from "Germany today" (0)
 * to the benchmark level (1); the only profile input is the residential
 * location. The household is assumed to own one car.
 *
 * iframe parameters: lage (grossstadt|kleinstadt|land), niveau (0–100).
 */
export interface WidgetState {
  /** Benchmark level 0–1, applied to all four sliders. */
  level: number
  location: Location
}

export const DEFAULT_WIDGET_STATE: WidgetState = {
  level: 1,
  location: DEFAULT_STATE.profile.location,
}

const LOCATIONS: Location[] = ['grossstadt', 'kleinstadt', 'land']

/** Reads the widget state from the iframe's query string; invalid/missing values → default. */
export function parseWidgetState(search: string): WidgetState {
  const p = new URLSearchParams(search)
  const d = DEFAULT_WIDGET_STATE

  const lage = p.get('lage') as Location | null
  const location = lage !== null && LOCATIONS.includes(lage) ? lage : d.location

  const raw = p.get('niveau')
  const n = raw === null || raw.trim() === '' ? NaN : Number(raw)
  const level = Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) / 100 : d.level

  return { level, location }
}

/** Full app state that reproduces the widget's numbers. */
export function toAppState(w: WidgetState): AppState {
  return {
    benchmarkId: DEFAULT_BENCHMARK_ID,
    sliders: { transit: w.level, rail: w.level, bike: w.level, car: w.level },
    profile: { ...DEFAULT_STATE.profile, location: w.location, cars: 1 },
  }
}

/**
 * Link to the full app with the widget's scenario prefilled.
 *
 * `appUrl` comes from VITE_DELTA_APP_URL and may be relative ("./"); it is
 * resolved against `pageUrl` (the widget's own URL). Existing query
 * parameters of `appUrl` are kept.
 */
export function buildAppLink(appUrl: string, w: WidgetState, pageUrl: string): string {
  const url = new URL(appUrl.trim() || './', pageUrl)
  for (const [key, value] of new URLSearchParams(serializeState(toAppState(w)))) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('utm_source', 'widget')
  url.searchParams.set('utm_medium', 'embed')
  url.searchParams.set('utm_content', 'auto')
  return url.toString()
}
