import type { CountryData } from '../config/countries'
import { SLIDER_DEFINITIONS } from '../config/sliders'
import type { ScenarioMetrics, SliderKey, Sliders } from '../model/types'

interface Props {
  sliders: Sliders
  metrics: ScenarioMetrics
  base: CountryData
  bench: CountryData
  onChange: (key: SliderKey, value: number) => void
  onPreset: (value: 0 | 1) => void
}

export function SliderPanel({ sliders, metrics, base, bench, onChange, onPreset }: Props) {
  const allZero = Object.values(sliders).every((v) => v === 0)
  const allOne = Object.values(sliders).every((v) => v === 1)

  return (
    <section aria-labelledby="regler-titel">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="regler-titel" className="text-lg font-semibold">
          Stell dir vor …
        </h2>
        <div className="grid w-full grid-cols-2 gap-2 text-sm sm:flex sm:w-auto" role="group" aria-label="Voreinstellungen">
          <PresetButton active={allZero} onClick={() => onPreset(0)}>
            Deutschland heute
          </PresetButton>
          <PresetButton active={allOne} onClick={() => onPreset(1)}>
            Volles {bench.name}-Niveau
          </PresetButton>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {SLIDER_DEFINITIONS.map((def) => {
          const pct = Math.round(sliders[def.key] * 100)
          const id = `regler-${def.key}`
          return (
            <div key={def.key}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="font-medium">
                  {def.label}
                </label>
                <span className="text-sm tabular-nums text-muted whitespace-nowrap">{pct} %</span>
              </div>
              <p className="text-sm text-muted">{def.hint}</p>
              <p className="mt-1 text-sm font-semibold text-accent tabular-nums">
                {def.metricLabel}: {def.metric(metrics)}
              </p>
              <input
                id={id}
                type="range"
                className="slider mt-1"
                min={0}
                max={100}
                step={1}
                value={pct}
                style={{ ['--fill' as string]: `${pct}%` }}
                aria-valuetext={`${pct} Prozent, ${def.metricLabel}: ${def.metric(metrics)}`}
                onChange={(e) => onChange(def.key, Number(e.target.value) / 100)}
              />
              <div className="flex items-baseline justify-between gap-3 text-xs text-muted tabular-nums">
                <span>
                  {base.flag} heute: {def.countryMetric(base)}
                </span>
                <span className="text-right">
                  {bench.name}: {def.countryMetric(bench)} {bench.flag}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 leading-tight transition-colors ${
        active ? 'border-accent bg-accent text-white' : 'border-line hover:border-accent hover:text-accent'
      }`}
    >
      {children}
    </button>
  )
}
