import { describe, expect, it } from 'vitest'
import { BENCHMARKS, GERMANY, type CountryData } from '../config/countries'
import { clamp, improvements, lerp, scenarioMetrics } from './interpolate'
import type { ScenarioMetrics, Sliders } from './types'

const NL = BENCHMARKS[0]
const all = (v: number): Sliders => ({ transit: v, rail: v, bike: v, car: v })

const METRIC_KEYS: (keyof ScenarioMetrics)[] = [
  'transitHeadwayMin',
  'transitLaneKmPer100k',
  'transitDoorToDoorKmh',
  'railPunctuality',
  'bikeShare',
  'bikeLaneKmPer1000',
  'bikeDoorToDoorKmh',
  'carShare',
]

describe('clamp', () => {
  it('leaves values within the interval unchanged', () => {
    expect(clamp(0.3)).toBe(0.3)
    expect(clamp(0)).toBe(0)
    expect(clamp(1)).toBe(1)
  })
  it('clamps to the default interval [0, 1]', () => {
    expect(clamp(-5)).toBe(0)
    expect(clamp(7)).toBe(1)
  })
  it('clamps to a custom interval', () => {
    expect(clamp(15, 10, 20)).toBe(15)
    expect(clamp(5, 10, 20)).toBe(10)
    expect(clamp(25, 10, 20)).toBe(20)
  })
  it('returns the lower bound for NaN', () => {
    expect(clamp(NaN)).toBe(0)
    expect(clamp(NaN, 3, 9)).toBe(3)
  })
})

describe('lerp', () => {
  it('interpolates linearly', () => {
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
    expect(lerp(10, 20, 0.25)).toBeCloseTo(12.5, 10)
  })
  it('also works descending', () => {
    expect(lerp(20, 10, 0.5)).toBeCloseTo(15, 10)
  })
  it('clamps t to [0, 1]', () => {
    expect(lerp(10, 20, -1)).toBe(10)
    expect(lerp(10, 20, 2)).toBe(20)
    expect(lerp(10, 20, NaN)).toBe(10)
  })
})

describe('scenarioMetrics', () => {
  it('returns exactly the German values at sliders = 0', () => {
    const m = scenarioMetrics(GERMANY, NL, all(0))
    for (const k of METRIC_KEYS) expect(m[k]).toBe(GERMANY[k])
  })

  it('returns exactly the benchmark values at sliders = 1', () => {
    const m = scenarioMetrics(GERMANY, NL, all(1))
    // Floating point: from + (to − from) × 1 is not always bit-identical to to.
    for (const k of METRIC_KEYS) expect(m[k]).toBeCloseTo(NL[k], 10)
  })

  it('returns the midpoints of all 8 metrics at sliders = 0.5', () => {
    const m = scenarioMetrics(GERMANY, NL, all(0.5))
    expect(METRIC_KEYS).toHaveLength(8)
    for (const k of METRIC_KEYS) expect(m[k]).toBeCloseTo((GERMANY[k] + NL[k]) / 2, 10)
  })

  it('maps each slider to the correct metrics', () => {
    const m = scenarioMetrics(GERMANY, NL, { transit: 1, rail: 0, bike: 0, car: 0 })
    expect(m.transitHeadwayMin).toBeCloseTo(NL.transitHeadwayMin, 10)
    expect(m.transitLaneKmPer100k).toBeCloseTo(NL.transitLaneKmPer100k, 10)
    expect(m.transitDoorToDoorKmh).toBeCloseTo(NL.transitDoorToDoorKmh, 10)
    expect(m.railPunctuality).toBe(GERMANY.railPunctuality)
    expect(m.bikeShare).toBe(GERMANY.bikeShare)
    expect(m.bikeLaneKmPer1000).toBe(GERMANY.bikeLaneKmPer1000)
    expect(m.bikeDoorToDoorKmh).toBe(GERMANY.bikeDoorToDoorKmh)
    expect(m.carShare).toBe(GERMANY.carShare)

    const r = scenarioMetrics(GERMANY, NL, { transit: 0, rail: 1, bike: 0, car: 0 })
    expect(r.railPunctuality).toBeCloseTo(NL.railPunctuality, 10)
    expect(r.transitHeadwayMin).toBe(GERMANY.transitHeadwayMin)

    const b = scenarioMetrics(GERMANY, NL, { transit: 0, rail: 0, bike: 1, car: 0 })
    expect(b.bikeShare).toBeCloseTo(NL.bikeShare, 10)
    expect(b.bikeLaneKmPer1000).toBeCloseTo(NL.bikeLaneKmPer1000, 10)
    expect(b.bikeDoorToDoorKmh).toBeCloseTo(NL.bikeDoorToDoorKmh, 10)
    expect(b.carShare).toBe(GERMANY.carShare)

    const c = scenarioMetrics(GERMANY, NL, { transit: 0, rail: 0, bike: 0, car: 1 })
    expect(c.carShare).toBeCloseTo(NL.carShare, 10)
    expect(c.bikeShare).toBe(GERMANY.bikeShare)
  })

  it('clamps slider values outside [0, 1]', () => {
    const lo = scenarioMetrics(GERMANY, NL, all(-3))
    const hi = scenarioMetrics(GERMANY, NL, all(4))
    for (const k of METRIC_KEYS) {
      expect(lo[k]).toBe(GERMANY[k])
      expect(hi[k]).toBeCloseTo(NL[k], 10)
    }
  })
})

