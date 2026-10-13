import type { CountryData } from '../config/countries'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { formatPercent } from '../lib/format'
import type { ScenarioMetrics } from '../model'

interface Props {
  base: CountryData
  bench: CountryData
  metrics: ScenarioMetrics
}

interface Row {
  label: string
  today: number
  bench: number
  scenario: number
}

/**
 * Dumbbell chart of three shares on one common 0–100 % axis: today (gray
 * dot), benchmark country (ring) and the current scenario (filled dot).
 * The transit headway is left out: it has a different unit and is an
 * assumption, not a sourced value.
 */
export function CountryDumbbell({ base, bench, metrics }: Props) {
  const rows: Row[] = [
    { label: 'Wege mit dem Auto', today: base.carShare, bench: bench.carShare, scenario: metrics.carShare },
    {
      label: 'Pünktliche Fernzüge',
      today: base.railPunctuality,
      bench: bench.railPunctuality,
      scenario: metrics.railPunctuality,
    },
    { label: 'Wege mit dem Rad', today: base.bikeShare, bench: bench.bikeShare, scenario: metrics.bikeShare },
  ]

  return (
    <figure>
      <figcaption className="mb-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Dot kind="today" inline /> heute
        </span>
        <span className="inline-flex items-center gap-1">
          <Dot kind="bench" inline /> {bench.name}
        </span>
        <span className="inline-flex items-center gap-1">
          <Dot kind="scenario" inline /> Szenario
        </span>
      </figcaption>
      <ul className="space-y-1">
        {rows.map((r) => (
          <DumbbellRow key={r.label} row={r} baseName={base.name} benchName={bench.name} />
        ))}
      </ul>
      <div className="mt-0.5 flex justify-between text-[10px] text-muted tabular-nums" aria-hidden="true">
        <span>0 %</span>
        <span>50 %</span>
        <span>100 %</span>
      </div>
    </figure>
  )
}

function DumbbellRow({ row, baseName, benchName }: { row: Row; baseName: string; benchName: string }) {
  const scenario = useAnimatedNumber(row.scenario)
  const lo = Math.min(row.today, row.bench)
  const hi = Math.max(row.today, row.bench)
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-ink">{row.label}</span>
        <span className="font-semibold text-ink tabular-nums">{formatPercent(row.scenario)}</span>
      </div>
      <div
        className="relative h-4"
        role="img"
        aria-label={`${row.label}: ${baseName} heute ${formatPercent(row.today)}, ${benchName} ${formatPercent(row.bench)}, dein Szenario ${formatPercent(row.scenario)}`}
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent-soft"
          style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }}
        />
        <Dot kind="today" at={row.today} title={`${baseName} heute: ${formatPercent(row.today)}`} />
        <Dot kind="bench" at={row.bench} title={`${benchName}: ${formatPercent(row.bench)}`} />
        <Dot kind="scenario" at={scenario} title={`Dein Szenario: ${formatPercent(row.scenario)}`} />
      </div>
    </li>
  )
}

const DOT_CLASS = {
  today: 'h-2.5 w-2.5 bg-muted',
  bench: 'h-2.5 w-2.5 border-2 border-accent bg-paper',
  scenario: 'h-3 w-3 bg-accent ring-2 ring-paper',
} as const

function Dot({
  kind,
  at,
  title,
  inline,
}: {
  kind: keyof typeof DOT_CLASS
  at?: number
  title?: string
  inline?: boolean
}) {
  if (inline) return <span className={`inline-block rounded-full ${DOT_CLASS[kind]}`} aria-hidden="true" />
  return (
    <span
      title={title}
      className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${DOT_CLASS[kind]}`}
      style={{ left: `${(at ?? 0) * 100}%` }}
    />
  )
}
