import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS } from '../config/assumptions'
import { BENCHMARKS, GERMANY, type CountryData } from '../config/countries'
import { improvements, scenarioMetrics } from './interpolate'
import { costBenefit, externalCostSavings, investment } from './state'
import type { Improvements, Sliders } from './types'

const A = ASSUMPTIONS
const NL = BENCHMARKS[0]
const all = (v: number): Sliders => ({ transit: v, rail: v, bike: v, car: v })

function inv(s: Sliders, bench: CountryData = NL, a = A) {
  const m = scenarioMetrics(GERMANY, bench, s)
  return investment(GERMANY, m, improvements(GERMANY, m), a)
}

describe('investment', () => {
  it('is zero everywhere at sliders = 0', () => {
    const i = inv(all(0))
    expect(i).toEqual({
      bikeLaneKm: 0,
      transitLaneKm: 0,
      railUpgradeKm: 0,
      bikeEur: 0,
      transitEur: 0,
      railEur: 0,
      totalEur: 0,
      extraOperatingEurPerYear: 0,
    })
  })

  it('returns the hand calculation from the config values at sliders = 1 (NL)', () => {
    const i = inv(all(1))
    const bikeKm = (NL.bikeLaneKmPer1000 - GERMANY.bikeLaneKmPer1000) * A.population / 1_000
    const railKm = (NL.railPunctuality - GERMANY.railPunctuality) * 100 * A.railUpgradeKmPerPoint
    expect(bikeKm).toBeGreaterThan(0)
    expect(railKm).toBeGreaterThan(0)
    expect(i.bikeLaneKm).toBeCloseTo(bikeKm, 6)
    expect(i.railUpgradeKm).toBeCloseTo(railKm, 6)
    expect(i.bikeEur).toBeCloseTo(bikeKm * A.bikeLaneCostPerKm, 0)
    expect(i.railEur).toBeCloseTo(railKm * A.railUpgradeCostPerKm, 0)
    // With the NL benchmark there is less tram per resident than in DE → no investment need.
    expect(i.transitLaneKm).toBe(0)
    expect(i.transitEur).toBe(0)
    expect(i.totalEur).toBeCloseTo(i.bikeEur + i.railEur, 0)
  })

  it('hand calculation of transit lines with custom benchmark: (gap per 100,000 residents) × residents × cost/km', () => {
    const rich: CountryData = { ...NL, transitLaneKmPer100k: GERMANY.transitLaneKmPer100k + 5 }
    const i = inv(all(1), rich)
    const km = 5 * (A.population / 100_000)
    expect(i.transitLaneKm).toBeCloseTo(km, 6)
    expect(i.transitEur).toBeCloseTo(km * A.transitLaneCostPerKm, 0)
    expect(i.totalEur).toBeCloseTo(i.bikeEur + i.transitEur + i.railEur, 0)
  })

  it('hand calculation with custom assumptions: 10 million residents, gap 1 km per 1,000 residents, 1 million €/km → 10,000 km, 10 billion €', () => {
    const a = { ...A, population: 10_000_000, bikeLaneCostPerKm: 1_000_000 }
    const bench: CountryData = { ...NL, bikeLaneKmPer1000: GERMANY.bikeLaneKmPer1000 + 1 }
    const i = inv({ transit: 0, rail: 0, bike: 1, car: 0 }, bench, a)
    expect(i.bikeLaneKm).toBeCloseTo(10_000, 6)
    expect(i.bikeEur).toBeCloseTo(10e9, 0)
  })

  it('extra operating costs for NL: (speed NL / speed DE − 1) × operating costs × uncovered share', () => {
    const expected =
      (NL.transitDoorToDoorKmh / GERMANY.transitDoorToDoorKmh - 1) *
      A.transitOperatingCostPerYear *
      A.transitExtraOperatingNetShare
    expect(expected).toBeGreaterThan(0)
    expect(inv(all(1)).extraOperatingEurPerYear).toBeCloseTo(expected, 0)
  })

  it('extra operating costs hand calculation: speed 15 → 30 km/h, 10 billion €, share 0.5 → 5 billion €/year', () => {
    const base: CountryData = { ...GERMANY, transitDoorToDoorKmh: 15 }
    const bench: CountryData = { ...NL, transitDoorToDoorKmh: 30 }
    const a = { ...A, transitOperatingCostPerYear: 10e9, transitExtraOperatingNetShare: 0.5 }
    const m = scenarioMetrics(base, bench, all(1))
    expect(investment(base, m, improvements(base, m), a).extraOperatingEurPerYear).toBeCloseTo(5e9, 0)
    const half = scenarioMetrics(base, bench, all(0.5))
    expect(investment(base, half, improvements(base, half), a).extraOperatingEurPerYear).toBeCloseTo(2.5e9, 0)
  })

  it('extra operating costs are 0 when the benchmark speed is lower than in Germany', () => {
    const slow: CountryData = { ...NL, transitDoorToDoorKmh: GERMANY.transitDoorToDoorKmh - 5 }
    expect(inv(all(1), slow).extraOperatingEurPerYear).toBe(0)
  })

  it('extra operating costs do not depend on frequency, only on door-to-door speed', () => {
    const noHeadway = inv(all(1), { ...NL, transitHeadwayMin: 0 }).extraOperatingEurPerYear
    expect(noHeadway).toBeCloseTo(inv(all(1)).extraOperatingEurPerYear, 0)
  })

  it('with NL, transit line km and costs are 0 (benchmark has less tram per resident, lower bound 0)', () => {
    expect(NL.transitLaneKmPer100k).toBeLessThan(GERMANY.transitLaneKmPer100k)
    const i = inv({ transit: 1, rail: 0, bike: 0, car: 0 })
    expect(i.transitLaneKm).toBe(0)
    expect(i.transitEur).toBe(0)
  })

  it('car dependence slider incurs no infrastructure costs', () => {
    const i = inv({ transit: 0, rail: 0, bike: 0, car: 1 })
    expect(i.totalEur).toBe(0)
    expect(i.extraOperatingEurPerYear).toBe(0)
  })

  it('maps each slider to the correct item', () => {
    const bike = inv({ transit: 0, rail: 0, bike: 1, car: 0 })
    expect(bike.bikeEur).toBeGreaterThan(0)
    expect(bike.transitEur).toBe(0)
    expect(bike.railEur).toBe(0)
    const rail = inv({ transit: 0, rail: 1, bike: 0, car: 0 })
    expect(rail.railEur).toBeGreaterThan(0)
    expect(rail.bikeEur).toBe(0)
    expect(rail.transitEur).toBe(0)
    // NL has less tram per resident than DE; so use a benchmark with a denser network for line costs.
    const rich: CountryData = { ...NL, transitLaneKmPer100k: GERMANY.transitLaneKmPer100k + 5 }
    const transit = inv({ transit: 1, rail: 0, bike: 0, car: 0 }, rich)
    expect(transit.transitEur).toBeGreaterThan(0)
    expect(transit.extraOperatingEurPerYear).toBeGreaterThan(0)
    expect(transit.bikeEur).toBe(0)
    expect(transit.railEur).toBe(0)
  })

  it('scales the build-out km linearly with the slider', () => {
    const half = inv(all(0.5))
    const full = inv(all(1))
    expect(half.bikeLaneKm).toBeCloseTo(full.bikeLaneKm / 2, 6)
    expect(half.transitLaneKm).toBeCloseTo(full.transitLaneKm / 2, 6)
    expect(half.railUpgradeKm).toBeCloseTo(full.railUpgradeKm / 2, 6)
  })

  it('uses costs and population from the assumptions', () => {
    const a = { ...A, population: 42_000_000, bikeLaneCostPerKm: 1_000_000 }
    const i = inv(all(1), NL, a)
    expect(i.bikeLaneKm).toBeCloseTo((NL.bikeLaneKmPer1000 - GERMANY.bikeLaneKmPer1000) * 42_000, 6)
    expect(i.bikeEur).toBeCloseTo(i.bikeLaneKm * 1_000_000, 0)
  })

  it('produces no negative values for a benchmark that is worse in all dimensions', () => {
    const worse: CountryData = {
      ...NL,
      id: 'bad',
      transitHeadwayMin: 40,
      transitLaneKmPer100k: 3,
      transitDoorToDoorKmh: 10,
      railPunctuality: 0.4,
      bikeLaneKmPer1000: 0.2,
    }
    const i = inv(all(1), worse)
    for (const v of Object.values(i)) expect(v).toBe(0)
  })

  it('prevents division by 0 at speed 0 in Germany', () => {
    const base: CountryData = { ...GERMANY, transitDoorToDoorKmh: 0 }
    const m = scenarioMetrics(base, NL, all(1))
    const i = investment(base, m, improvements(base, m), A)
    expect(Number.isFinite(i.extraOperatingEurPerYear)).toBe(true)
    expect(i.extraOperatingEurPerYear).toBe(0)
  })
})

