import { ASSUMPTIONS, LOCATION_LABELS, type Location } from '../config/assumptions'
import { BENCHMARKS, GERMANY, type CountryData } from '../config/countries'
import { SOURCES } from '../config/sources'
import { formatBillions, formatEuro, formatNumber, formatPercent } from '../lib/format'

const a = ASSUMPTIONS

/** One entry of the assumptions list. Without `src` it is a model assumption with no direct source. */
interface Item {
  label: string
  value: string
  /** IDs from `sources.ts`. */
  src?: string[]
}

/** Country key figures: table rows, columns = Germany + all benchmarks. */
const COUNTRY_ROWS: { label: string; value: (c: CountryData) => string; assumption?: boolean }[] = [
  { label: 'Ø ÖPNV-Takt', value: (c) => `${formatNumber(c.transitHeadwayMin, 0)} Min.`, assumption: true },
  { label: 'Straßen-/Stadtbahn je 100.000 Einw.', value: (c) => `${formatNumber(c.transitLaneKmPer100k, 1)} km` },
  { label: 'Bus/Tram Tür-zu-Tür', value: (c) => `${formatNumber(c.transitDoorToDoorKmh, 1)} km/h` },
  { label: 'Bahn-Pünktlichkeit', value: (c) => formatPercent(c.railPunctuality, 1) },
  { label: 'Radanteil an allen Wegen', value: (c) => formatPercent(c.bikeShare, 1) },
  { label: 'Radwege je 1.000 Einw.', value: (c) => `${formatNumber(c.bikeLaneKmPer1000, 1)} km` },
  { label: 'Rad Tür-zu-Tür', value: (c) => `${formatNumber(c.bikeDoorToDoorKmh, 1)} km/h` },
  { label: 'Autoanteil an allen Wegen', value: (c) => formatPercent(c.carShare, 1) },
]

const loc = (l: Location) => a.locationFactors[l]
const perLocation = (f: (l: Location) => string) =>
  (Object.keys(LOCATION_LABELS) as Location[]).map((l) => `${LOCATION_LABELS[l]} ${f(l)}`).join(' · ')

