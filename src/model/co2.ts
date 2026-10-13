import type { Assumptions } from '../config/assumptions'
import type { Improvements } from './types'

/**
 * CO₂e savings per person per year in kg.
 * Avoided car km = car km per person × relative decline in car trips.
 * Part of the passenger km avoided in the process (car km × occupancy) is travelled by
 * transit and causes emissions there again.
 */
export function co2SavingsKgPerPersonYear(imp: Improvements, a: Assumptions): number {
  const avoidedCarKm = a.carKmPerPersonYear * imp.car
  const shiftedTransitKm = avoidedCarKm * a.carOccupancy * a.transitReplacementShare
  return Math.max(0, avoidedCarKm * a.carCo2KgPerKm - shiftedTransitKm * a.transitCo2KgPerKm)
}
