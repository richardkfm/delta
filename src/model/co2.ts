import type { Assumptions } from '../config/assumptions'
import type { Improvements } from './types'

/**
 * CO₂e-Einsparung pro Person und Jahr in kg.
 * Vermiedene Pkw-km = Pkw-km pro Person × relativer Rückgang der Autofahrten.
 * Ein Teil der dabei vermiedenen Personen-km (Pkw-km × Besetzung) wird im ÖPNV
 * gefahren und verursacht dort wieder Emissionen.
 */
export function co2SavingsKgPerPersonYear(imp: Improvements, a: Assumptions): number {
  const avoidedCarKm = a.carKmPerPersonYear * imp.car
  const shiftedTransitKm = avoidedCarKm * a.carOccupancy * a.transitReplacementShare
  return Math.max(0, avoidedCarKm * a.carCo2KgPerKm - shiftedTransitKm * a.transitCo2KgPerKm)
}