/** Model assumptions as a readable list, with source references. */
const ASSUMPTION_GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Haushalt',
    items: [
      { label: 'Auto-Vollkosten (Bestand, unter ADAC-Neuwagenwerten)', value: `${formatEuro(a.carFullCostPerMonth)}/Monat`, src: ['adac-autokosten', 'adac-kompaktklasse'] },
      { label: 'ÖPNV-Ticket (Deutschlandticket)', value: `${formatEuro(a.transitTicketPerMonth)}/Monat`, src: ['correctiv-dticket'] },
      { label: 'Zweitwagen: Faktor auf Abschaffungs-Wahrscheinlichkeit', value: `× ${formatNumber(a.secondCarProbabilityFactor, 1)}` },
      { label: 'Max. Wahrscheinlichkeit Autoverzicht', value: perLocation((l) => formatPercent(loc(l).maxCarAbolishProbability)) },
      { label: 'Ohne Auto: Taxi, Carsharing & Co.', value: `${formatEuro(a.noCarSubstituteCostPerYear)}/Jahr, bis −${formatPercent(a.noCarSubstituteReductionMax)}` },
      { label: 'Ohne Auto: Zeitwert', value: `${formatEuro(a.valueOfTimePerHour)}/Std.` },
    ],
  },
  {
    title: 'Zeit',
    items: [
      {
        label: 'Ø Arbeitsweg',
        value: `${formatNumber(a.commuteMinutesPerDay, 0)} Min./Tag bei ${formatNumber(a.averageCommuteKm, 0)} km einfach`,
        src: ['destatis-pendelzeit-2024', 'destatis-pendler-2024'],
      },
      ...BENCHMARKS.map((b): Item => ({
        label: `Pendelzeit-Effekt auf ${b.name}-Niveau`,
        value: `−${formatPercent(a.transitCommuteElasticity * Math.max(0, 1 - b.transitHeadwayMin / GERMANY.transitHeadwayMin))}`,
      })),
      { label: 'Pufferzeit durch Unpünktlichkeit heute', value: `${formatNumber(a.bufferMinutesPerDay, 0)} Min./Tag` },
      { label: 'Einkauf, Erledigungen, Freizeit', value: `${formatNumber(a.everydayTripMinutesPerWeek, 0)} Min./Woche`, src: ['mid2023-ergebnisbericht'] },
      ...BENCHMARKS.map((b): Item => ({
        label: `Rad-Effekt auf Alltagswege, ${b.name}-Niveau`,
        value: `−${formatPercent(a.bikeTimeElasticity * Math.max(0, b.bikeShare - GERMANY.bikeShare))}`,
      })),
      { label: 'Arbeitstage / Arbeitswochen', value: `${a.workDaysPerWeek} pro Woche / ${a.workWeeksPerYear} pro Jahr` },
      { label: 'Wohnlage-Faktor Takt', value: perLocation((l) => `× ${formatNumber(loc(l).transit, 1)}`) },
      { label: 'Wohnlage-Faktor Pünktlichkeit', value: perLocation((l) => `× ${formatNumber(loc(l).rail, 1)}`) },
      { label: 'Wohnlage-Faktor Rad', value: perLocation((l) => `× ${formatNumber(loc(l).bike, 1)}`) },
      { label: 'Mobilitätsradius: Tempo-Faktor ÖPNV', value: perLocation((l) => `× ${formatNumber(loc(l).transitSpeed, 2)}`) },
      { label: 'Mobilitätsradius: Tempo-Faktor Rad', value: perLocation((l) => `× ${formatNumber(loc(l).bikeSpeed, 2)}`) },
    ],
  },
  {
    title: 'Staat',
    items: [
      { label: 'Einwohner', value: `${formatNumber(a.population / 1e6, 1)} Mio.`, src: ['destatis-bev-2025'] },
      { label: 'Radweg (außerorts, Orientierungswert)', value: `${formatNumber(a.bikeLaneCostPerKm / 1e6, 1)} Mio. €/km`, src: ['hessen-radweg-kosten'] },
      { label: 'Straßenbahn (zweigleisig, Mittelwert 10–15 Mio.)', value: `${formatNumber(a.transitLaneCostPerKm / 1e6, 1)} Mio. €/km`, src: ['oepnv-db-kosten'] },
      { label: 'Schiene (Generalsanierung)', value: `${formatNumber(a.railUpgradeCostPerKm / 1e6, 0)} Mio. €/km`, src: ['brh-generalsanierung'] },
      { label: 'Schienen-km je Prozentpunkt Pünktlichkeit (4.000 km Korridore als Anker)', value: `${formatNumber(a.railUpgradeKmPerPoint, 0)} km` },
      { label: 'ÖPNV-Betriebskosten heute', value: `${formatBillions(a.transitOperatingCostPerYear)}/Jahr`, src: ['vdv-deutschlandangebot'] },
      { label: 'Nicht durch Fahrgeld gedeckter Anteil', value: formatPercent(a.transitExtraOperatingNetShare), src: ['vdv-deutschlandangebot'] },
      { label: 'Bauzeit / Betrachtungszeitraum', value: `${a.buildYears} / ${a.horizonYears} Jahre` },
      ...a.externalCosts.map(
        (c): Item => ({
          label: `Folgekosten Pkw-Verkehr: ${c.label}`,
          value: `${formatBillions(c.annualEur)}/Jahr, ${formatPercent(c.elasticity)} variabel`,
          src: c.label === 'Straßenerhalt' ? ['boettger-2021', 'wegekosten-2021'] : ['infras-2019'],
        }),
      ),
    ],
  },
  {
    title: 'CO₂',
    items: [
      { label: 'Pkw-km pro Person', value: `${formatNumber(a.carKmPerPersonYear, 0)} km/Jahr`, src: ['kba-fahrleistung-2023'] },
      { label: 'CO₂e Auto je Fahrzeug-km (inkl. Vorkette)', value: `${formatNumber(a.carCo2KgPerKm * 1000, 0)} g`, src: ['uba-emissionen-2024'] },
      { label: 'Ø Besetzung Pkw', value: `${formatNumber(a.carOccupancy, 1)} Personen`, src: ['uba-emissionen-2024'] },
      { label: 'CO₂e ÖPNV je Personen-km (gewichtet)', value: `${formatNumber(a.transitCo2KgPerKm * 1000, 0)} g`, src: ['uba-emissionen-2024'] },
      { label: 'Anteil vermiedener Personen-km im ÖPNV', value: formatPercent(a.transitReplacementShare) },
    ],
  },
]

/** Footnote number of a source (position in the source list, starting at 1). */
const sourceNumber = (id: string) => SOURCES.findIndex((s) => s.id === id) + 1