describe('externalCostSavings', () => {
  const imp = (car: number): Improvements => ({ transit: 0, rail: 0, bike: 0, car })

  it('is zero everywhere at car improvement 0', () => {
    const res = externalCostSavings(imp(0), A)
    expect(res).toHaveLength(A.externalCosts.length)
    for (const r of res) expect(r.eurPerYear).toBe(0)
  })

  it('returns external costs × elasticity × decline per item, with label', () => {
    const res = externalCostSavings(imp(0.1), A)
    A.externalCosts.forEach((c, i) => {
      expect(res[i].label).toBe(c.label)
      expect(res[i].eurPerYear).toBeCloseTo(c.annualEur * c.elasticity * 0.1, 0)
    })
    const total = A.externalCosts.reduce((s, c) => s + c.annualEur * c.elasticity, 0) * 0.1
    expect(res.reduce((s, r) => s + r.eurPerYear, 0)).toBeCloseTo(total, -3)
  })

  it('hand calculation with custom items: 10 billion × 0.5 × 0.1 + 4 billion × 1 × 0.1 = 0.9 billion €', () => {
    const a = {
      ...A,
      externalCosts: [
        { label: 'A', annualEur: 10e9, elasticity: 0.5 },
        { label: 'B', annualEur: 4e9, elasticity: 1 },
      ],
    }
    const res = externalCostSavings(imp(0.1), a)
    expect(res.map((r) => r.label)).toEqual(['A', 'B'])
    expect(res[0].eurPerYear).toBeCloseTo(0.5e9, 0)
    expect(res[1].eurPerYear).toBeCloseTo(0.4e9, 0)
  })

  it('is proportional to the car improvement', () => {
    const a = externalCostSavings(imp(0.05), A)
    const b = externalCostSavings(imp(0.15), A)
    a.forEach((r, i) => expect(b[i].eurPerYear).toBeCloseTo(3 * r.eurPerYear, 0))
  })

  it('is proportional to the elasticity', () => {
    const base = externalCostSavings(imp(0.1), A)
    const a = { ...A, externalCosts: A.externalCosts.map((c) => ({ ...c, elasticity: c.elasticity / 2 })) }
    const half = externalCostSavings(imp(0.1), a)
    half.forEach((r, i) => expect(r.eurPerYear).toBeCloseTo(base[i].eurPerYear / 2, 0))
  })

  it('does not depend on the other improvements', () => {
    const res = externalCostSavings({ transit: 0.5, rail: 0.28, bike: 0.16, car: 0 }, A)
    for (const r of res) expect(r.eurPerYear).toBe(0)
  })
})

