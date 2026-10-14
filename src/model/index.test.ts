import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS, type CarCount, type Location } from '../config/assumptions'
import { BENCHMARKS, GERMANY, getBenchmark, type CountryData } from '../config/countries'
import { computeScenario, type ScenarioResult } from './index'
import type { Profile, Sliders } from './types'

const NL = BENCHMARKS[0]
const LOCATIONS: Location[] = ['grossstadt', 'kleinstadt', 'land']
const CARS: CarCount[] = [0, 1, 2]
const COMMUTES = [0, 17, 40]
const all = (v: number): Sliders => ({ transit: v, rail: v, bike: v, car: v })

/**
 * Testland: better than NL on frequency/network/car and on transit speed (twice as fast as Germany),
 * but worse than Germany on bike share, bike speed and rail.
 */
const DUMMY: CountryData = {
  id: 'test-dummy',
  name: 'Testland',
  inName: 'im Testland',
  flag: '🏳️',
  transitHeadwayMin: 5,
  transitLaneKmPer100k: 20,
  transitDoorToDoorKmh: GERMANY.transitDoorToDoorKmh * 2,
  railPunctuality: 0.5,
  bikeShare: 0.05,
  bikeLaneKmPer1000: 3.5,
  bikeDoorToDoorKmh: 8,
  carShare: 0.3,
}

/** Recursively collects all numbers of a result. */
function collectNumbers(v: unknown, out: number[] = []): number[] {
  if (typeof v === 'number') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => collectNumbers(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectNumbers(x, out))
  return out
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.values(o).forEach(deepFreeze)
    Object.freeze(o)
  }
  return o
}

describe('Plausibility check – all sliders 0', () => {
  for (const location of LOCATIONS) {
    for (const cars of CARS) {
      for (const commuteKm of COMMUTES) {
        it(`yields nothing: ${location}, ${cars} Auto(s), ${commuteKm} km`, () => {
          const r = computeScenario(NL, all(0), { location, cars, commuteKm })
          expect(r.time.totalMinPerWeek).toBe(0)
          expect(r.time.totalHoursPerWeek).toBe(0)
          expect(r.money.totalPerYear).toBe(0)
          expect(r.investment.totalEur).toBe(0)
          expect(r.investment.extraOperatingEurPerYear).toBe(0)
          expect(r.externalSavingsPerYear).toBe(0)
          expect(r.co2KgPerPersonYear).toBe(0)
          expect(r.costBenefit.breakEvenYear).toBeNull()
          expect(r.radius.areaGainPct).toBeCloseTo(0, 10)
        })
      }
    }
  }

  it('returns metrics = Germany and improvements = 0', () => {
    const r = computeScenario(NL, all(0), { location: 'kleinstadt', cars: 1, commuteKm: 17 })
    expect(r.improvements).toEqual({ transit: 0, rail: 0, bike: 0, car: 0 })
    expect(r.metrics.transitHeadwayMin).toBe(GERMANY.transitHeadwayMin)
    expect(r.metrics.carShare).toBe(GERMANY.carShare)
  })
})

