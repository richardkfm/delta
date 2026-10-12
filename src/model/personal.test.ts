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
/** Verbesserungen bei vollem Benchmark-Niveau (Niederlande), aus der Config abgeleitet. */
const NL_FULL: Improvements = improvements(
  GERMANY,
  scenarioMetrics(GERMANY, BENCHMARKS[0], { transit: 1, rail: 1, bike: 1, car: 1 }),
)
/** Verbesserungen, bei denen jede Dimension ihre Referenzverbesserung genau erreicht. */
const REF_FULL: Improvements = { ...A.carAbolishReferenceImprovement }

/**
 * Handrechenbare Annahmen, unabhängig von der Config: Formeltests mit festen Zahlen
 * verwenden diese, damit Änderungen an den belegten Werten sie nicht brechen.
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
/** Volles Referenzniveau unter H. */
const H_FULL: Improvements = { ...H.carAbolishReferenceImprovement }

const profile = (location: Location = 'kleinstadt', commuteKm = 17, cars: CarCount = 1): Profile => ({
  location,
  commuteKm,
  cars,
})

describe('timeSavings – Pendelzeit (nur ÖPNV-Takt)', () => {
  const imp: Improvements = { ...ZERO, transit: 0.5 }

  it('ist ohne Verbesserung null', () => {
    const t = timeSavings(ZERO, profile(), P_DE, A)
    expect(t.commuteMin).toBe(0)
    expect(t.bufferMin).toBe(0)
    expect(t.everydayMin).toBe(0)
    expect(t.totalMinPerWeek).toBe(0)
    expect(t.totalHoursPerWeek).toBe(0)
  })

  it('Handrechnung Kleinstadt, 17 km: 60 × 0,36 × 0,5 × 1,0 × 5 = 54 Min./Woche', () => {
    const t = timeSavings(imp, profile('kleinstadt', 17), P_H, H)
    expect(t.commuteMin).toBeCloseTo(54, 10)
    expect(t.bufferMin).toBe(0)
    expect(t.everydayMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(54, 10)
    expect(t.totalHoursPerWeek).toBeCloseTo(0.9, 10)
  })

  it('entspricht mit den Config-Annahmen der Formel Pendelzeit × Distanz/Ø-Distanz × Elastizität × Verbesserung × Wohnlage × Arbeitstage', () => {
    for (const loc of LOCATIONS) {
      const km = 2 * A.averageCommuteKm
      const expected =
        A.commuteMinutesPerDay * 2 * A.transitCommuteElasticity * 0.5 * A.locationFactors[loc].transit * A.workDaysPerWeek
      expect(timeSavings(imp, profile(loc, km), P_DE, A).commuteMin).toBeCloseTo(expected, 10)
    }
  })

  it('skaliert linear mit der Pendeldistanz', () => {
    const t17 = timeSavings(imp, profile('kleinstadt', 17), P_DE, A).commuteMin
    expect(timeSavings(imp, profile('kleinstadt', 34), P_DE, A).commuteMin).toBeCloseTo(2 * t17, 10)
    expect(timeSavings(imp, profile('kleinstadt', 8.5), P_DE, A).commuteMin).toBeCloseTo(t17 / 2, 10)
    expect(timeSavings(imp, profile('kleinstadt', 40), P_DE, A).commuteMin).toBeCloseTo((t17 * 40) / 17, 10)
  })

  it('skaliert linear mit der Taktverbesserung', () => {
    const a = timeSavings({ ...ZERO, transit: 0.1 }, profile(), P_DE, A).commuteMin
    const b = timeSavings({ ...ZERO, transit: 0.3 }, profile(), P_DE, A).commuteMin
    expect(b).toBeCloseTo(3 * a, 10)
  })

  it('wendet den Wohnlagefaktor an', () => {
    for (const loc of LOCATIONS) {
      const t = timeSavings(imp, profile(loc, 17), P_H, H)
      expect(t.commuteMin).toBeCloseTo(54 * H.locationFactors[loc].transit, 10)
    }
  })

  it('ist bei 0 km Pendeldistanz null', () => {
    expect(timeSavings(imp, profile('kleinstadt', 0), P_DE, A).commuteMin).toBe(0)
  })

  it('behandelt negative Distanzen wie 0', () => {
    const t = timeSavings({ ...NL_FULL, bike: 0 }, profile('kleinstadt', -10), P_DE, A)
    expect(t.commuteMin).toBe(0)
    expect(t.bufferMin).toBe(0)
  })
})

describe('timeSavings – Pufferzeit (nur Bahn-Pünktlichkeit)', () => {
  it('Handrechnung 17 km, +0,19 Pünktlichkeit: 10 × 0,19/0,38 × 5 = 25 Min./Woche', () => {
    const t = timeSavings({ ...ZERO, rail: 0.19 }, profile('kleinstadt', 17), P_H, H)
    expect(t.bufferMin).toBeCloseTo(25, 10)
    expect(t.commuteMin).toBe(0)
    expect(t.everydayMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(25, 10)
  })

  it('Handrechnung 17 km, +0,28 Pünktlichkeit: 10 × 0,28/0,38 × 5 ≈ 36,84 Min./Woche', () => {
    const t = timeSavings({ ...ZERO, rail: 0.28 }, profile('kleinstadt', 17), P_H, H)
    expect(t.bufferMin).toBeCloseTo((10 * 0.28 * 5) / 0.38, 8)
  })

  it('NL-Niveau mit Config-Annahmen: Puffer × Gewinn/(1 − p_DE) × Arbeitstage, gedeckelt', () => {
    const t = timeSavings({ ...ZERO, rail: NL_FULL.rail }, profile('kleinstadt', A.averageCommuteKm), P_DE, A)
    const perDay = Math.min(A.bufferMinutesPerDay, (A.bufferMinutesPerDay * NL_FULL.rail) / (1 - P_DE))
    expect(t.bufferMin).toBeCloseTo(perDay * A.locationFactors.kleinstadt.rail * A.workDaysPerWeek, 8)
  })

  it('ist auf bufferMinutesPerDay (× Arbeitstage) gedeckelt', () => {
    // 0,38 Gewinn = komplette Unpünktlichkeit beseitigt; mehr darf nicht mehr bringen.
    const full = timeSavings({ ...ZERO, rail: 0.38 }, profile('kleinstadt', 17), P_H, H).bufferMin
    const over = timeSavings({ ...ZERO, rail: 0.9 }, profile('kleinstadt', 17), P_H, H).bufferMin
    expect(full).toBeCloseTo(H.bufferMinutesPerDay * H.workDaysPerWeek, 10)
    expect(over).toBeCloseTo(H.bufferMinutesPerDay * H.workDaysPerWeek, 10)
  })

  it('wird mit min(1, Pendeldistanz / Ø-Distanz) gewichtet', () => {
    const imp: Improvements = { ...ZERO, rail: 0.19 }
    const full = timeSavings(imp, profile('kleinstadt', 17), P_H, H).bufferMin
    expect(timeSavings(imp, profile('kleinstadt', 8.5), P_H, H).bufferMin).toBeCloseTo(full / 2, 10)
    expect(timeSavings(imp, profile('kleinstadt', 34), P_H, H).bufferMin).toBeCloseTo(full, 10)
    expect(timeSavings(imp, profile('kleinstadt', 40), P_H, H).bufferMin).toBeCloseTo(full, 10)
  })

  it('ist bei 0 km Pendeldistanz null', () => {
    expect(timeSavings({ ...ZERO, rail: 0.28 }, profile('kleinstadt', 0), P_DE, A).bufferMin).toBe(0)
  })

  it('wendet den Wohnlagefaktor Bahn an', () => {
    const imp: Improvements = { ...ZERO, rail: 0.19 }
    for (const loc of LOCATIONS) {
      const t = timeSavings(imp, profile(loc, 17), P_H, H)
      expect(t.bufferMin).toBeCloseTo(25 * H.locationFactors[loc].rail, 10)
    }
  })

  it('liefert bei Basispünktlichkeit 1 keine Division durch 0', () => {
    const t = timeSavings({ ...ZERO, rail: 0.1 }, profile(), 1, A)
    expect(t.bufferMin).toBe(0)
    expect(Number.isFinite(t.totalMinPerWeek)).toBe(true)
  })
})

describe('timeSavings – Alltagswege (nur Rad)', () => {
  it('Handrechnung Kleinstadt: 300 × 0,75 × 0,16 × 1,0 = 36 Min./Woche', () => {
    const t = timeSavings({ ...ZERO, bike: 0.16 }, profile('kleinstadt', 17), P_H, H)
    expect(t.everydayMin).toBeCloseTo(36, 10)
    expect(t.commuteMin).toBe(0)
    expect(t.bufferMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(36, 10)
  })

  it('wendet den Wohnlagefaktor Rad an', () => {
    for (const loc of LOCATIONS) {
      const t = timeSavings({ ...ZERO, bike: 0.16 }, profile(loc, 17), P_H, H)
      expect(t.everydayMin).toBeCloseTo(36 * H.locationFactors[loc].bike, 10)
    }
  })

  it('entspricht mit den Config-Annahmen Alltagszeit × Elastizität × Zuwachs Radanteil × Wohnlage', () => {
    for (const loc of LOCATIONS) {
      const t = timeSavings({ ...ZERO, bike: NL_FULL.bike }, profile(loc), P_DE, A)
      const expected =
        A.everydayTripMinutesPerWeek * A.bikeTimeElasticity * NL_FULL.bike * A.locationFactors[loc].bike
      expect(t.everydayMin).toBeCloseTo(expected, 10)
    }
  })

  it('hängt nicht von der Pendeldistanz ab', () => {
    const imp: Improvements = { ...ZERO, bike: 0.16 }
    const a = timeSavings(imp, profile('grossstadt', 0), P_DE, A).everydayMin
    const b = timeSavings(imp, profile('grossstadt', 40), P_DE, A).everydayMin
    expect(a).toBeCloseTo(b, 10)
    expect(a).toBeGreaterThan(0)
  })
})

describe('timeSavings – Summe', () => {
  it('addiert alle Komponenten, Stunden = Minuten / 60', () => {
    const t = timeSavings(NL_FULL, profile('grossstadt', 17), P_DE, A)
    expect(t.totalMinPerWeek).toBeCloseTo(t.commuteMin + t.bufferMin + t.everydayMin, 10)
    expect(t.totalHoursPerWeek).toBeCloseTo(t.totalMinPerWeek / 60, 10)
  })

  it('ist bei 0 km nur noch die Alltagskomponente (Pendeln + Puffer = 0)', () => {
    const t = timeSavings(NL_FULL, profile('kleinstadt', 0), P_DE, A)
    expect(t.commuteMin + t.bufferMin).toBe(0)
    expect(t.totalMinPerWeek).toBeCloseTo(t.everydayMin, 10)
    expect(t.everydayMin).toBeGreaterThan(0)
  })

  it('nutzt die übergebenen Annahmen', () => {
    const a = { ...H, workDaysPerWeek: 4 }
    const t = timeSavings({ ...ZERO, transit: 0.5 }, profile('kleinstadt', 17), P_H, a)
    expect(t.commuteMin).toBeCloseTo(60 * 0.36 * 0.5 * 4, 10)
  })
})

describe('carAbolishProbability', () => {
  it('ist ohne Verbesserungen 0', () => {
    for (const loc of LOCATIONS) expect(carAbolishProbability(ZERO, profile(loc), A)).toBe(0)
  })

  it('entspricht beim vollen Referenzniveau der Obergrenze der Wohnlage', () => {
    for (const loc of LOCATIONS) {
      expect(carAbolishProbability(REF_FULL, profile(loc), A)).toBeCloseTo(
        A.locationFactors[loc].maxCarAbolishProbability,
        10,
      )
    }
  })

  it('überschreitet bei vollem NL-Niveau die Obergrenze der Wohnlage nie und liegt knapp darunter oder darauf', () => {
    for (const loc of LOCATIONS) {
      const cap = A.locationFactors[loc].maxCarAbolishProbability
      const p = carAbolishProbability(NL_FULL, profile(loc), A)
      expect(p).toBeLessThanOrEqual(cap + 1e-12)
      expect(p).toBeGreaterThan(0.9 * cap)
    }
  })

  it('ist in jeder einzelnen Verbesserung monoton steigend', () => {
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

  it('Handrechnung: nur Takt halbiert (volle Referenz) → Gewicht 0,35 × Obergrenze', () => {
    const imp: Improvements = { ...ZERO, transit: 0.5 }
    expect(carAbolishProbability(imp, profile('grossstadt'), H)).toBeCloseTo(0.35 * 0.7, 10)
    expect(carAbolishProbability(imp, profile('kleinstadt'), H)).toBeCloseTo(0.35 * 0.45, 10)
    expect(carAbolishProbability(imp, profile('land'), H)).toBeCloseTo(0.35 * 0.25, 10)
  })

  it('entspricht mit den Config-Annahmen bei voller Referenz nur beim Takt: Gewicht Takt × Obergrenze', () => {
    const imp: Improvements = { ...ZERO, transit: A.carAbolishReferenceImprovement.transit }
    for (const loc of LOCATIONS) {
      expect(carAbolishProbability(imp, profile(loc), A)).toBeCloseTo(
        A.carAbolishWeights.transit * A.locationFactors[loc].maxCarAbolishProbability,
        10,
      )
    }
  })

  it('begrenzt jeden Beitrag auf seine Referenzverbesserung', () => {
    const over: Improvements = { transit: 0.99, rail: 0.99, bike: 0.99, car: 0.99 }
    for (const loc of LOCATIONS) {
      expect(carAbolishProbability(over, profile(loc), A)).toBeCloseTo(A.locationFactors[loc].maxCarAbolishProbability, 10)
    }
  })

  it('ordnet Großstadt > Kleinstadt > Land', () => {
    for (const imp of [NL_FULL, { ...ZERO, transit: 0.2, bike: 0.05 }]) {
      const g = carAbolishProbability(imp, profile('grossstadt'), A)
      const k = carAbolishProbability(imp, profile('kleinstadt'), A)
      const l = carAbolishProbability(imp, profile('land'), A)
      expect(g).toBeGreaterThan(k)
      expect(k).toBeGreaterThan(l)
      expect(l).toBeGreaterThan(0)
    }
  })

  it('liegt immer in [0, 1]', () => {
    for (const loc of LOCATIONS) {
      const p = carAbolishProbability({ transit: 5, rail: 5, bike: 5, car: 5 }, profile(loc), A)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })
})

describe('moneySavings – ein Auto', () => {
  const saving = (A.carFullCostPerMonth - A.transitTicketPerMonth) * 12

  it('total = Wahrscheinlichkeit × (Auto-Vollkosten − Ticket) × 12', () => {
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

  it('Großstadt bei vollem Referenzniveau (Handrechnung): 0,7 × 5880 = 4116 €', () => {
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(H_FULL, pr, timeSavings(H_FULL, pr, P_H, H), H)
    expect(m.savingsIfCarAbolished).toBe(5880)
    expect(m.totalPerYear).toBeCloseTo(4116, 8)
  })

  it('ist ohne Verbesserungen 0', () => {
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(ZERO, pr, timeSavings(ZERO, pr, P_DE, A), A)
    expect(m.totalPerYear).toBe(0)
    expect(m.carAbolishProbability).toBe(0)
  })

  it('wird bei kleiner maxProbability gedeckelt', () => {
    // Obergrenze unter der Wohnlage-Obergrenze, damit sie greift.
    const cap = A.locationFactors.grossstadt.maxCarAbolishProbability / 2
    const a = { ...A, maxProbability: cap }
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(REF_FULL, pr, timeSavings(REF_FULL, pr, P_DE, a), a)
    expect(m.carAbolishProbability).toBeCloseTo(cap, 10)
    expect(m.totalPerYear).toBeCloseTo(cap * saving, 8)
  })

  it('verwendet die übergebenen Kosten', () => {
    const a = { ...A, carFullCostPerMonth: 400, transitTicketPerMonth: 100 }
    const pr = profile('grossstadt', 17, 1)
    const m = moneySavings(NL_FULL, pr, timeSavings(NL_FULL, pr, P_DE, a), a)
    expect(m.savingsIfCarAbolished).toBe(3600)
  })
})

describe('moneySavings – zwei oder mehr Autos', () => {
  const saving = (A.carFullCostPerMonth - A.transitTicketPerMonth) * 12

  it('Wahrscheinlichkeit × Zweitwagen-Faktor, gedeckelt bei maxProbability', () => {
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

  it('Kleinstadt (ungedeckelt): 0,45 × 1,4 = 0,63', () => {
    const pr = profile('kleinstadt', 17, 2)
    const m = moneySavings(H_FULL, pr, timeSavings(H_FULL, pr, P_H, H), H)
    expect(m.carAbolishProbability).toBeCloseTo(0.63, 10)
  })

  it('Großstadt: 0,7 × 1,4 = 0,98 wird auf 0,95 gedeckelt', () => {
    const pr = profile('grossstadt', 17, 2)
    const m = moneySavings(H_FULL, pr, timeSavings(H_FULL, pr, P_H, H), H)
    expect(m.carAbolishProbability).toBeCloseTo(0.95, 10)
    expect(m.totalPerYear).toBeCloseTo(0.95 * 5880, 8)
  })

  it('ist ohne Verbesserungen 0', () => {
    const pr = profile('grossstadt', 17, 2)
    expect(moneySavings(ZERO, pr, timeSavings(ZERO, pr, P_DE, A), A).totalPerYear).toBe(0)
  })
})

describe('moneySavings – Haushalte ohne Auto', () => {
  it('hat keinen Autoeffekt', () => {
    const pr = profile('grossstadt', 17, 0)
    const m = moneySavings(NL_FULL, pr, timeSavings(NL_FULL, pr, P_DE, A), A)
    expect(m.carAbolishProbability).toBe(0)
    expect(m.savingsIfCarAbolished).toBe(0)
  })

  it('total = besseres Angebot + Zeitwert', () => {
    for (const loc of LOCATIONS) {
      const pr = profile(loc, 17, 0)
      const t = timeSavings(NL_FULL, pr, P_DE, A)
      const m = moneySavings(NL_FULL, pr, t, A)
      expect(m.totalPerYear).toBeCloseTo(m.betterServicePerYear + m.timeValuePerYear, 10)
      expect(m.timeValuePerYear).toBeCloseTo(t.totalHoursPerWeek * A.workWeeksPerYear * A.valueOfTimePerHour, 8)
    }
  })

  it('besseres Angebot bei vollem Referenzangebot: Ersatzkosten × max. Reduktion × 1', () => {
    const pr = profile('kleinstadt', 17, 0)
    const m = moneySavings(REF_FULL, pr, timeSavings(REF_FULL, pr, P_DE, A), A)
    expect(m.betterServicePerYear).toBeCloseTo(A.noCarSubstituteCostPerYear * A.noCarSubstituteReductionMax, 10)
  })

  it('Angebotsindex ignoriert den Autoanteil', () => {
    const pr = profile('kleinstadt', 17, 0)
    const imp: Improvements = { ...ZERO, car: 0.3 }
    const m = moneySavings(imp, pr, timeSavings(imp, pr, P_DE, A), A)
    expect(m.betterServicePerYear).toBe(0)
    expect(m.totalPerYear).toBe(0)
  })

  it('Handrechnung nur Takt: Index 0,35 / 0,75 → 600 × 0,5 × 0,4667 = 140 €', () => {
    const pr = profile('kleinstadt', 17, 0)
    const imp: Improvements = { ...ZERO, transit: 0.5 }
    const t = timeSavings(imp, pr, P_H, H)
    const m = moneySavings(imp, pr, t, H)
    expect(m.betterServicePerYear).toBeCloseTo(300 * (0.35 / 0.75), 10)
    expect(m.timeValuePerYear).toBeCloseTo(0.9 * 46 * 8, 8)
  })

  it('Angebotsindex nur Takt = Gewicht Takt / Summe der Angebotsgewichte (Config-Annahmen)', () => {
    const w = A.carAbolishWeights
    const pr = profile('kleinstadt', 17, 0)
    const imp: Improvements = { ...ZERO, transit: A.carAbolishReferenceImprovement.transit }
    const m = moneySavings(imp, pr, timeSavings(imp, pr, P_DE, A), A)
    const index = w.transit / (w.transit + w.rail + w.bike)
    expect(m.betterServicePerYear).toBeCloseTo(A.noCarSubstituteCostPerYear * A.noCarSubstituteReductionMax * index, 10)
  })

  it('ist ohne Verbesserungen 0 (Angebot und Zeitwert)', () => {
    for (const loc of LOCATIONS) {
      const pr = profile(loc, 17, 0)
      const m = moneySavings(ZERO, pr, timeSavings(ZERO, pr, P_DE, A), A)
      expect(m.betterServicePerYear).toBe(0)
      expect(m.timeValuePerYear).toBe(0)
      expect(m.totalPerYear).toBe(0)
    }
  })
})
