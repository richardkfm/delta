import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS, type Assumptions, type CarCount, type Location } from '../config/assumptions'
import { BENCHMARKS, GERMANY } from '../config/countries'
import { improvements, scenarioMetrics } from './interpolate'
import { carAbolishProbability, moneySavings, timeSavings } from './personal'
import type { Improvements, Profile } from './types'

const A = ASSUMPTIONS
const LOCATIONS: Location[] = ['grossstadt', 'kleinstadt', 'land']
const P_DE = GERMANY.railPunctuality

const ZERO: Improvements = { transit: 0, rail: 0, bike: 0, car: 0 }
/** Improvements at full benchmark level (Netherlands), derived from the config. */
const NL_FULL: Improvements = improvements(
  GERMANY,
  scenarioMetrics(GERMANY, BENCHMARKS[0], { transit: 1, rail: 1, bike: 1, car: 1 }),
)
/** Improvements at which each dimension exactly reaches its reference improvement. */
const REF_FULL: Improvements = { ...A.carAbolishReferenceImprovement }

/**
 * Hand-calculable assumptions, independent of the config: formula tests with fixed numbers
 * use these so that changes to the sourced values do not break them.
 */
const H: Assumptions = {
  ...A,
  commuteMinutesPerDay: 60,
  averageCommuteKm: 17,
  workDaysPerWeek: 5,
  workWeeksPerYear: 46,
  transitCommuteElasticity: 0.36,
  bufferMinutesPerDay: 10,
  everydayTripMinutesPerWeek: 300,
  bikeTimeElasticity: 0.75,
  locationFactors: {
    grossstadt: { transit: 0.9, rail: 1.0, bike: 1.2, maxCarAbolishProbability: 0.7, transitSpeed: 1.0, bikeSpeed: 0.95 },
    kleinstadt: { transit: 1.0, rail: 1.0, bike: 1.0, maxCarAbolishProbability: 0.45, transitSpeed: 0.8, bikeSpeed: 1.0 },
    land: { transit: 1.3, rail: 0.9, bike: 0.6, maxCarAbolishProbability: 0.25, transitSpeed: 0.6, bikeSpeed: 1.05 },
  },
  carAbolishWeights: { transit: 0.35, rail: 0.15, bike: 0.25, car: 0.25 },
  carAbolishReferenceImprovement: { transit: 0.5, rail: 0.28, bike: 0.16, car: 0.175 },
  carFullCostPerMonth: 550,
  transitTicketPerMonth: 60,
  secondCarProbabilityFactor: 1.4,
  maxProbability: 0.95,
  noCarSubstituteCostPerYear: 600,
  noCarSubstituteReductionMax: 0.5,
  valueOfTimePerHour: 8,
}
const P_H = 0.62
/** Full reference level under H. */
const H_FULL: Improvements = { ...H.carAbolishReferenceImprovement }

const profile = (location: Location = 'kleinstadt', commuteKm = 17, cars: CarCount = 1): Profile => ({
  location,
  commuteKm,
  cars,
})

