import { ASSUMPTIONS } from '../config/assumptions'
import { formatEuro, formatNumber, formatPercent } from '../lib/format'
import type { MoneySavings, Profile, TimeSavings } from '../model'
import { LiveNumber } from './LiveNumber'

interface Props {
  time: TimeSavings
  money: MoneySavings
  profile: Profile
}

/** The two headline numbers: time per week and money per year, animated. */
export function HeadlineNumbers({ time, money, profile }: Props) {
  return (
    <section aria-label="Deine Ersparnis" className="grid gap-6 sm:grid-cols-2" aria-live="polite">
      <div>
        <p className="text-sm text-muted">Du sparst</p>
        <p className="text-5xl font-bold tracking-tight text-accent tabular-nums sm:text-6xl">
          <LiveNumber value={time.totalHoursPerWeek} format={(h) => formatNumber(h, 1)}>
            <span className="ml-2 text-2xl font-semibold sm:text-3xl">Std.</span>
          </LiveNumber>
        </p>
        <p className="text-sm text-muted">pro Woche</p>
        <ul className="mt-3 space-y-0.5 text-sm text-muted">
          <Row label="Kürzere Pendelzeit (ÖPNV)" value={`${formatNumber(time.commuteMin, 0)} Min.`} />
          <Row label="Weniger Pufferzeit (Bahn)" value={`${formatNumber(time.bufferMin, 0)} Min.`} />
          <Row label="Kürzere Alltagswege (Rad)" value={`${formatNumber(time.everydayMin, 0)} Min.`} />
        </ul>
      </div>

      <div>
        <p className="text-sm text-muted">Du sparst</p>
        <p className="text-5xl font-bold tracking-tight text-accent tabular-nums sm:text-6xl">
          <LiveNumber value={money.totalPerYear} format={formatEuro} />
        </p>
        <p className="text-sm text-muted">{profile.cars === 0 ? 'pro Jahr' : 'pro Jahr (Erwartungswert)'}</p>
        <MoneyDetails money={money} profile={profile} />
      </div>
    </section>
  )
}

function MoneyDetails({ money, profile }: { money: MoneySavings; profile: Profile }) {
  if (profile.cars === 0) {
    return (
      <ul className="mt-3 space-y-0.5 text-sm text-muted">
        <Row label="Weniger Taxi, Carsharing & Co." value={formatEuro(money.betterServicePerYear)} />
        <li className="pt-1">Ohne Auto gibt es keinen Autoeffekt. Deine gesparte Zeit zählt links, nicht als Geld.</li>
      </ul>
    )
  }
  const which = profile.cars >= 2 ? 'den Zweitwagen' : 'dein Auto'
  return (
    <ul className="mt-3 space-y-0.5 text-sm text-muted">
      <Row
        label={`Chance, dass du ${which} abschaffst`}
        value={formatPercent(money.carAbolishProbability)}
      />
      <Row label="Ersparnis, wenn es klappt" value={`${formatEuro(money.savingsIfCarAbolished)}/Jahr`} />
      <li className="pt-1">
        Auto-Vollkosten {formatEuro(ASSUMPTIONS.carFullCostPerMonth)} minus Ticket{' '}
        {formatEuro(ASSUMPTIONS.transitTicketPerMonth)} pro Monat.
      </li>
    </ul>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-line/70 py-0.5">
      <span>{label}</span>
      <span className="tabular-nums whitespace-nowrap text-ink">{value}</span>
    </li>
  )
}
