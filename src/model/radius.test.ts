import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS, type Location } from '../config/assumptions'
import { BENCHMARKS, GERMANY, type CountryData } from '../config/countries'
import { scenarioMetrics } from './interpolate'
import { mobilityRadius } from './radius'
import type { Profile, Sliders } from './types'

const NL = BENCHMARKS[0]
const LOCATIONS: Location[] = ['grossstadt', 'kleinstadt', 'land']
const all = (v: number): Sliders => ({ transit: v, rail: v, bike: v, car: v })
const profile = (location: Location): Profile => ({ location, commuteKm: 17, cars: 1 })

// Hand-calculable assumptions/countries, independent of the config.
const HAND_A = {
  ...ASSUMPTIONS,
  radiusMinutes: 30,
  locationFactors: {
    ...ASSUMPTIONS.locationFactors,
    grossstadt: { ...ASSUMPTIONS.locationFactors.grossstadt, transitSpeed: 0.8, bikeSpeed: 1.1 },
  },
}
const HAND_BASE: CountryData = { ...GERMANY, transitDoorToDoorKmh: 15, bikeDoorToDoorKmh: 10 }
const HAND_BENCH: CountryData = { ...NL, transitDoorToDoorKmh: 30, bikeDoorToDoorKmh: 20 }

function radius(location: Location, s: number, bench: CountryData = NL, base: CountryData = GERMANY) {
  return mobilityRadius(base, scenarioMetrics(base, bench, all(s)), profile(location), ASSUMPTIONS)
}

describe('mobilityRadius – today', () => {
  it.each(LOCATIONS)('radius = speed × location factor × radius time in hours (%s)', (loc) => {
    const f = ASSUMPTIONS.locationFactors[loc]
    const hours = ASSUMPTIONS.radiusMinutes / 60
    const r = radius(loc, 0).today
    expect(r.transitKm).toBeCloseTo(GERMANY.transitDoorToDoorKmh * f.transitSpeed * hours, 10)
    expect(r.bikeKm).toBeCloseTo(GERMANY.bikeDoorToDoorKmh * f.bikeSpeed * hours, 10)
    expect(r.bestKm).toBeCloseTo(Math.max(r.transitKm, r.bikeKm), 10)
  })

  it('hand calculation with custom assumptions: transit 15 km/h × 0.8 × 0.5 h = 6 km, bike 10 km/h × 1.1 × 0.5 h = 5.5 km', () => {
    const r = mobilityRadius(HAND_BASE, scenarioMetrics(HAND_BASE, HAND_BENCH, all(0)), profile('grossstadt'), HAND_A)
    expect(r.today.transitKm).toBeCloseTo(6, 10)
    expect(r.today.bikeKm).toBeCloseTo(5.5, 10)
    expect(r.today.bestKm).toBeCloseTo(6, 10)
  })

  it('hand calculation with custom assumptions: if the bike is faster (12 km/h × 1.1 × 0.5 h = 6.6 km), best = bike', () => {
    const base: CountryData = { ...HAND_BASE, bikeDoorToDoorKmh: 12 }
    const r = mobilityRadius(base, scenarioMetrics(base, HAND_BENCH, all(0)), profile('grossstadt'), HAND_A)
    expect(r.today.bikeKm).toBeCloseTo(6.6, 10)
    expect(r.today.bestKm).toBeCloseTo(6.6, 10)
  })

  it('does not depend on the scenario', () => {
    expect(radius('kleinstadt', 1).today).toEqual(radius('kleinstadt', 0).today)
  })

  it('uses radiusMinutes from the assumptions', () => {
    const a = { ...ASSUMPTIONS, radiusMinutes: 60 }
    const r = mobilityRadius(GERMANY, scenarioMetrics(GERMANY, NL, all(0)), profile('grossstadt'), a)
    expect(r.today.transitKm).toBeCloseTo(GERMANY.transitDoorToDoorKmh * ASSUMPTIONS.locationFactors.grossstadt.transitSpeed, 10)
  })
})

