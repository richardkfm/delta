/**
 * Kennzahlen je Land.
 *
 * Deutschland ist das Ausgangsland („heute“), alle anderen Einträge sind
 * Benchmark-Länder. Ein neues Benchmark-Land wird ausschließlich hier ergänzt:
 * Eintrag anlegen – Modell und UI übernehmen es automatisch (Dropdown,
 * Regler-Kennzahlen, Berechnungen, URL-Parameter über `id`).
 *
 * Belegte Werte verweisen mit [Quelle: <id>] auf `sources.ts`. Werte mit
 * [Annahme] sind nicht belegt und dienen nur der Veranschaulichung.
 * Definitionen unterscheiden sich zwischen Ländern (z. B. Pünktlichkeits-
 * schwelle, Altersgrenzen der Erhebungen), die Werte sind daher nur grob
 * vergleichbar.
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
  /** km Straßen-/Stadtbahn je 100.000 Einwohner (Basis für Investitionen in ÖPNV-Trassen). */
  transitLaneKmPer100k: number
  /** Ø Tür-zu-Tür-Geschwindigkeit mit Bus/Tram/Metro in km/h (Wegelänge / Wegedauer). */
  transitDoorToDoorKmh: number

  // ---------- Bahn-Pünktlichkeit ----------
  /** Anteil pünktlicher Züge im Fernverkehr bzw. Hauptnetz, 0–1. */
  railPunctuality: number

  // ---------- Radinfrastruktur ----------
  /** Anteil des Rads an allen Wegen, 0–1. */
  bikeShare: number
  /** km baulich getrennte Radwege je 1.000 Einwohner. */
  bikeLaneKmPer1000: number
  /** Ø Tür-zu-Tür-Geschwindigkeit mit dem Rad in km/h (Wegelänge / Wegedauer). */
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
  // [Annahme] Ø Takt ca. 20 Min. Kein vergleichbarer Wert für DE und NL veröffentlicht.
  // Zur Einordnung: Nur etwa ein Drittel der Bevölkerung hat sehr gute bis gute
  // ÖPNV-Anbindung. [Quelle: agora-oev-atlas-2026]
  transitHeadwayMin: 20,
  // 3.336 km Straßen-/Stadtbahn (VDV-Mitglieder, 2023) / 83,5 Mio. Einw. ≈ 4,0 km je 100.000. [Quelle: vdv-statistik-2023]
  transitLaneKmPer100k: 4.0,
  // ÖSPV (Bus, Tram): 9 km in 34 Min. je Weg ≈ 15,9 km/h (MiD 2023, Tab. 24). [Quelle: mid2023-ergebnisbericht]
  transitDoorToDoorKmh: 15.9,
  // DB-Fernverkehr 2025: 60,1 % (< 6 Min. Verspätung je Halt). [Quelle: db-2025, bundestag-19-9205]
  railPunctuality: 0.601,
  // Radanteil 11 % aller Wege (MiD 2023). [Quelle: mid2023-zusammenfassung]
  bikeShare: 0.11,
  // [Annahme] ca. 0,9 km je 1.000 Einw. Eine bundesweite Gesamtlänge wird nicht erhoben.
  // Belegt sind nur 16.398 km Radwege an Bundesstraßen (≈ 0,2 km je 1.000 Einw.). [Quelle: bundestag-21-2158]
  bikeLaneKmPer1000: 0.9,
  // Konventionelles Rad: 4 km in 24 Min. ≈ 10 km/h (MiD 2023, Regionalbericht Hessen als Näherung). [Quelle: mid2023-hessen]
  bikeDoorToDoorKmh: 10,
  // Pkw-Fahrer 40 % + Mitfahrer 13 % = 53 % aller Wege (MiD 2023). [Quelle: mid2023-zusammenfassung]
  carShare: 0.53,
}

/** Benchmark-Länder. Das erste Element ist der Standard im Dropdown. */
export const BENCHMARKS: CountryData[] = [
  {
    id: 'nl',
    name: 'Niederlande',
    flag: '🇳🇱',
    inName: 'in den Niederlanden',
    // [Annahme] Ø Takt ca. 10 Min. Nicht belegt; Studien sehen NL außerhalb der Randstad
    // eher nicht dichter getaktet als DE. [Quelle: agora-oev-atlas-2023]
    transitHeadwayMin: 10,
    // ca. 305 km Tram (Amsterdam, Rotterdam, Den Haag, Utrecht) / 18,1 Mio. Einw. ≈ 1,7 km je 100.000.
    // Weniger als DE, daher entsteht hier kein Investitionsbedarf. [Quelle: wikipedia-tram]
    transitLaneKmPer100k: 1.7,
    // Bus/Tram/Metro: 14,3 km in 45,5 Min. je Verplaatsing ≈ 18,9 km/h (ODiN 2023). [Quelle: cbs-odin-verplaatsing]
    transitDoorToDoorKmh: 18.9,
    // NS Hauptnetz 2025: 90,7 % (Reisende, < 5 Min.; offizieller 3-Min.-Wert: 85,5 %). [Quelle: ns-2025]
    railPunctuality: 0.907,
    // Radanteil 26,8 % aller Wege (ODiN 2023, ab 6 Jahren). [Quelle: cbs-odin-persoon]
    bikeShare: 0.268,
    // ca. 35.000 km Fietspad / 18,1 Mio. Einw. ≈ 1,9 km je 1.000 Einw. [Quelle: fietsberaad-2012, cbs-bevolking]
    bikeLaneKmPer1000: 1.9,
    // Fiets: 4,0 km in 21,7 Min. ≈ 11,1 km/h (ODiN 2023). [Quelle: cbs-odin-verplaatsing]
    bikeDoorToDoorKmh: 11.1,
    // Auto-Fahrer 33,6 % + Mitfahrer 11,1 % = 44,7 % aller Wege (ODiN 2023). [Quelle: cbs-odin-persoon]
    carShare: 0.447,
  },
]

export const DEFAULT_BENCHMARK_ID = BENCHMARKS[0].id

/** Liefert das Benchmark-Land zur ID, fällt auf den Standard zurück. */
export function getBenchmark(id: string | null | undefined, list: CountryData[] = BENCHMARKS): CountryData {
  return list.find((c) => c.id === id) ?? list[0]
}
