import type { Assumptions } from '../config/assumptions'
import type { CountryData } from '../config/countries'
import type { Profile, ScenarioMetrics } from './types'

export interface RadiusPoint {
  /** Radius by public transit in km. */
  transitKm: number
  /** Radius by bike in km. */
  bikeKm: number
  /** Largest radius without a car (best mode of transport) in km. */
  bestKm: number
}

export interface MobilityRadius {
  today: RadiusPoint
  scenario: RadiusPoint
  /** Increase in reachable area (circle area) in percent. */
  areaGainPct: number
}

function radiusAt(transitKmh: number, bikeKmh: number, profile: Profile, a: Assumptions): RadiusPoint {
  const loc = a.locationFactors[profile.location]
  const hours = a.radiusMinutes / 60
  // Radius = door-to-door speed × time, adjusted for the location.
  const transitKm = transitKmh * loc.transitSpeed * hours
  const bikeKm = bikeKmh * loc.bikeSpeed * hours
  return { transitKm, bikeKm, bestKm: Math.max(transitKm, bikeKm) }
}

/**
 * How far can I get in 30 minutes without a car? Today vs. scenario.
 * Based on the door-to-door speeds of transit and bike from the config.
 * Deteriorations compared to today are not counted.
 */
export function mobilityRadius(
  base: CountryData,
  m: ScenarioMetrics,
  profile: Profile,
  a: Assumptions,
): MobilityRadius {
  const today = radiusAt(base.transitDoorToDoorKmh, base.bikeDoorToDoorKmh, profile, a)
  const scenario = radiusAt(
    Math.max(base.transitDoorToDoorKmh, m.transitDoorToDoorKmh),
    Math.max(base.bikeDoorToDoorKmh, m.bikeDoorToDoorKmh),
    profile,
    a,
  )
  const areaGainPct = today.bestKm > 0 ? ((scenario.bestKm / today.bestKm) ** 2 - 1) * 100 : 0
  return { today, scenario, areaGainPct }
}
