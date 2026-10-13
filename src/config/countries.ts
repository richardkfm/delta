/**
 * Key figures per country.
 *
 * Germany is the baseline country ("today"); all other entries are
 * benchmark countries. A new benchmark country is added here only:
 * create an entry and the model and UI pick it up automatically (dropdown,
 * slider metrics, calculations, URL parameter via `id`).
 *
 * Sourced values reference `sources.ts` with [Source: <id>]. Values marked
 * [Assumption] are not sourced and serve for illustration only.
 * Definitions differ between countries (e.g. punctuality threshold, age
 * limits of the surveys), so the values are only roughly comparable.
 */

export interface CountryData {
  /** Short ID, used in the URL parameter (e.g. "nl"). */
  id: string
  /** Display name, e.g. "Niederlande". */
  name: string
  /** Emoji flag for display. */
  flag: string
  /** Location phrase with preposition for running text, e.g. "in den Niederlanden". */
  inName: string

  // ---------- Public transit headway & network density ----------
  /** Avg. public transit headway in minutes (weighted across stops, daytime service). Lower = better. */
  transitHeadwayMin: number
  /** km of tram/light rail per 100,000 inhabitants (basis for investment in transit routes). */
  transitLaneKmPer100k: number
  /** Avg. door-to-door speed by bus/tram/metro in km/h (trip length / trip duration). */
  transitDoorToDoorKmh: number

  // ---------- Rail punctuality ----------
  /** Share of punctual long-distance / main-network trains, 0–1. */
  railPunctuality: number

  // ---------- Cycling infrastructure ----------
  /** Bike share of all trips, 0–1. */
  bikeShare: number
  /** km of physically separated bike lanes per 1,000 inhabitants. */
  bikeLaneKmPer1000: number
  /** Avg. door-to-door speed by bike in km/h (trip length / trip duration). */
  bikeDoorToDoorKmh: number

  // ---------- Car dependence ----------
  /** Share of trips by car (driver + passenger), 0–1. Lower = better. */
  carShare: number
}

/** Germany – baseline values ("Germany today"). */
export const GERMANY: CountryData = {
  id: 'de',
  name: 'Deutschland',
  flag: '🇩🇪',
  inName: 'in Deutschland',
  // [Assumption] Avg. headway approx. 20 min. No comparable value published for DE and NL.
  // For context: only about a third of the population has very good to good
  // public transit access. [Source: agora-oev-atlas-2026]
  transitHeadwayMin: 20,
  // 3,336 km tram/light rail (VDV members, 2023) / 83.5 million inhabitants ≈ 4.0 km per 100,000. [Source: vdv-statistik-2023]
  transitLaneKmPer100k: 4.0,
  // ÖSPV (local public bus, tram): 9 km in 34 min per trip ≈ 15.9 km/h (MiD 2023, table 24). [Source: mid2023-ergebnisbericht]
  transitDoorToDoorKmh: 15.9,
  // DB long-distance 2025: 60.1% (< 6 min delay per stop). [Source: db-2025, bundestag-19-9205]
  railPunctuality: 0.601,
  // Bike share 11% of all trips (MiD 2023). [Source: mid2023-zusammenfassung]
  bikeShare: 0.11,
  // [Assumption] approx. 0.9 km per 1,000 inhabitants. No nationwide total length is recorded.
  // Only 16,398 km of bike paths along federal highways are documented (≈ 0.2 km per 1,000 inhabitants). [Source: bundestag-21-2158]
  bikeLaneKmPer1000: 0.9,
  // Conventional bike: 4 km in 24 min ≈ 10 km/h (MiD 2023, Hesse regional report as approximation). [Source: mid2023-hessen]
  bikeDoorToDoorKmh: 10,
  // Car driver 40% + passenger 13% = 53% of all trips (MiD 2023). [Source: mid2023-zusammenfassung]
  carShare: 0.53,
}

/** Benchmark countries. The first element is the default in the dropdown. */
export const BENCHMARKS: CountryData[] = [
  {
    id: 'nl',
    name: 'Niederlande',
    flag: '🇳🇱',
    inName: 'in den Niederlanden',
    // [Assumption] Avg. headway approx. 10 min. Not sourced; studies see NL outside the Randstad
    // as not more densely served than DE. [Source: agora-oev-atlas-2023]
    transitHeadwayMin: 10,
    // approx. 305 km tram (Amsterdam, Rotterdam, The Hague, Utrecht) / 18.1 million inhabitants ≈ 1.7 km per 100,000.
    // Less than DE, so no investment need arises here. [Source: wikipedia-tram]
    transitLaneKmPer100k: 1.7,
    // Bus/tram/metro: 14.3 km in 45.5 min per verplaatsing (trip) ≈ 18.9 km/h (ODiN 2023). [Source: cbs-odin-verplaatsing]
    transitDoorToDoorKmh: 18.9,
    // NS main network 2025: 90.7% (passengers, < 5 min; official 3-min value: 85.5%). [Source: ns-2025]
    railPunctuality: 0.907,
    // Bike share 26.8% of all trips (ODiN 2023, age 6 and over). [Source: cbs-odin-persoon]
    bikeShare: 0.268,
    // approx. 35,000 km fietspad (bike path) / 18.1 million inhabitants ≈ 1.9 km per 1,000 inhabitants. [Source: fietsberaad-2012, cbs-bevolking]
    bikeLaneKmPer1000: 1.9,
    // Fiets (bike): 4.0 km in 21.7 min ≈ 11.1 km/h (ODiN 2023). [Source: cbs-odin-verplaatsing]
    bikeDoorToDoorKmh: 11.1,
    // Car driver 33.6% + passenger 11.1% = 44.7% of all trips (ODiN 2023). [Source: cbs-odin-persoon]
    carShare: 0.447,
  },
]

export const DEFAULT_BENCHMARK_ID = BENCHMARKS[0].id

/** Returns the benchmark country for the ID, falling back to the default. */
export function getBenchmark(id: string | null | undefined, list: CountryData[] = BENCHMARKS): CountryData {
  return list.find((c) => c.id === id) ?? list[0]
}
