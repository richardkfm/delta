import type { Assumptions } from '../config/assumptions'
import type { CountryData } from '../config/countries'
import type { Profile, ScenarioMetrics } from './types'

export interface RadiusPoint {
  /** Radius mit dem ÖPNV in km. */
  transitKm: number
  /** Radius mit dem Rad in km. */
  bikeKm: number
  /** Größter Radius ohne Auto (bestes Verkehrsmittel) in km. */
  bestKm: number
}

export interface MobilityRadius {
  today: RadiusPoint
  scenario: RadiusPoint
  /** Zuwachs der erreichbaren Fläche (Kreisfläche) in Prozent. */
  areaGainPct: number
}

function radiusAt(transitKmh: number, bikeKmh: number, profile: Profile, a: Assumptions): RadiusPoint {
  const loc = a.locationFactors[profile.location]
  const hours = a.radiusMinutes / 60
  // Radius = Tür-zu-Tür-Geschwindigkeit × Zeit, angepasst an die Wohnlage.
  const transitKm = transitKmh * loc.transitSpeed * hours
  const bikeKm = bikeKmh * loc.bikeSpeed * hours
  return { transitKm, bikeKm, bestKm: Math.max(transitKm, bikeKm) }
}

/**
 * Wie weit komme ich in 30 Minuten ohne Auto? Heute vs. Szenario.
 * Basis sind die Tür-zu-Tür-Geschwindigkeiten von ÖPNV und Rad aus der Config.
 * Verschlechterungen gegenüber heute werden nicht angesetzt.
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
