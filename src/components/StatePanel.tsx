import { lazy, Suspense } from 'react'
import { formatBillions, formatNumber } from '../lib/format'
import type { ScenarioResult } from '../model'
import { LiveNumber } from './LiveNumber'

// Recharts is large – the chart is loaded lazily so the headline numbers appear immediately.
const CostBenefitChart = lazy(() => import('./CostBenefitChart').then((m) => ({ default: m.CostBenefitChart })))

/** Cards lift a little on hover. */
const CARD =
  'rounded-xl border border-line p-4 transition duration-200 hover:border-accent/40 hover:shadow-[0_6px_20px_-8px_rgb(11_110_79_/_0.35)] motion-safe:hover:-translate-y-0.5'

/** State perspective: investments, avoided external costs, cost-benefit curve. */
export function StatePanel({ result }: { result: ScenarioResult }) {
  const { investment: inv, externalSavings, externalSavingsPerYear, costBenefit } = result
  return (
    <section aria-labelledby="staat-titel">
      <h2 id="staat-titel" className="text-lg font-semibold">
        Und der Staat?
      </h2>
      <p className="text-sm text-muted">
        Was der Ausbau kostet – und welche Folgekosten des Autoverkehrs die Gesellschaft dadurch spart.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className={CARD}>
          <p className="text-sm text-muted">Investitionsbedarf gesamt</p>
          <p className="text-3xl font-bold tabular-nums">
            <LiveNumber value={inv.totalEur} format={formatBillions} />
          </p>
          <ul className="mt-2 space-y-0.5 text-sm text-muted">
            <Item
              label={`Radwege (${formatNumber(inv.bikeLaneKm, 0)} km)`}
              value={formatBillions(inv.bikeEur)}
            />
            <Item
              label={`Straßenbahn (${formatNumber(inv.transitLaneKm, 0)} km)`}
              value={formatBillions(inv.transitEur)}
            />
            <Item
              label={`Schienensanierung (${formatNumber(inv.railUpgradeKm, 0)} km)`}
              value={formatBillions(inv.railEur)}
            />
            <Item label="+ Mehrbetrieb ÖPNV (netto)" value={`${formatBillions(inv.extraOperatingEurPerYear)}/Jahr`} />
          </ul>
        </div>

        <div className={CARD}>
          <p className="text-sm text-muted">Vermiedene Folgekosten (gesellschaftlich)</p>
          <p className="text-3xl font-bold tabular-nums text-accent">
            <LiveNumber value={externalSavingsPerYear} format={formatBillions}>
              <span className="ml-1 text-base font-semibold">/Jahr</span>
            </LiveNumber>
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