describe('mobilityRadius – scenario', () => {
  it.each(LOCATIONS)('matches the current radius and 0 % area gain at sliders = 0 (%s)', (loc) => {
    const r = radius(loc, 0)
    expect(r.scenario).toEqual(r.today)
    expect(r.areaGainPct).toBeCloseTo(0, 10)
  })

  it.each(LOCATIONS)('is larger at sliders = 1 (%s)', (loc) => {
    const r = radius(loc, 1)
    expect(r.scenario.bestKm).toBeGreaterThan(r.today.bestKm)
    expect(r.scenario.transitKm).toBeGreaterThan(r.today.transitKm)
    expect(r.scenario.bikeKm).toBeGreaterThan(r.today.bikeKm)
    expect(r.areaGainPct).toBeGreaterThan(0)
  })

  it('hand calculation with custom assumptions: transit 15 → 30 km/h, radius 6 → 12 km, +300 % area', () => {
    const r = mobilityRadius(HAND_BASE, scenarioMetrics(HAND_BASE, HAND_BENCH, all(1)), profile('grossstadt'), HAND_A)
    expect(r.scenario.transitKm).toBeCloseTo(12, 10)
    expect(r.scenario.bikeKm).toBeCloseTo(20 * 1.1 * 0.5, 10)
    expect(r.areaGainPct).toBeCloseTo(((12 / 6) ** 2 - 1) * 100, 8)
  })

  it('scenario with NL matches benchmark speed × location factor × radius time (big city)', () => {
    const f = ASSUMPTIONS.locationFactors.grossstadt
    const hours = ASSUMPTIONS.radiusMinutes / 60
    const r = radius('grossstadt', 1)
    expect(r.scenario.transitKm).toBeCloseTo(Math.max(GERMANY.transitDoorToDoorKmh, NL.transitDoorToDoorKmh) * f.transitSpeed * hours, 8)
    expect(r.scenario.bikeKm).toBeCloseTo(Math.max(GERMANY.bikeDoorToDoorKmh, NL.bikeDoorToDoorKmh) * f.bikeSpeed * hours, 8)
  })

  it.each(LOCATIONS)('areaGainPct is consistent with (r1/r0)² − 1 (%s)', (loc) => {
    for (const s of [0, 0.3, 0.7, 1]) {
      const r = radius(loc, s)
      expect(r.areaGainPct).toBeCloseTo(((r.scenario.bestKm / r.today.bestKm) ** 2 - 1) * 100, 8)
    }
  })

  it('grows monotonically with the slider', () => {
    let prev = -Infinity
    for (const s of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const best = radius('grossstadt', s).scenario.bestKm
      expect(best).toBeGreaterThanOrEqual(prev)
      prev = best
    }
  })

  it('never shrinks when a benchmark has lower speeds', () => {
    const slow: CountryData = { ...NL, id: 'slow', transitDoorToDoorKmh: 8, bikeDoorToDoorKmh: 7 }
    for (const loc of LOCATIONS) {
      const r = radius(loc, 1, slow)
      expect(r.scenario.transitKm).toBeGreaterThanOrEqual(r.today.transitKm)
      expect(r.scenario.bikeKm).toBeGreaterThanOrEqual(r.today.bikeKm)
      expect(r.scenario.bestKm).toBeGreaterThanOrEqual(r.today.bestKm)
      expect(r.areaGainPct).toBeGreaterThanOrEqual(0)
    }
  })

  it('improves only the dimension in which the benchmark is better', () => {
    const mixed: CountryData = { ...NL, id: 'mix', bikeDoorToDoorKmh: 8 }
    const r = radius('grossstadt', 1, mixed)
    expect(r.scenario.bikeKm).toBeCloseTo(r.today.bikeKm, 10)
    expect(r.scenario.transitKm).toBeGreaterThan(r.today.transitKm)
  })

  it('returns 0 % area gain when the current radius is 0', () => {
    const base: CountryData = { ...GERMANY, transitDoorToDoorKmh: 0, bikeDoorToDoorKmh: 0 }
    const r = radius('grossstadt', 1, NL, base)
    expect(r.today.bestKm).toBe(0)
    expect(r.areaGainPct).toBe(0)
    expect(Number.isFinite(r.areaGainPct)).toBe(true)
  })
})
