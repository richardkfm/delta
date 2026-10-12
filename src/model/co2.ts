import type { Assumptions } from '../config/assumptions'
import type { Improvements } from './types'

/**
 * CO₂-Einsparung pro Person und Jahr in kg.
 * Vermiedene Auto-km = Pkw-km pro Person × relativer Rückgang der Autofahrten.
 * Davon wird ein Teil im ÖPNV gefahren und verursacht dort wieder Emissionen.
 */
export function co2SavingsKgPerPersonYear(imp: Improvements, a: Assumptions): number {
  const avoidedKm = a.carKmPerPersonYear * imp.car
  const netKgPerKm = a.carCo2KgPerKm - a.transitReplacementShare * a.transitCo2KgPerKm
  return Math.max(0, avoidedKm * netKgPerKm)
}
