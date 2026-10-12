import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS } from '../config/assumptions'
import { co2SavingsKgPerPersonYear } from './co2'
import type { Improvements } from './types'

const imp = (car: number): Improvements => ({ transit: 0, rail: 0, bike: 0, car })

describe('co2SavingsKgPerPersonYear', () => {
  it('ist bei Verbesserung 0 genau 0', () => {
    expect(co2SavingsKgPerPersonYear(imp(0), ASSUMPTIONS)).toBe(0)
  })

  it('stimmt bei Autoverbesserung 0,1 mit der Handrechnung überein', () => {
    // vermiedene km = 7000 × 0,1 = 700
    // netto je km = 0,15 − 0,6 × 0,04 = 0,126 kg
    // 700 × 0,126 = 88,2 kg
    expect(co2SavingsKgPerPersonYear(imp(0.1), ASSUMPTIONS)).toBeCloseTo(88.2, 8)
  })

  it('skaliert linear mit der Autoverbesserung', () => {
    const a = co2SavingsKgPerPersonYear(imp(0.05), ASSUMPTIONS)
    const b = co2SavingsKgPerPersonYear(imp(0.1), ASSUMPTIONS)
    expect(b).toBeCloseTo(2 * a, 8)
  })

  it('ignoriert andere Verbesserungen', () => {
    const only = co2SavingsKgPerPersonYear({ transit: 0.5, rail: 0.28, bike: 0.16, car: 0 }, ASSUMPTIONS)
    expect(only).toBe(0)
  })

  it('wird nie negativ, auch wenn ÖPNV mehr emittiert als das Auto', () => {
    const a = { ...ASSUMPTIONS, transitCo2KgPerKm: 1 }
    expect(co2SavingsKgPerPersonYear(imp(0.2), a)).toBe(0)
  })

  it('nutzt die übergebenen Annahmen', () => {
    const a = { ...ASSUMPTIONS, carKmPerPersonYear: 1000, carCo2KgPerKm: 0.2, transitReplacementShare: 0 }
    expect(co2SavingsKgPerPersonYear(imp(0.5), a)).toBeCloseTo(100, 8)
  })
})
