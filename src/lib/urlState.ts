import type { CarCount, Location } from '../config/assumptions'
import { BENCHMARKS, DEFAULT_BENCHMARK_ID } from '../config/countries'
import type { Profile, Sliders } from '../model/types'

/**
 * Szenario-Zustand der App und seine Abbildung auf URL-Parameter, damit
 * Szenarien per Link teilbar sind.
 *
 * Parameter: b (Benchmark-ID), oepnv, bahn, rad, auto (0–100),
 * lage (grossstadt|kleinstadt|land), km (Arbeitsweg), autos (0|1|2).
 */
export interface AppState {
  benchmarkId: string
  sliders: Sliders
  profile: Profile
}

export const DEFAULT_STATE: AppState = {
  benchmarkId: DEFAULT_BENCHMARK_ID,
  sliders: { transit: 1, rail: 1, bike: 1, car: 1 },
  profile: { location: 'grossstadt', commuteKm: 17, cars: 1 },
}

export const MAX_COMMUTE_KM = 100

const SLIDER_PARAMS: Record<keyof Sliders, string> = {
  transit: 'oepnv',
  rail: 'bahn',
  bike: 'rad',
  car: 'auto',
}

const LOCATIONS: Location[] = ['grossstadt', 'kleinstadt', 'land']

function parseNumber(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, n))
}

/** Liest den Zustand aus einem Query-String; ungültige/fehlende Werte → Standard. */
export function parseState(search: string, benchmarkIds: string[] = BENCHMARKS.map((b) => b.id)): AppState {
  const p = new URLSearchParams(search)
  const d = DEFAULT_STATE

  const b = p.get('b')
  const benchmarkId = b !== null && benchmarkIds.includes(b) ? b : d.benchmarkId

  const sliders = { ...d.sliders }
  for (const key of Object.keys(SLIDER_PARAMS) as (keyof Sliders)[]) {
    const v = parseNumber(p.get(SLIDER_PARAMS[key]), 0, 100)
    if (v !== null) sliders[key] = Math.round(v) / 100
  }

  const lage = p.get('lage') as Location | null
  const location = lage !== null && LOCATIONS.includes(lage) ? lage : d.profile.location
  const km = parseNumber(p.get('km'), 0, MAX_COMMUTE_KM)
  const autos = parseNumber(p.get('autos'), 0, 2)

  return {
    benchmarkId,
    sliders,
    profile: {
      location,
      commuteKm: km !== null ? Math.round(km) : d.profile.commuteKm,
      cars: autos !== null ? (Math.round(autos) as CarCount) : d.profile.cars,
    },
  }
}

/** Schreibt den Zustand als Query-String (ohne führendes „?“). */
export function serializeState(state: AppState): string {
  const p = new URLSearchParams()
  p.set('b', state.benchmarkId)
  for (const key of Object.keys(SLIDER_PARAMS) as (keyof Sliders)[]) {
    p.set(SLIDER_PARAMS[key], String(Math.round(state.sliders[key] * 100)))
  }
  p.set('lage', state.profile.location)
  p.set('km', String(Math.round(state.profile.commuteKm)))
  p.set('autos', String(state.profile.cars))
  return p.toString()
}
