import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS } from '../config/assumptions'
import { co2SavingsKgPerPersonYear } from './co2'
import type { Improvements } from './types'

const imp = (car: number): Improvements => ({ transit: 0, rail: 0, bike: 0, car })

describe('co2SavingsKgPerPersonYear', () => {
  it('is exactly 0 at improvement 0', () => {
    expect(co2SavingsKgPerPersonYear(imp(0), ASSUMPTIONS)).toBe(0)
  })

  it('matches the formula from the assumptions at car improvement 0.1', () => {
    const A = ASSUMPTIONS
    const avoidedKm = A.carKmPerPersonYear * 0.1
    const expected =
      avoidedKm * A.carCo2KgPerKm - avoidedKm * A.carOccupancy * A.transitReplacementShare * A.transitCo2KgPerKm
    expect(co2SavingsKgPerPersonYear(imp(0.1), A)).toBeCloseTo(expected, 8)
    expect(expected).toBeGreaterThan(0)
  })

  it('hand calculation: 100 km × 0.2 kg − 100 km × 1.5 persons × 0.5 × 0.04 kg = 17 kg', () => {
    const a = {
      ...ASSUMPTIONS,
      carKmPerPersonYear: 1000,
      carCo2KgPerKm: 0.2,
      carOccupancy: 1.5,
      transitReplacementShare: 0.5,
      transitCo2KgPerKm: 0.04,
    }
    // avoided car km = 1000 × 0.1 = 100
    // car emissions: 100 × 0.2 = 20 kg
    // transit emissions: 100 × 1.5 × 0.5 × 0.04 = 3 kg
    expect(co2SavingsKgPerPersonYear(imp(0.1), a)).toBeCloseTo(17, 8)
  })

  it('accounts for car occupancy: higher occupancy → more shifted passenger km → less savings', () => {
    const lo = { ...ASSUMPTIONS, carOccupancy: 1 }
    const hi = { ...ASSUMPTIONS, carOccupancy: 2 }
    expect(co2SavingsKgPerPersonYear(imp(0.1), hi)).toBeLessThan(co2SavingsKgPerPersonYear(imp(0.1), lo))
  })

  it('scales linearly with the car improvement', () => {
    const a = co2SavingsKgPerPersonYear(imp(0.05), ASSUMPTIONS)
    const b = co2SavingsKgPerPersonYear(imp(0.1), ASSUMPTIONS)
    expect(b).toBeCloseTo(2 * a, 8)
  })

  it('ignores other improvements', () => {
    const only = co2SavingsKgPerPersonYear({ transit: 0.5, rail: 0.28, bike: 0.16, car: 0 }, ASSUMPTIONS)
    expect(only).toBe(0)
  })

  it('never goes negative, even if transit emits more than the car', () => {
    const a = { ...ASSUMPTIONS, transitCo2KgPerKm: 1 }
    expect(co2SavingsKgPerPersonYear(imp(0.2), a)).toBe(0)
  })

  it('uses the assumptions passed in', () => {
    const a = { ...ASSUMPTIONS, carKmPerPersonYear: 1000, carCo2KgPerKm: 0.2, transitReplacementShare: 0 }
    expect(co2SavingsKgPerPersonYear(imp(0.5), a)).toBeCloseTo(100, 8)
  })
})
