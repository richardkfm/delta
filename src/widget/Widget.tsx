import { useEffect, useMemo, useState } from 'react'
import { ASSUMPTIONS, LOCATION_LABELS, type Location } from '../config/assumptions'
import { GERMANY, getBenchmark, type CountryData } from '../config/countries'
import { Segmented } from '../components/ProfilePanel'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { formatEuro, formatNumber, formatPercent } from '../lib/format'
import { computeScenario, type ScenarioResult } from '../model'
import { CarGauge } from './CarGauge'
import { CountryDumbbell } from './CountryDumbbell'
import { TrainRow } from './TrainRow'
import { buildAppLink, parseWidgetState, toAppState, type WidgetState, type WidgetVariant } from './widgetState'

const LOCATIONS = Object.keys(LOCATION_LABELS) as Location[]
const APP_URL = import.meta.env.VITE_DELTA_APP_URL ?? ''

/** Texts and slider display per variant. */
interface VariantConfig {
  title: string
  subtitle: (bench: CountryData) => string
  sliderLabel: string
  /** Value shown above the slider. */
  sliderValue: (levelPct: number, r: ScenarioResult, bench: CountryData) => string
  /** Labels at both ends of the slider. */
  ends: (bench: CountryData) => [string, string]
}

const countryEnds = (bench: CountryData): [string, string] => [
  `${GERMANY.flag} ${GERMANY.name} heute`,
  `${bench.flag} ${bench.name}`,
]
const levelValue = (levelPct: number, _r: ScenarioResult, bench: CountryData) => `${levelPct} % ${bench.name}-Niveau`

const VARIANTS: Record<WidgetVariant, VariantConfig> = {
  auto: {
    title: 'Könntest du dein Auto abschaffen?',
    subtitle: (bench) => `Wenn Bus, Bahn und Rad so gut wären wie ${bench.inName}.`,
    sliderLabel: 'Ausbau',
    sliderValue: levelValue,
    ends: countryEnds,
  },
  vergleich: {
    title: 'Wie weit liegt Deutschland zurück?',
    subtitle: (bench) => `${GERMANY.name} vs. ${bench.name}: Bahn, Rad und Auto.`,
    sliderLabel: 'Ausbau',
    sliderValue: levelValue,
    ends: countryEnds,
  },
  bahn: {
    title: 'Wie pünktlich wäre dein Zug?',
    subtitle: (bench) => `Wenn die Bahn so pünktlich wäre wie ${bench.inName}.`,
    sliderLabel: 'Bahn-Pünktlichkeit',
    sliderValue: (_l, r) => `${formatPercent(r.metrics.railPunctuality)} pünktlich`,
    ends: (bench) => [
      `${GERMANY.flag} heute ${formatPercent(GERMANY.railPunctuality)}`,
      `${bench.flag} ${formatPercent(bench.railPunctuality)}`,
    ],
  },
}

/**
 * Embeddable widget (widget.html), meant to run inside an iframe. The
 * variant is chosen with the `v` parameter; see widgetState.ts.
 */