function SourceRefs({ ids }: { ids?: string[] }) {
  if (!ids || ids.length === 0) {
    return <span className="ml-1 rounded bg-line/60 px-1 text-[10px] uppercase tracking-wide text-muted">Annahme</span>
  }
  return (
    <sup className="ml-0.5">
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ','}
          <a href={`#quelle-${id}`} className="text-accent hover:underline">
            {sourceNumber(id)}
          </a>
        </span>
      ))}
    </sup>
  )
}

export function Footer() {
  const countries = [GERMANY, ...BENCHMARKS]
  return (
    <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
      <p className="font-medium text-ink">Schätzmodell zur Veranschaulichung, keine Prognose.</p>
      <p className="mt-1">
        Die Kennzahlen beruhen auf öffentlichen Quellen, die Wirkungen auf vereinfachten Modellannahmen. Das Modell
        rechnet bewusst einfach und linear, um Größenordnungen fühlbar zu machen.
      </p>

      <details className="group mt-4">
        <summary className="cursor-pointer select-none font-medium text-accent">
          Alle Annahmen, Werte und Quellen anzeigen
        </summary>

        <div className="mt-4 space-y-6">
          <div>
            <h3 className="font-semibold text-ink">Länderkennzahlen</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-1 pr-3 font-medium">Kennzahl</th>
                    {countries.map((c) => (
                      <th key={c.id} className="py-1 pr-3 text-right font-medium whitespace-nowrap">
                        {c.flag} {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-line/60">
                      <td className="py-1 pr-3">
                        {row.label}
                        {row.assumption && <SourceRefs />}
                      </td>
                      {countries.map((c) => (
                        <td key={c.id} className="py-1 pr-3 text-right tabular-nums whitespace-nowrap text-ink">
                          {row.value(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs">
              Quellen der Länderwerte: MiD 2023, ODiN 2023 (CBS), DB und NS, VDV, Fietsberaad – siehe Liste unten.
              Für die gesamte Radweglänge in Deutschland gibt es keine amtliche Zahl, der Wert ist geschätzt. Die
              Pünktlichkeit ist unterschiedlich definiert (DB: Züge &lt; 6 Min., NS: Reisende &lt; 5 Min.).
            </p>
          </div>

          {ASSUMPTION_GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="font-semibold text-ink">{g.title}</h3>
              <dl className="mt-2 divide-y divide-line/60">
                {g.items.map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5 py-1 sm:flex-row sm:justify-between sm:gap-4">
                    <dt>
                      {item.label}
                      <SourceRefs ids={item.src} />
                    </dt>
                    <dd className="tabular-nums text-ink sm:text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <div>
            <h3 className="font-semibold text-ink">So rechnet das Modell</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Jeder Regler interpoliert linear zwischen dem deutschen Wert und dem Wert des Vergleichslandes.</li>
              <li>
                Zeit = kürzere Pendelzeit (Takt) + wegfallender Puffer (Pünktlichkeit) + kürzere Alltagswege (Rad),
                skaliert nach Wohnlage und Arbeitsweg.
              </li>
              <li>
                Geld = Wahrscheinlichkeit, ein Auto abzuschaffen × (Auto-Vollkosten − Ticket). Ohne Auto: weniger Taxi
                & Co. plus Zeitgewinn.
              </li>
              <li>
                Staat: Investition = Ausbaubedarf × Kosten pro km, dazu Mehrkosten im ÖPNV-Betrieb. Nutzen =
                Folgekosten des Pkw-Verkehrs × Rückgang der Autofahrten. Die Folgekosten sind gesellschaftliche Kosten
                (z. B. Unfälle, Klima), nicht nur Ausgaben im Staatshaushalt.
              </li>
              <li>Ist ein Vergleichsland in einer Kennzahl schlechter als Deutschland, rechnet das Modell keine Verschlechterung.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Quellen</h3>
            <p className="mt-1">
              Werte mit dem Hinweis „Annahme“ sind Modellannahmen ohne direkte Quelle. Länderwerte sind teils
              unterschiedlich definiert und daher nur grob vergleichbar. Stand der Recherche: Oktober 2026.
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              {SOURCES.map((src) => (
                <li key={src.id} id={`quelle-${src.id}`} className="scroll-mt-4">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-ink underline decoration-line underline-offset-2 hover:text-accent hover:decoration-accent"
                  >
                    {src.title}
                  </a>
                  , {src.publisher} ({src.year}). <span className="text-muted">Verwendet für: {src.usedFor}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </details>

      <p className="mt-8 pb-24 text-xs sm:pb-6">
        <span className="font-semibold text-ink">delta</span> · Ein Erklär-Tool, kein wissenschaftliches Modell.
      </p>
    </footer>
  )
}
