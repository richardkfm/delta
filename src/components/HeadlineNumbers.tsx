import { ASSUMPTIONS } from '../config/assumptions'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { formatEuro, formatNumber, formatPercent } from '../lib/format'
import type { MoneySavings, Profile, TimeSavings } from '../model'

interface Props {
  time: TimeSavings
  money: MoneySavings
  profile: Profile
}

/** Die beiden Hauptzahlen: Zeit pro Woche und Geld pro Jahr, animiert. */
export function HeadlineNumbers({ time, money, profile }: Props) {
  const hours = useAnimatedNumber(time.totalHoursPerWeek)
  const euros = useAnimatedNumber(money.totalPerYear)

  return (
    <section aria-label="Deine Ersparnis" className="grid gap-6 sm:grid-cols-2" aria-live="polite">
      <div>
        <p className="text-sm text-muted">Du sparst</p>
        <p className="text-5xl font-bold tracking-tight text-accent tabular-nums sm:text-6xl">
          {formatNumber(hours, 1)}
          <span className="ml-2 text-2xl font-semibold sm:text-3xl">Std.</span>
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
          {formatEuro(euros)}
        </p>
        <p className="text-sm text-muted">pro Jahr (Erwartungswert)</p>
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
        <Row
          label={`Zeitgewinn (${formatNumber(ASSUMPTIONS.valueOfTimePerHour, 0)} €/Std.)`}
          value={formatEuro(money.timeValuePerYear)}
        />
        <li className="pt-1">Ohne Auto gibt es keinen Autoeffekt.</li>
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
