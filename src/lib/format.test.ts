import { describe, expect, it } from 'vitest'
import { formatBillions, formatEuro, formatKm, formatNumber, formatPercent } from './format'

// Intl uses narrow spaces depending on the environment; normalize them.
const n = (s: string) => s.replace(/\s/g, ' ')

describe('format', () => {
  it('formats numbers in German style', () => {
    expect(formatNumber(1234.56, 1)).toBe('1.234,6')
    expect(formatNumber(-0.001, 1)).toBe('0,0')
  })
  it('formats euros, billions, percent, km', () => {
    expect(n(formatEuro(4116.4))).toBe('4.116 €')
    expect(n(formatBillions(149.4e9))).toBe('149 Mrd. €')
    expect(n(formatBillions(13.71e9))).toBe('13,7 Mrd. €')
    expect(n(formatBillions(0))).toBe('0 Mrd. €')
    expect(n(formatPercent(0.62))).toBe('62 %')
    expect(n(formatKm(7.5))).toBe('7,5 km')
  })
})