describe('improvements', () => {
  it('is zero everywhere at sliders = 0', () => {
    const imp = improvements(GERMANY, scenarioMetrics(GERMANY, NL, all(0)))
    expect(imp).toEqual({ transit: 0, rail: 0, bike: 0, car: 0 })
  })

  it('returns the Netherlands values at sliders = 1', () => {
    const imp = improvements(GERMANY, scenarioMetrics(GERMANY, NL, all(1)))
    expect(imp.transit).toBeCloseTo(1 - NL.transitHeadwayMin / GERMANY.transitHeadwayMin, 10)
    expect(imp.rail).toBeCloseTo(NL.railPunctuality - GERMANY.railPunctuality, 10)
    expect(imp.bike).toBeCloseTo(NL.bikeShare - GERMANY.bikeShare, 10)
    expect(imp.car).toBeCloseTo(1 - NL.carShare / GERMANY.carShare, 10)
  })

  it('grows linearly with the slider (slider 0.5 → half the share points)', () => {
    const imp = improvements(GERMANY, scenarioMetrics(GERMANY, NL, all(0.5)))
    expect(imp.rail).toBeCloseTo((NL.railPunctuality - GERMANY.railPunctuality) / 2, 10)
    expect(imp.bike).toBeCloseTo((NL.bikeShare - GERMANY.bikeShare) / 2, 10)
    const halfHeadway = (GERMANY.transitHeadwayMin + NL.transitHeadwayMin) / 2
    expect(imp.transit).toBeCloseTo(1 - halfHeadway / GERMANY.transitHeadwayMin, 10)
  })

  it('never goes negative when a benchmark is worse than Germany', () => {
    const worse: CountryData = {
      id: 'bad',
      name: 'Schlechtland',
      inName: 'in Schlechtland',
      flag: '🏳️',
      transitHeadwayMin: 40,
      transitLaneKmPer100k: 3,
      transitDoorToDoorKmh: 10,
      railPunctuality: 0.4,
      bikeShare: 0.02,
      bikeLaneKmPer1000: 0.2,
      bikeDoorToDoorKmh: 9,
      carShare: 0.8,
    }
    for (const v of [0, 0.25, 0.5, 1]) {
      const imp = improvements(GERMANY, scenarioMetrics(GERMANY, worse, all(v)))
      expect(imp.transit).toBe(0)
      expect(imp.rail).toBe(0)
      expect(imp.bike).toBe(0)
      expect(imp.car).toBe(0)
    }
  })

  it('stays at 0 in mixed benchmarks only in the worse dimensions', () => {
    const mixed: CountryData = { ...NL, id: 'mix', bikeShare: 0.05, railPunctuality: 0.5 }
    const imp = improvements(GERMANY, scenarioMetrics(GERMANY, mixed, all(1)))
    expect(imp.bike).toBe(0)
    expect(imp.rail).toBe(0)
    expect(imp.transit).toBeCloseTo(1 - NL.transitHeadwayMin / GERMANY.transitHeadwayMin, 10)
    expect(imp.car).toBeGreaterThan(0)
  })
})
