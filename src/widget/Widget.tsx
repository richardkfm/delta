import { useMemo, useState } from 'react'
import { ASSUMPTIONS, LOCATION_LABELS, type Location } from '../config/assumptions'
import { GERMANY, getBenchmark } from '../config/countries'
import { Segmented } from '../components/ProfilePanel'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { formatEuro } from '../lib/format'
import { computeScenario } from '../model'
import { CarGauge } from './CarGauge'
import { buildAppLink, parseWidgetState, toAppState, type WidgetState } from './widgetState'

const LOCATIONS = Object.keys(LOCATION_LABELS) as Location[]
const APP_URL = import.meta.env.VITE_DELTA_APP_URL ?? ''

/**
 * Embeddable widget for car owners: chance of giving up the car and the
 * expected savings if transport were as good as in the benchmark country.
 * Meant to run inside an iframe (widget.html).
 */
export function Widget() {
  const [state, setState] = useState<WidgetState>(() => parseWidgetState(window.location.search))

  const app = useMemo(() => toAppState(state), [state])
  const bench = getBenchmark(app.benchmarkId)
  const result = useMemo(() => computeScenario(bench, app.sliders, app.profile), [bench, app])
  const euros = useAnimatedNumber(result.money.totalPerYear)
  const link = buildAppLink(APP_URL, state, window.location.href)
  const levelPct = Math.round(state.level * 100)

  return (
    <main className="flex min-h-screen flex-col gap-3 p-4">
      <header>
        <p className="text-sm font-bold tracking-tight">
          <span className="text-accent">Δ</span> delta
        </p>
        <h1 className="mt-0.5 text-lg font-bold leading-tight tracking-tight">Könntest du dein Auto abschaffen?</h1>
        <p className="text-sm text-muted">Wenn Bus, Bahn und Rad so gut wären wie {bench.inName}.</p>
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
            Ausbau
          </label>
          <span className="text-sm font-semibold text-accent tabular-nums">
            {levelPct} % {bench.name}-Niveau
          </span>
        </div>
        <input
          id="niveau"
          type="range"
          min={0}
          max={100}
          step={1}
          value={levelPct}
          onChange={(e) => setState((s) => ({ ...s, level: Number(e.target.value) / 100 }))}
          aria-valuetext={`${levelPct} Prozent ${bench.name}-Niveau`}
          className="slider"
          style={{ ['--fill' as string]: `${levelPct}%` }}
        />
        <div className="flex justify-between text-xs text-muted">
          <span>
            {GERMANY.flag} {GERMANY.name} heute
          </span>
          <span>
            {bench.flag} {bench.name}
          </span>
        </div>
      </div>

      <section aria-label="Ergebnis" aria-live="polite" className="grid grid-cols-[auto_1fr] items-center gap-x-4">
        <CarGauge
          probability={result.money.carAbolishProbability}
          cap={ASSUMPTIONS.locationFactors[state.location].maxCarAbolishProbability}
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
