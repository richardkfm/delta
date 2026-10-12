import { ASSUMPTIONS, LOCATION_LABELS, type Location } from '../config/assumptions'
import { BENCHMARKS, GERMANY, type CountryData } from '../config/countries'
import { SOURCES } from '../config/sources'
import { formatBillions, formatEuro, formatNumber, formatPercent } from '../lib/format'

const a = ASSUMPTIONS

/** Länderkennzahlen: Zeilen der Tabelle, Spalten = Deutschland + alle Benchmarks. */
const COUNTRY_ROWS: { label: string; value: (c: CountryData) => string }[] = [
  { label: 'Ø ÖPNV-Takt', value: (c) => `${formatNumber(c.transitHeadwayMin, 0)} Min.` },
  { label: 'ÖPNV-Trasse je 100.000 Einw.', value: (c) => `${formatNumber(c.transitLaneKmPer100k, 1)} km` },
  { label: 'ÖPNV Tür-zu-Tür', value: (c) => `${formatNumber(c.transitDoorToDoorKmh, 0)} km/h` },
  { label: 'Bahn-Pünktlichkeit Fernverkehr', value: (c) => formatPercent(c.railPunctuality) },
  { label: 'Radanteil an allen Wegen', value: (c) => formatPercent(c.bikeShare) },
  { label: 'Radwege je 1.000 Einw.', value: (c) => `${formatNumber(c.bikeLaneKmPer1000, 1)} km` },
  { label: 'Rad Tür-zu-Tür', value: (c) => `${formatNumber(c.bikeDoorToDoorKmh, 0)} km/h` },
  { label: 'Autoanteil an allen Wegen', value: (c) => formatPercent(c.carShare) },
]

const loc = (l: Location) => a.locationFactors[l]
const perLocation = (f: (l: Location) => string) =>
  (Object.keys(LOCATION_LABELS) as Location[]).map((l) => `${LOCATION_LABELS[l]} ${f(l)}`).join(' · ')

/** Modellannahmen als lesbare Liste. */
const ASSUMPTION_GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Haushalt',
    items: [
      ['Auto-Vollkosten', `${formatEuro(a.carFullCostPerMonth)}/Monat`],
      ['ÖPNV-Ticket', `${formatEuro(a.transitTicketPerMonth)}/Monat`],
      ['Zweitwagen: Faktor auf Abschaffungs-Wahrscheinlichkeit', `× ${formatNumber(a.secondCarProbabilityFactor, 1)}`],
      ['Max. Wahrscheinlichkeit Autoverzicht', perLocation((l) => formatPercent(loc(l).maxCarAbolishProbability))],
      ['Ohne Auto: Taxi, Carsharing & Co.', `${formatEuro(a.noCarSubstituteCostPerYear)}/Jahr, bis −${formatPercent(a.noCarSubstituteReductionMax)}`],
      ['Ohne Auto: Zeitwert', `${formatEuro(a.valueOfTimePerHour)}/Std.`],
    ],
  },
  {
    title: 'Zeit',
    items: [
      ['Ø Arbeitsweg', `${formatNumber(a.commuteMinutesPerDay, 0)} Min./Tag bei ${formatNumber(a.averageCommuteKm, 0)} km einfach`],
      ...BENCHMARKS.map((b): [string, string] => [
        `Pendelzeit-Effekt auf ${b.name}-Niveau`,
        `−${formatPercent(a.transitCommuteElasticity * Math.max(0, 1 - b.transitHeadwayMin / GERMANY.transitHeadwayMin))}`,
      ]),
      ['Pufferzeit durch Unpünktlichkeit heute', `${formatNumber(a.bufferMinutesPerDay, 0)} Min./Tag`],
      ['Alltagswege', `${formatNumber(a.everydayTripMinutesPerWeek, 0)} Min./Woche`],
      ...BENCHMARKS.map((b): [string, string] => [
        `Rad-Effekt auf Alltagswege, ${b.name}-Niveau`,
        `−${formatPercent(a.bikeTimeElasticity * Math.max(0, b.bikeShare - GERMANY.bikeShare))}`,
      ]),
      ['Arbeitstage / Arbeitswochen', `${a.workDaysPerWeek} pro Woche / ${a.workWeeksPerYear} pro Jahr`],
      ['Wohnlage-Faktor Takt', perLocation((l) => `× ${formatNumber(loc(l).transit, 1)}`)],
      ['Wohnlage-Faktor Pünktlichkeit', perLocation((l) => `× ${formatNumber(loc(l).rail, 1)}`)],
      ['Wohnlage-Faktor Rad', perLocation((l) => `× ${formatNumber(loc(l).bike, 1)}`)],
      ['Mobilitätsradius: Tempo-Faktor ÖPNV', perLocation((l) => `× ${formatNumber(loc(l).transitSpeed, 2)}`)],
      ['Mobilitätsradius: Tempo-Faktor Rad', perLocation((l) => `× ${formatNumber(loc(l).bikeSpeed, 2)}`)],
    ],
  },
  {
    title: 'Staat',
    items: [
      ['Einwohner', `${formatNumber(a.population / 1e6, 0)} Mio.`],
      ['Radweg', `${formatNumber(a.bikeLaneCostPerKm / 1e6, 1)} Mio. €/km`],
      ['ÖPNV-Trasse (Straßenbahn, Mittelwert 5–10 Mio.)', `${formatNumber(a.transitLaneCostPerKm / 1e6, 1)} Mio. €/km`],
      ['Schiene (Sanierung/Ausbau)', `${formatNumber(a.railUpgradeCostPerKm / 1e6, 1)} Mio. €/km`],
      ['Schienen-km je Prozentpunkt Pünktlichkeit', `${formatNumber(a.railUpgradeKmPerPoint, 0)} km`],
      ['ÖPNV-Betriebskosten heute', `${formatBillions(a.transitOperatingCostPerYear)}/Jahr`],
      ['Netto-Anteil Mehrbetriebskosten', formatPercent(a.transitExtraOperatingNetShare)],
      ['Bauzeit / Betrachtungszeitraum', `${a.buildYears} / ${a.horizonYears} Jahre`],
      ...a.externalCosts.map(
        (c): [string, string] => [
          `Folgekosten Autoverkehr: ${c.label}`,
          `${formatBillions(c.annualEur)}/Jahr, ${formatPercent(c.elasticity)} variabel`,
        ],
      ),
    ],
  },
  {
    title: 'CO₂',
    items: [
      ['Pkw-km pro Person', `${formatNumber(a.carKmPerPersonYear, 0)} km/Jahr`],
      ['CO₂ Auto / ÖPNV', `${formatNumber(a.carCo2KgPerKm * 1000, 0)} / ${formatNumber(a.transitCo2KgPerKm * 1000, 0)} g/km`],
      ['Anteil vermiedener Auto-km im ÖPNV', formatPercent(a.transitReplacementShare)],
    ],
  },
]