describe('timeSavings – commute time (transit frequency only)', () => {
  const imp: Improvements = { ...ZERO, transit: 0.5 }

  it('is zero without improvement', () => {
    const t = timeSavings(ZERO, profile(), P_DE, A)
    expect(t.commuteMin).toBe(0)
    expect(t.bufferMin).toBe(0)
    expect(t.everydayMin).toBe(0)
    expect(t.totalMinPerWeek).toBe(0)
    expect(t.totalHoursPerWeek).toBe(0)
  })

  it('hand calculation small town, 17 km: 60 × 0.36 × 0.5 × 1.0 × 5 = 54 min/week', () => {
    const t = timeSavings(imp, profile('kleinstadt', 17), P_H, H)
    expect(t.commuteMin).toBeCloseTo(54, 10)
    expect(t.bufferMin).toBe(0)
    expect(t.everydayMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(54, 10)
    expect(t.totalHoursPerWeek).toBeCloseTo(0.9, 10)
  })

  it('matches the formula commute time × distance/average distance × elasticity × improvement × location × work days with the config assumptions', () => {
    for (const loc of LOCATIONS) {
      const km = 2 * A.averageCommuteKm
      const expected =
        A.commuteMinutesPerDay * 2 * A.transitCommuteElasticity * 0.5 * A.locationFactors[loc].transit * A.workDaysPerWeek
      expect(timeSavings(imp, profile(loc, km), P_DE, A).commuteMin).toBeCloseTo(expected, 10)
    }
  })

  it('scales linearly with commute distance', () => {
    const t17 = timeSavings(imp, profile('kleinstadt', 17), P_DE, A).commuteMin
    expect(timeSavings(imp, profile('kleinstadt', 34), P_DE, A).commuteMin).toBeCloseTo(2 * t17, 10)
    expect(timeSavings(imp, profile('kleinstadt', 8.5), P_DE, A).commuteMin).toBeCloseTo(t17 / 2, 10)
    expect(timeSavings(imp, profile('kleinstadt', 40), P_DE, A).commuteMin).toBeCloseTo((t17 * 40) / 17, 10)
  })

  it('scales linearly with the frequency improvement', () => {
    const a = timeSavings({ ...ZERO, transit: 0.1 }, profile(), P_DE, A).commuteMin
    const b = timeSavings({ ...ZERO, transit: 0.3 }, profile(), P_DE, A).commuteMin
    expect(b).toBeCloseTo(3 * a, 10)
  })

  it('applies the location factor', () => {
    for (const loc of LOCATIONS) {
      const t = timeSavings(imp, profile(loc, 17), P_H, H)
      expect(t.commuteMin).toBeCloseTo(54 * H.locationFactors[loc].transit, 10)
    }
  })

  it('is zero at 0 km commute distance', () => {
    expect(timeSavings(imp, profile('kleinstadt', 0), P_DE, A).commuteMin).toBe(0)
  })

  it('treats negative distances as 0', () => {
    const t = timeSavings({ ...NL_FULL, bike: 0 }, profile('kleinstadt', -10), P_DE, A)
    expect(t.commuteMin).toBe(0)
    expect(t.bufferMin).toBe(0)
  })
})

describe('timeSavings – buffer time (rail punctuality only)', () => {
  it('hand calculation 17 km, +0.19 punctuality: 10 × 0.19/0.38 × 5 = 25 min/week', () => {
    const t = timeSavings({ ...ZERO, rail: 0.19 }, profile('kleinstadt', 17), P_H, H)
    expect(t.bufferMin).toBeCloseTo(25, 10)
    expect(t.commuteMin).toBe(0)
    expect(t.everydayMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(25, 10)
  })

  it('hand calculation 17 km, +0.28 punctuality: 10 × 0.28/0.38 × 5 ≈ 36.84 min/week', () => {
    const t = timeSavings({ ...ZERO, rail: 0.28 }, profile('kleinstadt', 17), P_H, H)
    expect(t.bufferMin).toBeCloseTo((10 * 0.28 * 5) / 0.38, 8)
  })

  it('NL level with config assumptions: buffer × gain/(1 − p_DE) × work days, capped', () => {
    const t = timeSavings({ ...ZERO, rail: NL_FULL.rail }, profile('kleinstadt', A.averageCommuteKm), P_DE, A)
    const perDay = Math.min(A.bufferMinutesPerDay, (A.bufferMinutesPerDay * NL_FULL.rail) / (1 - P_DE))
    expect(t.bufferMin).toBeCloseTo(perDay * A.locationFactors.kleinstadt.rail * A.workDaysPerWeek, 8)
  })

  it('is capped at bufferMinutesPerDay (× work days)', () => {
    // 0.38 gain = unpunctuality eliminated entirely; more must not yield anything further.
    const full = timeSavings({ ...ZERO, rail: 0.38 }, profile('kleinstadt', 17), P_H, H).bufferMin
    const over = timeSavings({ ...ZERO, rail: 0.9 }, profile('kleinstadt', 17), P_H, H).bufferMin
    expect(full).toBeCloseTo(H.bufferMinutesPerDay * H.workDaysPerWeek, 10)
    expect(over).toBeCloseTo(H.bufferMinutesPerDay * H.workDaysPerWeek, 10)
  })

  it('is weighted by min(1, commute distance / average distance)', () => {
    const imp: Improvements = { ...ZERO, rail: 0.19 }
    const full = timeSavings(imp, profile('kleinstadt', 17), P_H, H).bufferMin
    expect(timeSavings(imp, profile('kleinstadt', 8.5), P_H, H).bufferMin).toBeCloseTo(full / 2, 10)
    expect(timeSavings(imp, profile('kleinstadt', 34), P_H, H).bufferMin).toBeCloseTo(full, 10)
    expect(timeSavings(imp, profile('kleinstadt', 40), P_H, H).bufferMin).toBeCloseTo(full, 10)
  })

  it('is zero at 0 km commute distance', () => {
    expect(timeSavings({ ...ZERO, rail: 0.28 }, profile('kleinstadt', 0), P_DE, A).bufferMin).toBe(0)
  })

  it('applies the rail location factor', () => {
    const imp: Improvements = { ...ZERO, rail: 0.19 }
    for (const loc of LOCATIONS) {
      const t = timeSavings(imp, profile(loc, 17), P_H, H)
      expect(t.bufferMin).toBeCloseTo(25 * H.locationFactors[loc].rail, 10)
    }
  })

  it('does not divide by 0 at base punctuality 1', () => {
    const t = timeSavings({ ...ZERO, rail: 0.1 }, profile(), 1, A)
    expect(t.bufferMin).toBe(0)
    expect(Number.isFinite(t.totalMinPerWeek)).toBe(true)
  })
})

describe('timeSavings – everyday trips (bike only)', () => {
  it('hand calculation small town: 300 × 0.75 × 0.16 × 1.0 = 36 min/week', () => {
    const t = timeSavings({ ...ZERO, bike: 0.16 }, profile('kleinstadt', 17), P_H, H)
    expect(t.everydayMin).toBeCloseTo(36, 10)
    expect(t.commuteMin).toBe(0)
    expect(t.bufferMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(36, 10)
  })

  it('applies the bike location factor', () => {
    for (const loc of LOCATIONS) {
      const t = timeSavings({ ...ZERO, bike: 0.16 }, profile(loc, 17), P_H, H)
      expect(t.everydayMin).toBeCloseTo(36 * H.locationFactors[loc].bike, 10)
    }
  })

  it('matches everyday time × elasticity × increase in bike share × location with the config assumptions', () => {
    for (const loc of LOCATIONS) {
      const t = timeSavings({ ...ZERO, bike: NL_FULL.bike }, profile(loc), P_DE, A)
      const expected =
        A.everydayTripMinutesPerWeek * A.bikeTimeElasticity * NL_FULL.bike * A.locationFactors[loc].bike
      expect(t.everydayMin).toBeCloseTo(expected, 10)
    }
  })

  it('does not depend on commute distance', () => {
    const imp: Improvements = { ...ZERO, bike: 0.16 }
    const a = timeSavings(imp, profile('grossstadt', 0), P_DE, A).everydayMin
    const b = timeSavings(imp, profile('grossstadt', 40), P_DE, A).everydayMin
    expect(a).toBeCloseTo(b, 10)
    expect(a).toBeGreaterThan(0)
  })
})

describe('timeSavings – total', () => {
  it('adds all components, hours = minutes / 60', () => {
    const t = timeSavings(NL_FULL, profile('grossstadt', 17), P_DE, A)
    expect(t.totalMinPerWeek).toBeCloseTo(t.commuteMin + t.bufferMin + t.everydayMin, 10)
    expect(t.totalHoursPerWeek).toBeCloseTo(t.totalMinPerWeek / 60, 10)
  })

  it('is only the everyday component at 0 km (commuting + buffer = 0)', () => {
    const t = timeSavings(NL_FULL, profile('kleinstadt', 0), P_DE, A)
    expect(t.commuteMin + t.bufferMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(t.everydayMin, 10)
    expect(t.everydayMin).toBeGreaterThan(0)
  })

  it('uses the assumptions passed in', () => {
    const a = { ...H, workDaysPerWeek: 4 }
    const t = timeSavings({ ...ZERO, transit: 0.5 }, profile('kleinstadt', 17), P_H, a)
    expect(t.commuteMin).toBeCloseTo(60 * 0.36 * 0.5 * 4, 10)
  })
})

describe('carAbolishProbability', () => {
  it('is 0 without improvements', () => {
    for (const loc of LOCATIONS) expect(carAbolishProbability(ZERO, profile(loc), A)).toBe(0)
  })

  it('equals the location cap at full reference level', () => {
    for (const loc of LOCATIONS) {
      expect(carAbolishProbability(REF_FULL, profile(loc), A)).toBeCloseTo(
        A.locationFactors[loc].maxCarAbolishProbability,
        10,
      )
    }
  })

  it('never exceeds the location cap at full NL level and lies just below or at it', () => {
    for (const loc of LOCATIONS) {
      const cap = A.locationFactors[loc].maxCarAbolishProbability
      const p = carAbolishProbability(NL_FULL, profile(loc), A)
      expect(p).toBeLessThanOrEqual(cap + 1e-12)
      expect(p).toBeGreaterThan(0.9 * cap)
    }
  })

  it('is monotonically increasing in each individual improvement', () => {
    const keys = ['transit', 'rail', 'bike', 'car'] as const
    for (const k of keys) {
      let prev = -1
      for (let i = 0; i <= 10; i++) {
        const imp: Improvements = { ...ZERO, [k]: (NL_FULL[k] * i) / 10 }
        const p = carAbolishProbability(imp, profile('grossstadt'), A)
        expect(p).toBeGreaterThanOrEqual(prev)
        prev = p
      }
      expect(prev).toBeGreaterThan(0)
    }
  })

  it('hand calculation: only headway halved (full reference) → weight 0.35 × cap', () => {
    const imp: Improvements = { ...ZERO, transit: 0.5 }
    expect(carAbolishProbability(imp, profile('grossstadt'), H)).toBeCloseTo(0.35 * 0.7, 10)
    expect(carAbolishProbability(imp, profile('kleinstadt'), H)).toBeCloseTo(0.35 * 0.45, 10)
    expect(carAbolishProbability(imp, profile('land'), H)).toBeCloseTo(0.35 * 0.25, 10)
  })

  it('with the config assumptions and full reference on headway only equals: headway weight × cap', () => {
    const imp: Improvements = { ...ZERO, transit: A.carAbolishReferenceImprovement.transit }
    for (const loc of LOCATIONS) {
      expect(carAbolishProbability(imp, profile(loc), A)).toBeCloseTo(
        A.carAbolishWeights.transit * A.locationFactors[loc].maxCarAbolishProbability,
        10,
      )
    }
  })

  it('limits each contribution to its reference improvement', () => {
    const over: Improvements = { transit: 0.99, rail: 0.99, bike: 0.99, car: 0.99 }
    for (const loc of LOCATIONS) {
      expect(carAbolishProbability(over, profile(loc), A)).toBeCloseTo(A.locationFactors[loc].maxCarAbolishProbability, 10)
    }
  })

  it('orders big city > small town > countryside', () => {
    for (const imp of [NL_FULL, { ...ZERO, transit: 0.2, bike: 0.05 }]) {
      const g = carAbolishProbability(imp, profile('grossstadt'), A)
      const k = carAbolishProbability(imp, profile('kleinstadt'), A)
      const l = carAbolishProbability(imp, profile('land'), A)
      expect(g).toBeGreaterThan(k)
      expect(k).toBeGreaterThan(l)
      expect(l).toBeGreaterThan(0)
    }
  })

  it('is always within [0, 1]', () => {
    for (const loc of LOCATIONS) {
      const p = carAbolishProbability({ transit: 5, rail: 5, bike: 5, car: 5 }, profile(loc), A)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })
})

describe('moneySavings – one car', () => {
  const saving = (A.carFullCostPerMonth - A.transitTicketPerMonth) * 12

  it('total = probability × (full car cost − ticket) × 12', () => {
    for (const loc of LOCATIONS) {
      const pr = profile(loc, 17, 1)
      const time = timeSavings(NL_FULL, pr, P_DE, A)
      const m = moneySavings(NL_FULL, pr, time, A)
      const p = carAbolishProbability(NL_FULL, pr, A)
      expect(m.savingsIfCarAbolished).toBe(saving)
      expect(m.carAbolishProbability).toBeCloseTo(p, 10)
      expect(m.totalPerYear).toBeCloseTo(p * saving, 8)
      expect(m.betterServicePerYear).toBe(0)
      expect(m.timeValuePerYear).toBe(0)
    }
  })

  it('big city at full reference level (hand calculation): 0.7 × 5880 = 4116 €', () => {
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(H_FULL, pr, timeSavings(H_FULL, pr, P_H, H), H)
    expect(m.savingsIfCarAbolished).toBe(5880)
    expect(m.totalPerYear).toBeCloseTo(4116, 8)
  })

  it('is 0 without improvements', () => {
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(ZERO, pr, timeSavings(ZERO, pr, P_DE, A), A)
    expect(m.totalPerYear).toBe(0)
    expect(m.carAbolishProbability).toBe(0)
  })

  it('is capped at a small maxProbability', () => {
    // Cap below the location cap so that it takes effect.
    const cap = A.locationFactors.grossstadt.maxCarAbolishProbability / 2
    const a = { ...A, maxProbability: cap }
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(REF_FULL, pr, timeSavings(REF_FULL, pr, P_DE, a), a)
    expect(m.carAbolishProbability).toBeCloseTo(cap, 10)
    expect(m.totalPerYear).toBeCloseTo(cap * saving, 8)
  })

  it('uses the costs passed in', () => {
    const a = { ...A, carFullCostPerMonth: 400, transitTicketPerMonth: 100 }
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(NL_FULL, pr, timeSavings(NL_FULL, pr, P_DE, a), a)
    expect(m.savingsIfCarAbolished).toBe(3600)
  })
})

describe('moneySavings – two or more cars', () => {
  const saving = (A.carFullCostPerMonth - A.transitTicketPerMonth) * 12

  it('probability × second-car factor, capped at maxProbability', () => {
    for (const loc of LOCATIONS) {
      const pr1 = profile(loc, 17, 1)
      const pr2 = profile(loc, 17, 2)
      const t = timeSavings(NL_FULL, pr1, P_DE, A)
      const p1 = moneySavings(NL_FULL, pr1, t, A).carAbolishProbability
      const m2 = moneySavings(NL_FULL, pr2, t, A)
      expect(m2.carAbolishProbability).toBeCloseTo(
        Math.min(A.maxProbability, p1 * A.secondCarProbabilityFactor),
        10,
      )
      expect(m2.totalPerYear).toBeCloseTo(m2.carAbolishProbability * saving, 8)
    }
  })

  it('small town (uncapped): 0.45 × 1.4 = 0.63', () => {
    const pr = profile('kleinstadt', 17, 2)
    const m = moneySavings(H_FULL, pr, timeSavings(H_FULL, pr, P_H, H), H)
    expect(m.carAbolishProbability).toBeCloseTo(0.63, 10)
  })

  it('big city: 0.7 × 1.4 = 0.98 is capped at 0.95', () => {
    const pr = profile('grossstadt', 17, 2)
    const m = moneySavings(H_FULL, pr, timeSavings(H_FULL, pr, P_H, H), H)
    expect(m.carAbolishProbability).toBeCloseTo(0.95, 10)
    expect(m.totalPerYear).toBeCloseTo(0.95 * 5880, 8)
  })

  it('is 0 without improvements', () => {
    const pr = profile('grossstadt', 17, 2)
    expect(moneySavings(ZERO, pr, timeSavings(ZERO, pr, P_DE, A), A).totalPerYear).toBe(0)
  })
})

describe('moneySavings – households without a car', () => {
  it('has no car effect', () => {
    const pr = profile('grossstadt', 17, 0)
    const m = moneySavings(NL_FULL, pr, timeSavings(NL_FULL, pr, P_DE, A), A)
    expect(m.carAbolishProbability).toBe(0)
    expect(m.savingsIfCarAbolished).toBe(0)
  })

  it('total = better service + time value', () => {
    for (const loc of LOCATIONS) {
      const pr = profile(loc, 17, 0)
      const t = timeSavings(NL_FULL, pr, P_DE, A)
      const m = moneySavings(NL_FULL, pr, t, A)
      expect(m.totalPerYear).toBeCloseTo(m.betterServicePerYear + m.timeValuePerYear, 10)
      expect(m.timeValuePerYear).toBeCloseTo(t.totalHoursPerWeek * A.workWeeksPerYear * A.valueOfTimePerHour, 8)
    }
  })

  it('better service at full reference service: substitute costs × max. reduction × 1', () => {
    const pr = profile('kleinstadt', 17, 0)
    const m = moneySavings(REF_FULL, pr, timeSavings(REF_FULL, pr, P_DE, A), A)
    expect(m.betterServicePerYear).toBeCloseTo(A.noCarSubstituteCostPerYear * A.noCarSubstituteReductionMax, 10)
  })

  it('service index ignores the car share', () => {
    const pr = profile('kleinstadt', 17, 0)
    const imp: Improvements = { ...ZERO, car: 0.3 }
    const m = moneySavings(imp, pr, timeSavings(imp, pr, P_DE, A), A)
    expect(m.betterServicePerYear).toBe(0)
    expect(m.totalPerYear).toBe(0)
  })

  it('hand calculation headway only: index 0.35 / 0.75 → 600 × 0.5 × 0.4667 = 140 €', () => {
    const pr = profile('kleinstadt', 17, 0)
    const imp: Improvements = { ...ZERO, transit: 0.5 }
    const t = timeSavings(imp, pr, P_H, H)
    const m = moneySavings(imp, pr, t, H)
    expect(m.betterServicePerYear).toBeCloseTo(300 * (0.35 / 0.75), 10)
    expect(m.timeValuePerYear).toBeCloseTo(0.9 * 46 * 8, 8)
  })

  it('service index headway only = headway weight / sum of service weights (config assumptions)', () => {
    const w = A.carAbolishWeights
    const pr = profile('kleinstadt', 17, 0)
    const imp: Improvements = { ...ZERO, transit: A.carAbolishReferenceImprovement.transit }
    const m = moneySavings(imp, pr, timeSavings(imp, pr, P_DE, A), A)
    const index = w.transit / (w.transit + w.rail + w.bike)
    expect(m.betterServicePerYear).toBeCloseTo(A.noCarSubstituteCostPerYear * A.noCarSubstituteReductionMax * index, 10)
  })

  it('is 0 without improvements (service and time value)', () => {
    for (const loc of LOCATIONS) {
      const pr = profile(loc, 17, 0)
      const m = moneySavings(ZERO, pr, timeSavings(ZERO, pr, P_DE, A), A)
      expect(m.betterServicePerYear).toBe(0)
      expect(m.timeValuePerYear).toBe(0)
      expect(m.totalPerYear).toBe(0)
    }
  })
})