describe('Plausibility check – all sliders 1 (NL, 17 km)', () => {
  const results = (cars: CarCount) =>
    LOCATIONS.map((location) => ({
      location,
      r: computeScenario(NL, all(1), { location, cars, commuteKm: 17 }),
    }))

  it('time savings in every location, rounded to one decimal place (as displayed), are between 2 and 3 hours/week', () => {
    for (const { r } of results(1)) {
      const displayed = Math.round(r.time.totalHoursPerWeek * 10) / 10
      expect(displayed).toBeGreaterThanOrEqual(2)
      expect(displayed).toBeLessThanOrEqual(3)
    }
  })

  it('savings from giving up a car amount to several thousand €/year', () => {
    for (const cars of [1, 2] as CarCount[]) {
      for (const { r } of results(cars)) {
        expect(r.money.savingsIfCarAbolished).toBeGreaterThan(3000)
      }
    }
  })

  it('expected savings in a big city with 1 car are above 2000 €/year', () => {
    const r = computeScenario(NL, all(1), { location: 'grossstadt', cars: 1, commuteKm: 17 })
    expect(r.money.totalPerYear).toBeGreaterThan(2000)
    // Expectation = probability × (full car cost − ticket) × 12
    const saving = (ASSUMPTIONS.carFullCostPerMonth - ASSUMPTIONS.transitTicketPerMonth) * 12
    expect(r.money.savingsIfCarAbolished).toBe(saving)
    expect(r.money.totalPerYear).toBeCloseTo(r.money.carAbolishProbability * saving, 6)
  })

  it('investment need is between 50 and 400 billion €', () => {
    const r = computeScenario(NL, all(1), { location: 'kleinstadt', cars: 1, commuteKm: 17 })
    expect(r.investment.totalEur).toBeGreaterThan(50e9)
    expect(r.investment.totalEur).toBeLessThan(400e9)
  })

  it('break-even is within 1 to 30 years', () => {
    const r = computeScenario(NL, all(1), { location: 'kleinstadt', cars: 1, commuteKm: 17 })
    expect(typeof r.costBenefit.breakEvenYear).toBe('number')
    expect(r.costBenefit.breakEvenYear).toBeGreaterThanOrEqual(1)
    expect(r.costBenefit.breakEvenYear).toBeLessThanOrEqual(30)
  })

  it('external cost savings = sum of the individual items, CO₂ > 0', () => {
    const r = computeScenario(NL, all(1), { location: 'grossstadt', cars: 1, commuteKm: 17 })
    expect(r.externalSavingsPerYear).toBeCloseTo(r.externalSavings.reduce((s, e) => s + e.eurPerYear, 0), 0)
    expect(r.externalSavingsPerYear).toBeGreaterThan(0)
    expect(r.co2KgPerPersonYear).toBeGreaterThan(0)
  })

  it('households without a car save only on service, not on monetised time', () => {
    for (const { r } of results(0)) {
      expect(r.money.carAbolishProbability).toBe(0)
      expect(r.money.totalPerYear).toBeGreaterThan(0)
      expect(r.money.totalPerYear).toBe(r.money.betterServicePerYear)
    }
  })

  it('big city has the highest probability of giving up a car (1 car)', () => {
    const [g, k, l] = results(1).map(({ r }) => r.money.carAbolishProbability)
    expect(g).toBeGreaterThan(k)
    expect(k).toBeGreaterThan(l)
  })
})