export function Footer() {
  const countries = [GERMANY, ...BENCHMARKS]
  return (
    <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
      <p className="font-medium text-ink">Schätzmodell zur Veranschaulichung, keine Prognose.</p>
      <p className="mt-1">
        Alle Zahlen sind gerundete Schätzwerte. Das Modell rechnet bewusst einfach und linear, um Größenordnungen
        fühlbar zu machen.
      </p>

      <details className="group mt-4">
        <summary className="cursor-pointer select-none font-medium text-accent">
          Alle Annahmen und Werte anzeigen
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
                      <td className="py-1 pr-3">{row.label}</td>
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
          </div>

          {ASSUMPTION_GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="font-semibold text-ink">{g.title}</h3>
              <dl className="mt-2 divide-y divide-line/60">
                {g.items.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 py-1 sm:flex-row sm:justify-between sm:gap-4">
                    <dt>{k}</dt>
                    <dd className="tabular-nums text-ink sm:text-right">{v}</dd>
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
                Staat: Investition = Ausbaubedarf × Kosten pro km. Nutzen = Folgekosten des Autoverkehrs × Rückgang der
                Autofahrten.
              </li>
              <li>Ist ein Vergleichsland in einer Kennzahl schlechter als Deutschland, rechnet das Modell keine Verschlechterung.</li>
            </ul>
          </div>

          {SOURCES.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink">Quellen</h3>
              <p className="mt-1">
                Werte ohne Quelle sind Modellannahmen. Länderwerte sind teils unterschiedlich definiert (z. B.
                Pünktlichkeitsschwelle) und daher nur grob vergleichbar.
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                {SOURCES.map((src) => (
                  <li key={src.id}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline decoration-line underline-offset-2 hover:text-accent hover:decoration-accent"
                    >
                      {src.title}
                    </a>
                    , {src.publisher} ({src.year}). <span className="text-muted">Verwendet für: {src.usedFor}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </details>

      <p className="mt-8 pb-24 text-xs sm:pb-6">
        <span className="font-semibold text-ink">delta</span> · Ein Erklär-Tool, kein wissenschaftliches Modell.
      </p>
    </footer>
  )
}
