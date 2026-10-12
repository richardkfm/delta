/**
 * Kennzahlen je Land.
 *
 * Deutschland ist das Ausgangsland („heute“), alle anderen Einträge sind
 * Benchmark-Länder. Ein neues Benchmark-Land wird ausschließlich hier ergänzt:
 * Eintrag anlegen – Modell und UI übernehmen es automatisch (Dropdown,
 * Regler-Kennzahlen, Berechnungen, URL-Parameter über `id`).
 *
 * WICHTIG: Alle Werte sind gerundete Schätzwerte zur Veranschaulichung und
 * beruhen nur grob auf öffentlich zugänglichen Quellen. Definitionen
 * unterscheiden sich zwischen Ländern (z. B. Pünktlichkeitsschwelle).
 */

export interface CountryData {
  /** Kurz-ID, wird im URL-Parameter verwendet (z. B. "nl"). */
  id: string
  /** Anzeigename, z. B. "Niederlande". */
  name: string
  /** Emoji-Flagge für die Anzeige. */
  flag: string
  /** Ortsangabe mit Präposition für Fließtext, z. B. "in den Niederlanden". */
  inName: string

  // ---------- ÖPNV-Takt & Netzdichte ----------
  /** Ø Takt im ÖPNV in Minuten (gewichtet über Haltestellen, Tagesverkehr). Kleiner = besser. */
  transitHeadwayMin: number
  /** km ÖPNV-Trasse (Straßen-/Stadtbahn, eigene Busspuren) je 100.000 Einwohner. */
  transitLaneKmPer100k: number
  /** Ø Tür-zu-Tür-Geschwindigkeit im ÖPNV inkl. Fußweg, Warten, Umstieg in km/h (Großstadt). */
  transitDoorToDoorKmh: number

  // ---------- Bahn-Pünktlichkeit ----------
  /** Anteil pünktlicher Züge im Fernverkehr, 0–1. */
  railPunctuality: number

  // ---------- Radinfrastruktur ----------
  /** Anteil des Rads an allen Wegen, 0–1. */
  bikeShare: number
  /** km baulich getrennte Radwege je 1.000 Einwohner. */
  bikeLaneKmPer1000: number
  /** Ø Tür-zu-Tür-Geschwindigkeit mit dem Rad inkl. Ampeln/Umwege in km/h. */
  bikeDoorToDoorKmh: number

  // ---------- Autoabhängigkeit ----------
  /** Anteil der Wege mit dem Auto (Fahrer + Mitfahrer), 0–1. Kleiner = besser. */
  carShare: number
}

/** Deutschland – Ausgangswerte („Deutschland heute“). */
export const GERMANY: CountryData = {
  id: 'de',
  name: 'Deutschland',
  flag: '🇩🇪',
  inName: 'in Deutschland',
  // Schätzwert: Ø Takt ca. 20 Min. (Stadt dichter, Land oft 60 Min. und mehr)
  transitHeadwayMin: 20,
  // Schätzwert: ca. 9 km ÖPNV-Trasse je 100.000 Einw.
  transitLaneKmPer100k: 9,
  // Schätzwert: ca. 15 km/h Tür-zu-Tür (inkl. Zu-/Abgang und Wartezeit)
  transitDoorToDoorKmh: 15,
  // Schätzwert: DB-Fernverkehr ca. 62 % pünktlich (< 6 Min. Verspätung), 2024
  railPunctuality: 0.62,
  // Schätzwert: Radanteil ca. 11 % aller Wege (MiD)
  bikeShare: 0.11,
  // Schätzwert: ca. 0,9 km Radweg je 1.000 Einw.
  bikeLaneKmPer1000: 0.9,
  // Schätzwert: ca. 13 km/h Tür-zu-Tür
  bikeDoorToDoorKmh: 13,
  // Schätzwert: ca. 57 % der Wege mit dem Auto (MiD 2017, Fahrer + Mitfahrer)
  carShare: 0.57,
}

/** Benchmark-Länder. Das erste Element ist der Standard im Dropdown. */
export const BENCHMARKS: CountryData[] = [
  {
    id: 'nl',
    name: 'Niederlande',
    flag: '🇳🇱',
    inName: 'in den Niederlanden',
    // Schätzwert: Ø Takt ca. 10 Min.
    transitHeadwayMin: 10,
    // Schätzwert: ca. 14 km ÖPNV-Trasse je 100.000 Einw.
    transitLaneKmPer100k: 14,
    // Schätzwert: ca. 18 km/h Tür-zu-Tür
    transitDoorToDoorKmh: 18,
    // Schätzwert: NS ca. 90 % pünktlich (< 5 Min.)
    railPunctuality: 0.9,
    // Schätzwert: Radanteil ca. 27 % aller Wege (KiM)
    bikeShare: 0.27,
    // Schätzwert: ca. 35.000 km Radwege / 17,9 Mio. Einw. ≈ 2,0 km je 1.000 Einw.
    bikeLaneKmPer1000: 2.0,
    // Schätzwert: ca. 15 km/h Tür-zu-Tür (Vorrang, wenig Ampeln)
    bikeDoorToDoorKmh: 15,
    // Schätzwert: ca. 47 % der Wege mit dem Auto (Fahrer + Mitfahrer)
    carShare: 0.47,
  },
]

export const DEFAULT_BENCHMARK_ID = BENCHMARKS[0].id

/** Liefert das Benchmark-Land zur ID, fällt auf den Standard zurück. */
export function getBenchmark(id: string | null | undefined, list: CountryData[] = BENCHMARKS): CountryData {
  return list.find((c) => c.id === id) ?? list[0]
}