describe('computeScenario – integration', () => {
  it('combines partial results consistently', () => {
    const profile: Profile = { location: 'grossstadt', cars: 1, commuteKm: 17 }
    const r = computeScenario(NL, all(0.5), profile)
    expect(r.metrics.railPunctuality).toBeCloseTo((GERMANY.railPunctuality + NL.railPunctuality) / 2, 10)
    expect(r.improvements.bike).toBeCloseTo((NL.bikeShare - GERMANY.bikeShare) / 2, 10)
    expect(r.costBenefit.timeline).toHaveLength(ASSUMPTIONS.horizonYears)
    const last = r.costBenefit.timeline[r.costBenefit.timeline.length - 1]
    // Benefit grows linearly during the build period (progress y / buildYears), then fully:
    // Sum over all years y = 1…horizon of min(1, y / buildYears).
    let years = 0
    for (let y = 1; y <= ASSUMPTIONS.horizonYears; y++) years += Math.min(1, y / ASSUMPTIONS.buildYears)
    expect(last.cumulativeBenefit).toBeCloseTo(r.externalSavingsPerYear * years, -3)
  })

  it('uses the assumptions passed in', () => {
    const a = { ...ASSUMPTIONS, buildYears: 2, horizonYears: 5 }
    const r = computeScenario(NL, all(1), { location: 'kleinstadt', cars: 1, commuteKm: 17 }, a)
    expect(r.costBenefit.timeline).toHaveLength(5)
  })

  it('uses the base country passed in', () => {
    const base: CountryData = { ...GERMANY, id: 'zz', transitHeadwayMin: 40 }
    const r = computeScenario(NL, all(1), { location: 'kleinstadt', cars: 1, commuteKm: 17 }, ASSUMPTIONS, base)
    expect(r.improvements.transit).toBeCloseTo(1 - NL.transitHeadwayMin / 40, 10)
  })

  it('is a pure function: same input yields same output', () => {
    const profile: Profile = { location: 'land', cars: 2, commuteKm: 40 }
    const s: Sliders = { transit: 0.3, rail: 0.6, bike: 0.9, car: 0.45 }
    const r1 = computeScenario(NL, s, profile)
    const r2 = computeScenario(NL, s, profile)
    expect(r2).toEqual(r1)
    expect(r2).not.toBe(r1)
  })

  it('mutates neither assumptions nor inputs', () => {
    const before = structuredClone(ASSUMPTIONS)
    const nlBefore = structuredClone(NL)
    const deBefore = structuredClone(GERMANY)
    const sliders = all(1)
    const profile: Profile = { location: 'grossstadt', cars: 2, commuteKm: 17 }
    computeScenario(NL, sliders, profile)
    expect(ASSUMPTIONS).toEqual(before)
    expect(NL).toEqual(nlBefore)
    expect(GERMANY).toEqual(deBefore)
    expect(sliders).toEqual(all(1))
    expect(profile).toEqual({ location: 'grossstadt', cars: 2, commuteKm: 17 })
  })

  it('does not write to deeply frozen inputs (ESM strict mode would throw)', () => {
    const a = deepFreeze(structuredClone(ASSUMPTIONS))
    const bench = deepFreeze(structuredClone(NL))
    const base = deepFreeze(structuredClone(GERMANY))
    const sliders = deepFreeze(all(1))
    const profile = deepFreeze<Profile>({ location: 'kleinstadt', cars: 1, commuteKm: 17 })
    expect(() => computeScenario(bench, sliders, profile, a, base)).not.toThrow()
  })
})