describe('costBenefit', () => {
  it('returns a time series of length horizonYears (years 1…n)', () => {
    const cb = costBenefit(149e9, 3.5e9, 13e9, A)
    expect(cb.timeline).toHaveLength(A.horizonYears)
    expect(cb.timeline.map((p) => p.year)).toEqual(Array.from({ length: A.horizonYears }, (_, i) => i + 1))
    const short = costBenefit(100, 0, 0, { ...A, horizonYears: 7 })
    expect(short.timeline).toHaveLength(7)
  })

  it('has monotonically non-decreasing cumulative costs and benefits', () => {
    const cb = costBenefit(149e9, 3.5e9, 13e9, A)
    for (let i = 1; i < cb.timeline.length; i++) {
      expect(cb.timeline[i].cumulativeCost).toBeGreaterThanOrEqual(cb.timeline[i - 1].cumulativeCost)
      expect(cb.timeline[i].cumulativeBenefit).toBeGreaterThanOrEqual(cb.timeline[i - 1].cumulativeBenefit)
    }
  })

  it('spends the investment in full after buildYears', () => {
    // Without operating costs, the cumulative costs are exactly the investment.
    const cb = costBenefit(1000, 0, 0, A)
    expect(cb.timeline[A.buildYears - 2].cumulativeCost).toBeCloseTo(1000 * (A.buildYears - 1) / A.buildYears, 8)
    expect(cb.timeline[A.buildYears - 1].cumulativeCost).toBeCloseTo(1000, 8)
    for (let y = A.buildYears; y <= A.horizonYears; y++) {
      expect(cb.timeline[y - 1].cumulativeCost).toBeCloseTo(1000, 8)
    }
  })

  it('has only linear operating costs and benefits after the build period', () => {
    const cb = costBenefit(1000, 10, 40, A)
    const t = cb.timeline
    const last = t[t.length - 1]
    const prev = t[t.length - 2]
    expect(last.cumulativeCost - prev.cumulativeCost).toBeCloseTo(10, 8)
    expect(last.cumulativeBenefit - prev.cumulativeBenefit).toBeCloseTo(40, 8)
  })

  it('has no break-even without costs and without benefits', () => {
    const cb = costBenefit(0, 0, 0, A)
    expect(cb.breakEvenYear).toBeNull()
    for (const p of cb.timeline) {
      expect(p.cumulativeCost).toBe(0)
      expect(p.cumulativeBenefit).toBe(0)
    }
  })

  it('has break-even in year 1 when there is a benefit but no costs', () => {
    expect(costBenefit(0, 0, 100, A).breakEvenYear).toBe(1)
  })

  it('has no break-even when the benefit is tiny', () => {
    expect(costBenefit(149e9, 3.5e9, 1, A).breakEvenYear).toBeNull()
    expect(costBenefit(1e9, 0, 1, A).breakEvenYear).toBeNull()
  })

  it('finds the first crossover year (hand calculation)', () => {
    // buildYears 2, horizon 5; investment 100, operation 10/year, benefit 40/year.
    // Y1: progress 0.5 → costs 50 + 5 = 55, benefit 20
    // Y2: progress 1   → costs 55 + 50 + 10 = 115, benefit 60
    // Y3: costs 125, benefit 100
    // Y4: costs 135, benefit 140 → break-even
    // Y5: costs 145, benefit 180
    const a = { ...A, buildYears: 2, horizonYears: 5 }
    const cb = costBenefit(100, 10, 40, a)
    const expected = [
      [55, 20],
      [115, 60],
      [125, 100],
      [135, 140],
      [145, 180],
    ]
    expect(cb.timeline).toHaveLength(5)
    expected.forEach(([c, b], i) => {
      expect(cb.timeline[i].cumulativeCost).toBeCloseTo(c, 8)
      expect(cb.timeline[i].cumulativeBenefit).toBeCloseTo(b, 8)
    })
    expect(cb.breakEvenYear).toBe(4)
  })

  it('does not report break-even when it lies beyond the horizon', () => {
    const a = { ...A, buildYears: 2, horizonYears: 3 }
    expect(costBenefit(100, 10, 40, a).breakEvenYear).toBeNull()
  })

  it('counts a tie as break-even (benefit >= costs)', () => {
    // Year 1: costs 10, benefit 10
    const a = { ...A, buildYears: 1, horizonYears: 3 }
    expect(costBenefit(10, 0, 10, a).breakEvenYear).toBe(1)
  })

  it('treats buildYears < 1 as 1', () => {
    const a = { ...A, buildYears: 0, horizonYears: 3 }
    const cb = costBenefit(100, 0, 0, a)
    expect(cb.timeline[0].cumulativeCost).toBeCloseTo(100, 8)
    expect(cb.timeline[2].cumulativeCost).toBeCloseTo(100, 8)
  })
})
