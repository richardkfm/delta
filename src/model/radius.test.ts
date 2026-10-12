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

function radius(location: Location, s: number, bench: CountryData = NL, base: CountryData = GERMANY) {
  return mobilityRadius(base, scenarioMetrics(base, bench, all(s)), profile(location), ASSUMPTIONS)
}

describe('mobilityRadius – heute', () => {
  it.each(LOCATIONS)('Radius = Geschwindigkeit × Wohnlagefaktor × 0,5 h (%s)', (loc) => {
    const f = ASSUMPTIONS.locationFactors[loc]
    const r = radius(loc, 0).today
    expect(ASSUMPTIONS.radiusMinutes).toBe(30)
    expect(r.transitKm).toBeCloseTo(GERMANY.transitDoorToDoorKmh * f.transitSpeed * 0.5, 10)
    expect(r.bikeKm).toBeCloseTo(GERMANY.bikeDoorToDoorKmh * f.bikeSpeed * 0.5, 10)
    expect(r.bestKm).toBeCloseTo(Math.max(r.transitKm, r.bikeKm), 10)
  })

  it('Handrechnung Großstadt: ÖPNV 7,5 km, Rad 6,175 km', () => {
    const r = radius('grossstadt', 0).today
    expect(r.transitKm).toBeCloseTo(7.5, 10)
    expect(r.bikeKm).toBeCloseTo(6.175, 10)
    expect(r.bestKm).toBeCloseTo(7.5, 10)
  })

  it('Handrechnung Land: ÖPNV 4,5 km, Rad 6,825 km, bestes = Rad', () => {
    const r = radius('land', 0).today
    expect(r.transitKm).toBeCloseTo(4.5, 10)
    expect(r.bikeKm).toBeCloseTo(6.825, 10)
    expect(r.bestKm).toBeCloseTo(6.825, 10)
  })

  it('hängt nicht vom Szenario ab', () => {
    expect(radius('kleinstadt', 1).today).toEqual(radius('kleinstadt', 0).today)
  })

  it('nutzt radiusMinutes aus den Annahmen', () => {
    const a = { ...ASSUMPTIONS, radiusMinutes: 60 }
    const r = mobilityRadius(GERMANY, scenarioMetrics(GERMANY, NL, all(0)), profile('grossstadt'), a)
    expect(r.today.transitKm).toBeCloseTo(15, 10)
  })
})

describe('mobilityRadius – Szenario', () => {
  it.each(LOCATIONS)('entspricht bei Reglern = 0 dem heutigen Radius und 0 % Flächengewinn (%s)', (loc) => {
    const r = radius(loc, 0)
    expect(r.scenario).toEqual(r.today)
    expect(r.areaGainPct).toBeCloseTo(0, 10)
  })

  it.each(LOCATIONS)('ist bei Reglern = 1 größer (%s)', (loc) => {
    const r = radius(loc, 1)
    expect(r.scenario.bestKm).toBeGreaterThan(r.today.bestKm)
    expect(r.scenario.transitKm).toBeGreaterThan(r.today.transitKm)
    expect(r.scenario.bikeKm).toBeGreaterThan(r.today.bikeKm)
    expect(r.areaGainPct).toBeGreaterThan(0)
  })

  it('Handrechnung Großstadt bei NL: 9 km ÖPNV, +44 % Fläche', () => {
    const r = radius('grossstadt', 1)
    expect(r.scenario.transitKm).toBeCloseTo(9, 10)
    expect(r.scenario.bikeKm).toBeCloseTo(15 * 0.95 * 0.5, 10)
    expect(r.areaGainPct).toBeCloseTo(((9 / 7.5) ** 2 - 1) * 100, 8)
  })

  it.each(LOCATIONS)('areaGainPct ist konsistent mit (r1/r0)² − 1 (%s)', (loc) => {
    for (const s of [0, 0.3, 0.7, 1]) {
      const r = radius(loc, s)
      expect(r.areaGainPct).toBeCloseTo(((r.scenario.bestKm / r.today.bestKm) ** 2 - 1) * 100, 8)
    }
  })

  it('wächst monoton mit dem Regler', () => {
    let prev = -Infinity
    for (const s of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const best = radius('grossstadt', s).scenario.bestKm
      expect(best).toBeGreaterThanOrEqual(prev)
      prev = best
    }
  })

  it('schrumpft nie, wenn ein Benchmark niedrigere Geschwindigkeiten hat', () => {
    const slow: CountryData = { ...NL, id: 'slow', transitDoorToDoorKmh: 8, bikeDoorToDoorKmh: 7 }
    for (const loc of LOCATIONS) {
      const r = radius(loc, 1, slow)
      expect(r.scenario.transitKm).toBeGreaterThanOrEqual(r.today.transitKm)
      expect(r.scenario.bikeKm).toBeGreaterThanOrEqual(r.today.bikeKm)
      expect(r.scenario.bestKm).toBeGreaterThanOrEqual(r.today.bestKm)
      expect(r.areaGainPct).toBeGreaterThanOrEqual(0)
    }
  })

  it('verbessert nur die Dimension, in der der Benchmark besser ist', () => {
    const mixed: CountryData = { ...NL, id: 'mix', bikeDoorToDoorKmh: 8 }
    const r = radius('grossstadt', 1, mixed)
    expect(r.scenario.bikeKm).toBeCloseTo(r.today.bikeKm, 10)
    expect(r.scenario.transitKm).toBeGreaterThan(r.today.transitKm)
  })

  it('liefert 0 % Flächengewinn, wenn der heutige Radius 0 ist', () => {
    const base: CountryData = { ...GERMANY, transitDoorToDoorKmh: 0, bikeDoorToDoorKmh: 0 }
    const r = radius('grossstadt', 1, NL, base)
    expect(r.today.bestKm).toBe(0)
    expect(r.areaGainPct).toBe(0)
    expect(Number.isFinite(r.areaGainPct)).toBe(true)
  })
})
