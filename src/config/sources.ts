/**
 * Quellenverzeichnis. Werte in `countries.ts` und `assumptions.ts` verweisen in
 * ihren Kommentaren mit [Quelle: id] auf diese Einträge. Der Footer der App
 * listet alle Quellen verlinkt auf.
 */
export interface Source {
  /** Kurz-ID für Verweise aus der Config, z. B. "mid2017". */
  id: string
  /** Titel der Veröffentlichung oder Seite. */
  title: string
  /** Herausgeber. */
  publisher: string
  /** Bezugsjahr der Daten bzw. Erscheinungsjahr. */
  year: string
  url: string
  /** Wofür die Quelle im Modell verwendet wird. */
  usedFor: string
}

export const SOURCES: Source[] = []

/** Liefert eine Quelle zur ID (oder undefined). */
export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id)
}