export function Widget() {
  const [state, setState] = useState<WidgetState>(() => parseWidgetState(window.location.search))

  const app = useMemo(() => toAppState(state), [state])
  const bench = getBenchmark(app.benchmarkId)
  const result = useMemo(() => computeScenario(bench, app.sliders, app.profile), [bench, app])
  const link = buildAppLink(APP_URL, state, window.location.href)
  const levelPct = Math.round(state.level * 100)
  const v = VARIANTS[state.variant]
  const [startLabel, endLabel] = v.ends(bench)
  const sliderValue = v.sliderValue(levelPct, result, bench)

  useEffect(() => {
    document.title = `delta – ${v.title}`
  }, [v.title])

  return (
    <main className="flex min-h-screen flex-col gap-3 p-4">
      <header>
        <p className="text-sm font-bold tracking-tight">
          <span className="text-accent">Δ</span> delta
        </p>
        <h1 className="mt-0.5 text-lg font-bold leading-tight tracking-tight">{v.title}</h1>
        <p className="text-sm text-muted">{v.subtitle(bench)}</p>
      </header>

      <fieldset>
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Du wohnst in der</legend>
        <Segmented
          name="lage"
          options={LOCATIONS.map((l) => ({ value: l, label: LOCATION_LABELS[l] }))}
          value={state.location}
          onChange={(location) => setState((s) => ({ ...s, location }))}
        />
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="niveau" className="text-xs font-medium uppercase tracking-wide text-muted">
            {v.sliderLabel}
          </label>
          <span className="text-sm font-semibold text-accent tabular-nums">{sliderValue}</span>
        </div>
        <input
          id="niveau"
          type="range"
          min={0}
          max={100}
          step={1}
          value={levelPct}
          onChange={(e) => setState((s) => ({ ...s, level: Number(e.target.value) / 100 }))}
          aria-valuetext={sliderValue}
          className="slider"
          style={{ ['--fill' as string]: `${levelPct}%` }}
        />
        <div className="flex justify-between text-xs text-muted">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </div>

      {state.variant === 'auto' && <AutoResult result={result} location={state.location} />}
      {state.variant === 'vergleich' && <VergleichResult result={result} bench={bench} />}
      {state.variant === 'bahn' && <BahnResult result={result} />}

      <footer className="mt-auto flex flex-col items-start gap-1.5 border-t border-line pt-3">
        <a
          href={link}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ganzes Szenario ansehen →
        </a>
        <span className="text-xs text-muted">Vereinfachtes Modell, keine Prognose. Annahmen und Quellen im Szenario.</span>
      </footer>
    </main>
  )
}

/** Variant "auto": chance of giving up the car and expected savings. */
function AutoResult({ result, location }: { result: ScenarioResult; location: Location }) {
  const euros = useAnimatedNumber(result.money.totalPerYear)
  return (
    <section aria-label="Ergebnis" aria-live="polite" className="grid grid-cols-[auto_1fr] items-center gap-x-4">
      <CarGauge
        probability={result.money.carAbolishProbability}
        cap={ASSUMPTIONS.locationFactors[location].maxCarAbolishProbability}
      />
      <div>
        <p className="text-sm text-muted">Du sparst im Schnitt</p>
        <p className="text-3xl font-bold tracking-tight text-accent tabular-nums">{formatEuro(euros)}</p>
        <p className="text-sm text-muted">pro Jahr</p>
        <p className="mt-1 text-xs text-muted">
          Fällt das Auto weg:{' '}
          <span className="whitespace-nowrap">{formatEuro(result.money.savingsIfCarAbolished)}/Jahr</span> (Autokosten
          minus Deutschlandticket).
        </p>
      </div>
    </section>
  )
}

/** Variant "vergleich": key metrics Germany vs. benchmark, plus time saved. */
function VergleichResult({ result, bench }: { result: ScenarioResult; bench: CountryData }) {
  const hours = useAnimatedNumber(result.time.totalHoursPerWeek)
  return (
    <section aria-label="Ergebnis" aria-live="polite" className="flex flex-col gap-2">
      <CountryDumbbell base={GERMANY} bench={bench} metrics={result.metrics} />
      <div>
        <p className="text-sm text-muted">Du sparst im Schnitt</p>
        <p className="text-sm text-muted">
          <span className="text-3xl font-bold tracking-tight text-accent tabular-nums">{formatNumber(hours, 1)} Std.</span>{' '}
          pro Woche
        </p>
      </div>
    </section>
  )
}

/** Variant "bahn": punctual trains out of ten and buffer time saved. */
function BahnResult({ result }: { result: ScenarioResult }) {
  const minutes = useAnimatedNumber(result.time.bufferMin)
  return (
    <section aria-label="Ergebnis" aria-live="polite" className="flex flex-col gap-3">
      <TrainRow punctuality={result.metrics.railPunctuality} />
      <div>
        <p className="text-sm text-muted">Du sparst im Schnitt</p>
        <p className="text-sm text-muted">
          <span className="text-3xl font-bold tracking-tight text-accent tabular-nums">{formatNumber(minutes, 0)} Min.</span>{' '}
          pro Woche
        </p>
        <p className="mt-1 text-xs text-muted">Du musst weniger Zeitpuffer für Verspätungen einplanen.</p>
      </div>
    </section>
  )
}
