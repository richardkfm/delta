import { formatPercent } from '../lib/format'

interface Props {
  /** Share of punctual trains, 0–1. */
  punctuality: number
}

const TRAINS = 10

/** Unit chart: how many of ten trains arrive on time. */
export function TrainRow({ punctuality }: Props) {
  const onTime = Math.round(punctuality * TRAINS)
  return (
    <figure>
      <div
        className="grid grid-cols-10 gap-1"
        role="img"
        aria-label={`${onTime} von ${TRAINS} Zügen pünktlich (${formatPercent(punctuality)})`}
      >
        {Array.from({ length: TRAINS }, (_, i) => (
          <TrainIcon key={i} late={i >= onTime} />
        ))}
      </div>
      <figcaption className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          <span className="font-semibold text-ink tabular-nums">
            {onTime} von {TRAINS}
          </span>{' '}
          Fernzügen pünktlich
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-muted" aria-hidden="true" /> verspätet
        </span>
      </figcaption>
    </figure>
  )
}

/** Simple front view of a train; filled when punctual, outlined when late. */
function TrainIcon({ late }: { late: boolean }) {
  return (
    <svg
      viewBox="0 0 24 30"
      aria-hidden="true"
      className={`block w-full transition-colors duration-300 ${late ? 'text-muted' : 'text-accent'}`}
    >
      <rect
        x={3}
        y={1.5}
        width={18}
        height={22}
        rx={5}
        fill={late ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={late ? 1.5 : 0}
      />
      <rect x={6} y={5} width={12} height={7} rx={1.5} className={late ? 'fill-line' : 'fill-paper'} />
      <circle cx={8} cy={18} r={1.6} className={late ? 'fill-muted' : 'fill-paper'} />
      <circle cx={16} cy={18} r={1.6} className={late ? 'fill-muted' : 'fill-paper'} />
      <path d="M7 24.5 L4.5 28.5 M17 24.5 L19.5 28.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}
