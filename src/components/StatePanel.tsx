import { lazy, Suspense } from 'react'
import { formatBillions, formatNumber } from '../lib/format'
import type { ScenarioResult } from '../model'

// Recharts ist groß – das Diagramm wird nachgeladen, damit die Hauptzahlen sofort erscheinen.
const CostBenefitChart = lazy(() => import('./CostBenefitChart').then((m) => ({ default: m.CostBenefitChart })))

/** Staatsperspektive: Investitionen, vermiedene Folgekosten, Kosten-Nutzen-Verlauf. */
export function StatePanel({ result }: { result: ScenarioResult }) {
  const { investment: inv, externalSavings, externalSavingsPerYear, costBenefit } = result
  return (
    <section aria-labelledby="staat-titel">
      <h2 id="staat-titel" className="text-lg font-semibold">
        Und der Staat?
      </h2>
      <p className="text-sm text-muted">Was der Ausbau kostet – und was er an Folgekosten des Autoverkehrs spart.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <p className="text-sm text-muted">Investitionsbedarf gesamt</p>
          <p className="text-3xl font-bold tabular-nums">{formatBillions(inv.totalEur)}</p>
          <ul className="mt-2 space-y-0.5 text-sm text-muted">
            <Item
              label={`Radwege (${formatNumber(inv.bikeLaneKm, 0)} km)`}
              value={formatBillions(inv.bikeEur)}
            />
            <Item
              label={`ÖPNV-Trassen (${formatNumber(inv.transitLaneKm, 0)} km)`}
              value={formatBillions(inv.transitEur)}
            />
            <Item
              label={`Schiene (${formatNumber(inv.railUpgradeKm, 0)} km)`}
              value={formatBillions(inv.railEur)}
            />
            <Item label="+ Betrieb dichterer Takt" value={`${formatBillions(inv.extraOperatingEurPerYear)}/Jahr`} />
          </ul>
        </div>

        <div className="rounded-xl border border-line p-4">
          <p className="text-sm text-muted">Eingesparte Folgekosten</p>
          <p className="text-3xl font-bold tabular-nums text-accent">
            {formatBillions(externalSavingsPerYear)}
            <span className="ml-1 text-base font-semibold">/Jahr</span>
          </p>
          <ul className="mt-2 space-y-0.5 text-sm text-muted">
            {externalSavings.map((e) => (
              <Item key={e.label} label={e.label} value={formatBillions(e.eurPerYear)} />
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Kumulierte Kosten und Nutzen über 30 Jahre</h3>
        <div className="mt-2">
          <Suspense fallback={<div className="h-[264px]" aria-hidden="true" />}>
            <CostBenefitChart data={costBenefit} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="tabular-nums whitespace-nowrap text-ink">{value}</span>
    </li>
  )
}
