# delta – Verkehrs-Simulator

Was würde sich für dich und den Staat ändern, wenn ÖPNV, Bahn und Radinfrastruktur
in Deutschland auf dem Niveau eines Vergleichslandes wären (Standard: Niederlande)?
delta ist ein interaktives Erklär-Tool, das Größenordnungen fühlbar macht. Es ist
**kein wissenschaftliches Modell und keine Prognose**.

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests (Vitest)
npm run build    # statischer Build nach dist/
npm run preview  # Build lokal ansehen
```

Der Build ist rein statisch (relative Pfade) und lässt sich auf jedem Webspace
ausliefern.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/config/countries.ts` | Kennzahlen je Land (Deutschland + Benchmarks), kommentiert als Schätzwerte |
| `src/config/assumptions.ts` | Modellannahmen: Kosten, Wirkungsstärken, Wohnlage-Faktoren |
| `src/config/sources.ts` | Quellenverzeichnis; die Config verweist mit `[Quelle: <id>]` darauf |
| `src/config/sliders.ts` | Beschriftung der Regler und welche Kennzahl sie anzeigen |
| `src/model/` | Reine Rechenfunktionen ohne UI, vollständig getestet |
| `src/lib/` | Formatierung (de-DE) und URL-Zustand zum Teilen |
| `src/components/` | UI-Komponenten |

## Neues Vergleichsland

Einen Eintrag in `BENCHMARKS` in `src/config/countries.ts` ergänzen. Mehr ist
nicht nötig. Modell, Dropdown, Regler-Kennzahlen, URL-Parameter und die
Annahmen-Tabelle übernehmen das Land automatisch.

## Annahmen

Siehe [`ANNAHMEN.md`](./ANNAHMEN.md) sowie die aufklappbare Liste im Footer der App. Belegte Werte sind dort mit
Fußnoten zur Quellenliste versehen, Modellannahmen sind als „Annahme“ gekennzeichnet.