describe('Extensibility – dummy country without code change', () => {
  const profiles: Profile[] = LOCATIONS.flatMap((location) =>
    CARS.flatMap((cars) => COMMUTES.map((commuteKm) => ({ location, cars, commuteKm }))),
  )
  const sliderSets: Sliders[] = [all(0), all(0.5), all(1), { transit: 1, rail: 0, bike: 1, car: 0 }, { transit: 0, rail: 1, bike: 0, car: 1 }]

  it('getBenchmark finds the dummy country in an extended list', () => {
    expect(getBenchmark('test-dummy', [...BENCHMARKS, DUMMY])).toBe(DUMMY)
    expect(getBenchmark('nl', [...BENCHMARKS, DUMMY])).toBe(NL)
  })

  it('getBenchmark falls back to the first benchmark country for an unknown ID', () => {
    expect(getBenchmark('unknown')).toBe(BENCHMARKS[0])
    expect(getBenchmark(null)).toBe(BENCHMARKS[0])
    expect(getBenchmark(undefined)).toBe(BENCHMARKS[0])
    expect(getBenchmark('unknown', [DUMMY, ...BENCHMARKS])).toBe(DUMMY)
  })

  it('computeScenario works simply by passing the object', () => {
    const r = computeScenario(DUMMY, all(1), { location: 'grossstadt', cars: 1, commuteKm: 17 })
    expect(r.metrics.transitHeadwayMin).toBe(DUMMY.transitHeadwayMin)
    expect(r.metrics.bikeShare).toBe(DUMMY.bikeShare)
    expect(r.improvements.transit).toBeCloseTo(1 - DUMMY.transitHeadwayMin / GERMANY.transitHeadwayMin, 10)
    expect(r.improvements.car).toBeCloseTo(1 - DUMMY.carShare / GERMANY.carShare, 10)
  })

  it('does not count worse dimensions as deterioration', () => {
    const r = computeScenario(DUMMY, all(1), { location: 'kleinstadt', cars: 1, commuteKm: 17 })
    expect(r.improvements.rail).toBe(0)
    expect(r.improvements.bike).toBe(0)
    expect(r.time.bufferMin).toBe(0)
    expect(r.time.everydayMin).toBe(0)
    expect(r.investment.railEur).toBe(0)
    expect(r.radius.scenario.bikeKm).toBeGreaterThanOrEqual(r.radius.today.bikeKm)
    expect(r.radius.scenario.bestKm).toBeGreaterThanOrEqual(r.radius.today.bestKm)
  })

  it('returns finite numbers for all profiles and slider positions', () => {
    for (const p of profiles) {
      for (const s of sliderSets) {
        const r = computeScenario(DUMMY, s, p)
        for (const n of collectNumbers(r)) expect(Number.isFinite(n)).toBe(true)
      }
    }
  })

  it('returns no negative time, money or investment values', () => {
    for (const p of profiles) {
      for (const s of sliderSets) {
        const r: ScenarioResult = computeScenario(DUMMY, s, p)
        const values = [
          ...collectNumbers(r.time),
          ...collectNumbers(r.money),
          ...collectNumbers(r.investment),
          ...collectNumbers(r.improvements),
          ...collectNumbers(r.externalSavings),
          ...collectNumbers(r.costBenefit.timeline),
          r.externalSavingsPerYear,
          r.co2KgPerPersonYear,
          r.radius.areaGainPct,
          r.radius.scenario.bestKm,
        ]
        for (const v of values) expect(v).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('also computes 0 with a dummy country as a plausibility check at sliders = 0', () => {
    for (const p of profiles) {
      const r = computeScenario(DUMMY, all(0), p)
      expect(r.time.totalMinPerWeek).toBe(0)
      expect(r.money.totalPerYear).toBe(0)
      expect(r.investment.totalEur).toBe(0)
      expect(r.externalSavingsPerYear).toBe(0)
      expect(r.co2KgPerPersonYear).toBe(0)
      expect(r.costBenefit.breakEvenYear).toBeNull()
    }
  })

  it('also applies the dummy country in the investment calculation (speed 2× → extra operating costs, denser network → lines)', () => {
    const r = computeScenario(DUMMY, { transit: 1, rail: 0, bike: 0, car: 0 }, { location: 'kleinstadt', cars: 1, commuteKm: 17 })
    const A = ASSUMPTIONS
    const km = (DUMMY.transitLaneKmPer100k - GERMANY.transitLaneKmPer100k) * (A.population / 100_000)
    expect(km).toBeGreaterThan(0)
    expect(r.investment.transitLaneKm).toBeCloseTo(km, 6)
    expect(r.investment.transitEur).toBeCloseTo(km * A.transitLaneCostPerKm, 0)
    // Speed twice as high → relative speed gain 1.
    expect(r.investment.extraOperatingEurPerYear).toBeCloseTo(
      (DUMMY.transitDoorToDoorKmh / GERMANY.transitDoorToDoorKmh - 1) * A.transitOperatingCostPerYear * A.transitExtraOperatingNetShare,
      0,
    )
    expect(r.investment.extraOperatingEurPerYear).toBeCloseTo(A.transitOperatingCostPerYear * A.transitExtraOperatingNetShare, 0)
  })

  it('extra operating costs depend on speed, not frequency: dummy country with slower transit has none despite headway 5', () => {
    const slow: CountryData = { ...DUMMY, transitDoorToDoorKmh: GERMANY.transitDoorToDoorKmh - 3 }
    const r = computeScenario(slow, { transit: 1, rail: 0, bike: 0, car: 0 }, { location: 'kleinstadt', cars: 1, commuteKm: 17 })
    expect(r.improvements.transit).toBeGreaterThan(0)
    expect(r.investment.extraOperatingEurPerYear).toBe(0)
  })
})
