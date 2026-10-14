import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { formatPercent } from '../lib/format'

interface Props {
  /** Probability of giving up the car, 0–1. */
  probability: number
  /** Highest probability reachable at the current location, 0–1. */
  cap: number
}

// Semicircle from left to right; pathLength=100 makes dash lengths percentages.
const ARC = 'M 10 62 A 50 50 0 0 1 110 62'

/**
 * Semicircle gauge for the chance of giving up the car. The light band marks
 * what is reachable at the location (full benchmark level), the dark arc the
 * current value.
 */
export function CarGauge({ probability, cap }: Props) {
  const p = useAnimatedNumber(probability)
  const label = `Chance, das Auto abzuschaffen: ${formatPercent(probability)} (höchstens ${formatPercent(cap)} an diesem Wohnort)`
  return (
    <figure className="w-28">
      <svg viewBox="0 0 120 70" role="img" aria-label={label} className="block w-full">
        <path d={ARC} pathLength={100} fill="none" strokeWidth={12} className="stroke-line" />
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          strokeWidth={12}
          strokeDasharray={`${cap * 100} 100`}
          className="stroke-accent-soft"
        />
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          strokeWidth={12}
          strokeDasharray={`${Math.max(0, p) * 100} 100`}
          className="stroke-accent"
        />
        <text x={60} y={60} textAnchor="middle" className="fill-ink text-[22px] font-bold tabular-nums">
          {formatPercent(p)}
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs leading-tight text-muted">Chance, das Auto abzuschaffen</figcaption>
    </figure>
  )
}
