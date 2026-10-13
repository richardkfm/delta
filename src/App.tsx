import { useEffect, useMemo, useState } from 'react'
import { ASSUMPTIONS } from './config/assumptions'
import { BENCHMARKS, GERMANY, getBenchmark } from './config/countries'
import { Footer } from './components/Footer'
import { HeadlineNumbers } from './components/HeadlineNumbers'
import { MobilityRadius } from './components/MobilityRadius'
import { ProfilePanel } from './components/ProfilePanel'
import { SliderPanel } from './components/SliderPanel'
import { StatePanel } from './components/StatePanel'
import { useAnimatedNumber } from './hooks/useAnimatedNumber'
import { formatEuro, formatNumber } from './lib/format'
import { parseState, serializeState, type AppState } from './lib/urlState'
import { computeScenario, SLIDER_KEYS, type Sliders } from './model'

export default function App() {
  const [state, setState] = useState<AppState>(() => parseState(window.location.search))
  const [copied, setCopied] = useState(false)

  const bench = getBenchmark(state.benchmarkId)
  const result = useMemo(
    () => computeScenario(bench, state.sliders, state.profile),
    [bench, state.sliders, state.profile],
  )

  // Szenario in die URL schreiben, damit es per Link teilbar ist.
  useEffect(() => {
    const query = serializeState(state)
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
  }, [state])

  const setSlider = (key: keyof Sliders, value: number) =>
    setState((s) => ({ ...s, sliders: { ...s.sliders, [key]: value } }))

  const setPreset = (value: 0 | 1) =>
    setState((s) => ({
      ...s,
      sliders: Object.fromEntries(SLIDER_KEYS.map((k) => [k, value])) as unknown as Sliders,
    }))

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'delta – Verkehrs-Simulator', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Abbruch durch Nutzer oder fehlende Berechtigung – nichts zu tun.
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-10">
      <header>
        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl font-bold tracking-tight">
            <span className="text-accent">Δ</span> delta
          </p>
          <button
            type="button"
            onClick={share}
            className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            {copied ? 'Link kopiert ✓' : 'Szenario teilen'}
          </button>
        </div>
        <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Was wäre, wenn Bus, Bahn und Rad in Deutschland so gut wären wie{' '}
          <label className="sr-only" htmlFor="vergleichsland">
            Vergleichsland
          </label>
          <select
            id="vergleichsland"
            value={bench.id}
            onChange={(e) => setState((s) => ({ ...s, benchmarkId: e.target.value }))}
            className="cursor-pointer rounded-md border-b-2 border-accent bg-accent-soft px-1 text-accent focus:outline-none"
          >
            {BENCHMARKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.inName}
              </option>
            ))}
          </select>
          ?
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Schieb die Regler von „{GERMANY.name} heute“ bis „{bench.name}-Niveau“ und sieh, was du an Zeit und Geld
          sparst – und was es den Staat kostet.
        </p>
      </header>

      <div className="mt-8">
        <ProfilePanel profile={state.profile} onChange={(profile) => setState((s) => ({ ...s, profile }))} />
      </div>

      {/* Mobil: Zahlen → Regler → Radius. Desktop: Regler links, Ergebnisse rechts. */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-x-14">
        <div className="lg:col-start-2 lg:row-start-1">
          <HeadlineNumbers time={result.time} money={result.money} profile={state.profile} />
        </div>
        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <SliderPanel
            sliders={state.sliders}
            metrics={result.metrics}
            base={GERMANY}
            bench={bench}
            onChange={setSlider}
            onPreset={setPreset}
          />
        </div>
        <div className="lg:col-start-2 lg:row-start-2">
          <MobilityRadius radius={result.radius} minutes={ASSUMPTIONS.radiusMinutes} />
        </div>
      </div>

      <div className="mt-14 border-t border-line pt-10">
        <StatePanel result={result} />
      </div>

      <section aria-label="Nebeneffekt CO₂" className="mt-10 rounded-xl bg-accent-soft p-4 text-sm">
        <span className="font-semibold text-accent">Nebeneffekt:</span> Im Schnitt{' '}
        <span className="font-semibold tabular-nums">{formatNumber(result.co2KgPerPersonYear, 0)} kg CO₂e</span> weniger
        pro Person und Jahr – durch weniger Autofahrten.
      </section>

      <Footer />

      <StickyBar hours={result.time.totalHoursPerWeek} euros={result.money.totalPerYear} />
    </div>
  )
}

/** Kompakte Leiste unten auf dem Handy, damit die Hauptzahlen beim Regeln sichtbar bleiben. */
function StickyBar({ hours, euros }: { hours: number; euros: number }) {
  const h = useAnimatedNumber(hours)
  const e = useAnimatedNumber(euros)
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur lg:hidden"
      aria-hidden="true"
    >
      <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">Du sparst</span>
        <span className="font-bold text-accent tabular-nums">{formatNumber(h, 1)} Std./Woche</span>
        <span className="font-bold text-accent tabular-nums">{formatEuro(e)}/Jahr</span>
      </div>
    </div>
  )
}
