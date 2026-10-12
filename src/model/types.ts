import type { CarCount, Location } from '../config/assumptions'

/** Reglerstellungen, jeweils 0 (Deutschland heute) bis 1 (Benchmark-Niveau). */
export interface Sliders {
  /** ÖPNV-Takt & Netzdichte */
  transit: number
  /** Bahn-Pünktlichkeit */
  rail: number
  /** Radinfrastruktur */
  bike: number
  /** Autoabhängigkeit (Anteil der Wege mit dem Auto) */
  car: number
}

export type SliderKey = keyof Sliders

export const SLIDER_KEYS: SliderKey[] = ['transit', 'rail', 'bike', 'car']

/** Persönliches Profil. */
export interface Profile {
  location: Location
  /** Arbeitsweg einfach in km (0 = kein Pendeln). */
  commuteKm: number
  /** Autos im Haushalt (2 steht für „2+“). */
  cars: CarCount
}

/** Interpolierte Kennzahlen im aktuellen Szenario (echte Werte für die Anzeige). */
export interface ScenarioMetrics {
  transitHeadwayMin: number
  transitLaneKmPer100k: number
  transitDoorToDoorKmh: number
  railPunctuality: number
  bikeShare: number
  bikeLaneKmPer1000: number
  bikeDoorToDoorKmh: number
  carShare: number
}

/**
 * Verbesserung gegenüber Deutschland je Dimension, immer ≥ 0.
 * Ist ein Benchmark-Land in einer Dimension schlechter als Deutschland,
 * bleibt die Verbesserung 0 (das Modell rechnet keine Verschlechterung).
 */
export interface Improvements {
  /** Relative Taktverkürzung: 1 − Takt(Szenario) / Takt(DE). */
  transit: number
  /** Pünktlichkeitsgewinn in Anteilspunkten (0,28 = 28 Prozentpunkte). */
  rail: number
  /** Zuwachs Radanteil in Anteilspunkten. */
  bike: number
  /** Relativer Rückgang des Autoanteils: 1 − Anteil(Szenario) / Anteil(DE). */
  car: number
}
