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
  it('ist bei Reglern = 0 überall null', () => {
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

  it('liefert bei Reglern = 1 (NL) die Handrechnung', () => {
    const i = inv(all(1))
    expect(i.bikeLaneKm).toBeCloseTo((2.0 - 0.9) * 84_000, 6)
    expect(i.transitLaneKm).toBeCloseTo(5 * 840, 6)
    expect(i.railUpgradeKm).toBeCloseTo(28 * 320, 6)
    expect(i.bikeEur).toBeCloseTo(i.bikeLaneKm * 500_000, 0)
    expect(i.transitEur).toBeCloseTo(i.transitLaneKm * 7_500_000, 0)
    expect(i.railEur).toBeCloseTo(i.railUpgradeKm * 8_000_000, 0)
    expect(i.totalEur).toBeCloseTo(i.bikeEur + i.transitEur + i.railEur, 0)
    expect(i.bikeEur).toBeCloseTo(46.2e9, -3)
    expect(i.transitEur).toBeCloseTo(31.5e9, -3)
    expect(i.railEur).toBeCloseTo(71.68e9, -3)
    expect(i.totalEur).toBeCloseTo(149.38e9, -3)
  })

  it('Betriebsmehrkosten bei NL: (20/10 − 1) × 14 Mrd. × 0,25 = 3,5 Mrd. €/Jahr', () => {
    expect(inv(all(1)).extraOperatingEurPerYear).toBeCloseTo((20 / 10 - 1) * 14e9 * 0.25, 0)
    expect(inv(all(1)).extraOperatingEurPerYear).toBeCloseTo(3.5e9, -3)
  })

  it('Regler Autoabhängigkeit verursacht keine Infrastrukturkosten', () => {
    const i = inv({ transit: 0, rail: 0, bike: 0, car: 1 })
    expect(i.totalEur).toBe(0)
    expect(i.extraOperatingEurPerYear).toBe(0)
  })

  it('ordnet jeden Regler dem richtigen Posten zu', () => {
    const bike = inv({ transit: 0, rail: 0, bike: 1, car: 0 })
    expect(bike.bikeEur).toBeGreaterThan(0)
    expect(bike.transitEur).toBe(0)
    expect(bike.railEur).toBe(0)
    const rail = inv({ transit: 0, rail: 1, bike: 0, car: 0 })
    expect(rail.railEur).toBeGreaterThan(0)
    expect(rail.bikeEur).toBe(0)
    expect(rail.transitEur).toBe(0)
    const transit = inv({ transit: 1, rail: 0, bike: 0, car: 0 })
    expect(transit.transitEur).toBeGreaterThan(0)
    expect(transit.extraOperatingEurPerYear).toBeGreaterThan(0)
    expect(transit.bikeEur).toBe(0)
    expect(transit.railEur).toBe(0)
  })

  it('skaliert die Ausbau-km linear mit dem Regler', () => {
    const half = inv(all(0.5))
    const full = inv(all(1))
    expect(half.bikeLaneKm).toBeCloseTo(full.bikeLaneKm / 2, 6)
    expect(half.transitLaneKm).toBeCloseTo(full.transitLaneKm / 2, 6)
    expect(half.railUpgradeKm).toBeCloseTo(full.railUpgradeKm / 2, 6)
  })

  it('nutzt Kosten und Einwohnerzahl aus den Annahmen', () => {
    const a = { ...A, population: 42_000_000, bikeLaneCostPerKm: 1_000_000 }
    const i = inv(all(1), NL, a)
    expect(i.bikeLaneKm).toBeCloseTo(1.1 * 42_000, 6)
    expect(i.bikeEur).toBeCloseTo(i.bikeLaneKm * 1_000_000, 0)
  })

  it('verursacht keine negativen Werte bei einem in allen Dimensionen schlechteren Benchmark', () => {
    const worse: CountryData = {
      ...NL,
      id: 'bad',
      transitHeadwayMin: 40,
      transitLaneKmPer100k: 3,
      railPunctuality: 0.4,
      bikeLaneKmPer1000: 0.2,
    }
    const i = inv(all(1), worse)
    for (const v of Object.values(i)) expect(v).toBe(0)
  })

  it('verhindert Division durch 0 bei Takt 0 im Szenario', () => {
    const i = inv(all(1), { ...NL, transitHeadwayMin: 0 })
    expect(Number.isFinite(i.extraOperatingEurPerYear)).toBe(true)
    expect(i.extraOperatingEurPerYear).toBe(0)
  })
})

describe('externalCostSavings', () => {
  const imp = (car: number): Improvements => ({ transit: 0, rail: 0, bike: 0, car })

  it('ist bei Autoverbesserung 0 überall null', () => {
    const res = externalCostSavings(imp(0), A)
    expect(res).toHaveLength(A.externalCosts.length)
    for (const r of res) expect(r.eurPerYear).toBe(0)
  })

  it('liefert je Posten Folgekosten × Elastizität × Rückgang, mit Label', () => {
    const res = externalCostSavings(imp(0.1), A)
    A.externalCosts.forEach((c, i) => {
      expect(res[i].label).toBe(c.label)
      expect(res[i].eurPerYear).toBeCloseTo(c.annualEur * c.elasticity * 0.1, 0)
    })
    // 0,8 + 3 + 4 Mrd. €
    expect(res.reduce((s, r) => s + r.eurPerYear, 0)).toBeCloseTo(7.8e9, -3)
  })

  it('ist proportional zur Autoverbesserung', () => {
    const a = externalCostSavings(imp(0.05), A)
    const b = externalCostSavings(imp(0.15), A)
    a.forEach((r, i) => expect(b[i].eurPerYear).toBeCloseTo(3 * r.eurPerYear, 0))
  })

  it('ist proportional zur Elastizität', () => {
    const base = externalCostSavings(imp(0.1), A)
    const a = { ...A, externalCosts: A.externalCosts.map((c) => ({ ...c, elasticity: c.elasticity / 2 })) }
    const half = externalCostSavings(imp(0.1), a)
    half.forEach((r, i) => expect(r.eurPerYear).toBeCloseTo(base[i].eurPerYear / 2, 0))
  })

  it('hängt nicht von den anderen Verbesserungen ab', () => {
    const res = externalCostSavings({ transit: 0.5, rail: 0.28, bike: 0.16, car: 0 }, A)
    for (const r of res) expect(r.eurPerYear).toBe(0)
  })
})

