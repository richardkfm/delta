import type { MobilityRadius as Radius } from '../model'
import { useSettledChange } from '../hooks/useSettledChange'
import { formatKm, formatNumber } from '../lib/format'

const SIZE = 240
const C = SIZE / 2
const R_MAX = 108
const MIN_LABEL_OFFSET = 30

const halo = {
  paintOrder: 'stroke',
  stroke: 'var(--color-paper)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
} as const

export function MobilityRadius({ radius, minutes }: { radius: Radius; minutes: number }) {
  const { today, scenario, areaGainPct } = radius
  const maxKm = Math.max(today.bestKm, scenario.bestKm)
  const scale = maxKm > 0 ? R_MAX / maxKm : 0
  const rToday = today.bestKm * scale
  const rScenario = scenario.bestKm * scale
  // Replays the ripple once the scenario radius has settled on a new value.
  const ripple = useSettledChange(scenario.bestKm)

  const transitBest = scenario.transitKm >= scenario.bikeKm
  const bestLabel = transitBest ? 'ÖPNV' : 'Rad'
  const otherLabel = transitBest ? 'Rad' : 'ÖPNV'
  const bestKm = transitBest ? scenario.transitKm : scenario.bikeKm
  const otherKm = transitBest ? scenario.bikeKm : scenario.transitKm

  const ariaLabel = `Erreichbarer Radius in ${minutes} Minuten ohne Auto: heute ${formatKm(today.bestKm)}, im Szenario ${formatKm(scenario.bestKm)}.`

  const todayX = C - Math.max(rToday / 2, MIN_LABEL_OFFSET)
  const scenarioX = C + Math.max(rScenario / 2, MIN_LABEL_OFFSET)

  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">
        Wie weit komme ich in {minutes} Minuten ohne Auto?
      </h3>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={ariaLabel}
        className="mx-auto mt-3 block h-auto w-full max-w-[260px]"
      >
        {ripple > 0 && rScenario > 0 && (
          <circle
            key={ripple}
            className="radius-ripple"
            cx={C}
            cy={C}
            r={rScenario}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={3}
          />
        )}
        <g className="radius-grow">
          <circle
            cx={C}
            cy={C}
            r={rScenario}
            fill="var(--color-accent)"
            fillOpacity={0.12}
            stroke="var(--color-accent)"
            strokeWidth={2}
            style={{ transition: 'r 300ms ease' }}
          />
          <circle
            cx={C}
            cy={C}
            r={rToday}
            fill="var(--color-muted)"
            fillOpacity={0.04}
            stroke="var(--color-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            style={{ transition: 'r 300ms ease' }}
          />

          <line
            x1={C}
            y1={C}
            x2={C - rToday}
            y2={C}
            stroke="var(--color-muted)"
            strokeWidth={1}
            style={{ transition: 'x2 300ms ease' }}
          />
          <line
            x1={C}
            y1={C}
            x2={C + rScenario}
            y2={C}
            stroke="var(--color-accent)"
            strokeWidth={1}
            style={{ transition: 'x2 300ms ease' }}
          />
        </g>

        <text x={todayX} y={C - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-muted)" style={halo}>
          {formatKm(today.bestKm)}
        </text>
        <text x={scenarioX} y={C - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-accent)" style={halo}>
          {formatKm(scenario.bestKm)}
        </text>

        <circle cx={C} cy={C} r={3.5} fill="var(--color-ink)" />
        <text x={C} y={C + 17} textAnchor="middle" fontSize={11} fill="var(--color-ink)" style={halo}>
          Du
        </text>
      </svg>

      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-ink">
        <li className="flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="21" y2="4" stroke="var(--color-muted)" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <span>Heute: {formatKm(today.bestKm)}</span>
        </li>
        <li className="flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="21" y2="4" stroke="var(--color-accent)" strokeWidth="2.5" />
          </svg>
          <span>Szenario: {formatKm(scenario.bestKm)}</span>
        </li>
      </ul>

      {areaGainPct > 0.5 && (
        <p className="mt-2 text-center text-sm font-semibold text-accent">
          +{formatNumber(areaGainPct, 0)} % erreichbare Fläche
        </p>
      )}

      <p className="mt-2 text-center text-xs text-muted">
        Schnellste Option im Szenario: {bestLabel} ({formatKm(bestKm)}) · {otherLabel}: {formatKm(otherKm)}
      </p>
    </section>
  )
}