describe('costBenefit', () => {
  it('liefert eine Zeitreihe der Länge horizonYears (Jahre 1…n)', () => {
    const cb = costBenefit(149e9, 3.5e9, 13e9, A)
    expect(cb.timeline).toHaveLength(A.horizonYears)
    expect(cb.timeline.map((p) => p.year)).toEqual(Array.from({ length: A.horizonYears }, (_, i) => i + 1))
    const short = costBenefit(100, 0, 0, { ...A, horizonYears: 7 })
    expect(short.timeline).toHaveLength(7)
  })

  it('hat monoton nicht fallende kumulierte Kosten und Nutzen', () => {
    const cb = costBenefit(149e9, 3.5e9, 13e9, A)
    for (let i = 1; i < cb.timeline.length; i++) {
      expect(cb.timeline[i].cumulativeCost).toBeGreaterThanOrEqual(cb.timeline[i - 1].cumulativeCost)
      expect(cb.timeline[i].cumulativeBenefit).toBeGreaterThanOrEqual(cb.timeline[i - 1].cumulativeBenefit)
    }
  })

  it('gibt die Investition nach buildYears vollständig aus', () => {
    // Ohne Betriebskosten sind die kumulierten Kosten genau die Investition.
    const cb = costBenefit(1000, 0, 0, A)
    expect(cb.timeline[A.buildYears - 2].cumulativeCost).toBeCloseTo(1000 * (A.buildYears - 1) / A.buildYears, 8)
    expect(cb.timeline[A.buildYears - 1].cumulativeCost).toBeCloseTo(1000, 8)
    for (let y = A.buildYears; y <= A.horizonYears; y++) {
      expect(cb.timeline[y - 1].cumulativeCost).toBeCloseTo(1000, 8)
    }
  })

  it('hat nach der Bauzeit nur noch lineare Betriebskosten und Nutzen', () => {
    const cb = costBenefit(1000, 10, 40, A)
    const t = cb.timeline
    const last = t[t.length - 1]
    const prev = t[t.length - 2]
    expect(last.cumulativeCost - prev.cumulativeCost).toBeCloseTo(10, 8)
    expect(last.cumulativeBenefit - prev.cumulativeBenefit).toBeCloseTo(40, 8)
  })

  it('hat keinen Break-even ohne Kosten und ohne Nutzen', () => {
    const cb = costBenefit(0, 0, 0, A)
    expect(cb.breakEvenYear).toBeNull()
    for (const p of cb.timeline) {
      expect(p.cumulativeCost).toBe(0)
      expect(p.cumulativeBenefit).toBe(0)
    }
  })

  it('hat Break-even in Jahr 1, wenn es Nutzen aber keine Kosten gibt', () => {
    expect(costBenefit(0, 0, 100, A).breakEvenYear).toBe(1)
  })

  it('hat keinen Break-even, wenn der Nutzen winzig ist', () => {
    expect(costBenefit(149e9, 3.5e9, 1, A).breakEvenYear).toBeNull()
    expect(costBenefit(1e9, 0, 1, A).breakEvenYear).toBeNull()
  })

  it('findet das erste Kreuzungsjahr (Handrechnung)', () => {
    // buildYears 2, Horizont 5; Investition 100, Betrieb 10/Jahr, Nutzen 40/Jahr.
    // J1: Fortschritt 0,5 → Kosten 50 + 5 = 55, Nutzen 20
    // J2: Fortschritt 1   → Kosten 55 + 50 + 10 = 115, Nutzen 60
    // J3: Kosten 125, Nutzen 100
    // J4: Kosten 135, Nutzen 140 → Break-even
    // J5: Kosten 145, Nutzen 180
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

  it('meldet Break-even nicht, wenn er hinter dem Horizont liegt', () => {
    const a = { ...A, buildYears: 2, horizonYears: 3 }
    expect(costBenefit(100, 10, 40, a).breakEvenYear).toBeNull()
  })

  it('zählt Gleichstand als Break-even (Nutzen >= Kosten)', () => {
    // Jahr 1: Kosten 10, Nutzen 10
    const a = { ...A, buildYears: 1, horizonYears: 3 }
    expect(costBenefit(10, 0, 10, a).breakEvenYear).toBe(1)
  })

  it('behandelt buildYears < 1 wie 1', () => {
    const a = { ...A, buildYears: 0, horizonYears: 3 }
    const cb = costBenefit(100, 0, 0, a)
    expect(cb.timeline[0].cumulativeCost).toBeCloseTo(100, 8)
    expect(cb.timeline[2].cumulativeCost).toBeCloseTo(100, 8)
  })
})
