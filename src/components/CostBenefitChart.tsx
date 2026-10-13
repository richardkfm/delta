import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CostBenefit } from '../model'
import { formatBillions, formatNumber } from '../lib/format'

const tick = { fontSize: 11, fill: 'var(--color-muted)' }

/** Smooth axis ticks (1, 2, 5 × 10ⁿ) from 0 to beyond the maximum, at most 6 intervals. Minimum maximum of 4 billion €, so every step is ≥ 1 billion € (integer labels). */
function niceTicks(max: number): number[] {
  const value = Math.max(max, 4e9)
  const magnitude = 10 ** Math.floor(Math.log10(value / 6))
  const step =
    [1, 2, 5, 10, 20].map((f) => f * magnitude).find((s) => Math.ceil(value / s) <= 6) ?? 20 * magnitude
  return Array.from({ length: Math.ceil(value / step) + 1 }, (_, i) => i * step)
}

export function CostBenefitChart({ data }: { data: CostBenefit }) {
  const { timeline, breakEvenYear } = data
  const hasEffect = timeline.some((p) => p.cumulativeCost > 0 || p.cumulativeBenefit > 0)
  const horizon = timeline.length > 0 ? timeline[timeline.length - 1].year : 30

  const yTicks = niceTicks(Math.max(0, ...timeline.map((p) => Math.max(p.cumulativeCost, p.cumulativeBenefit))))

  const ticks: number[] = []
  for (let y = 5; y <= horizon; y += 5) ticks.push(y)

  let summary: React.ReactNode
  if (breakEvenYear !== null) {
    summary = (
      <span className="font-semibold text-accent">
        Break-even nach {breakEvenYear} {breakEvenYear === 1 ? 'Jahr' : 'Jahren'}
      </span>
    )
  } else if (hasEffect) {
    summary = (
      <span className="font-semibold text-ink">
        Kein Break-even innerhalb von {horizon} Jahren
      </span>
    )
  } else {
    summary = <span className="text-muted">Keine Veränderung – Regler bewegen</span>
  }

  return (
    <div>
      <p className="mb-2 text-sm">{summary}</p>
      <div role="img" aria-label="Liniendiagramm: kumulierte Kosten und kumulierter Nutzen in Milliarden Euro über die Jahre ab Baubeginn">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timeline} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[1, horizon]}
              ticks={ticks}
              tickFormatter={(v) => `J. ${v}`}
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              height={36}
              label={{
                value: 'Jahre ab Baubeginn',
                position: 'insideBottom',
                offset: 0,
                fontSize: 11,
                fill: 'var(--color-muted)',
              }}
            />
            <YAxis
              domain={[0, yTicks[yTicks.length - 1]]}
              ticks={yTicks}
              tickFormatter={(v: number) => formatNumber(v / 1e9, 0)}
              tick={tick}
              tickLine={false}
              axisLine={false}
              width={36}
              label={{
                value: 'Mrd. €',
                position: 'insideTopLeft',
                offset: 0,
                dy: -18,
                dx: 4,
                fontSize: 11,
                fill: 'var(--color-muted)',
              }}
            />
            <Tooltip
              formatter={(v) => formatBillions(Number(v))}
              labelFormatter={(l) => `Jahr ${l}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid var(--color-line)',
                boxShadow: 'none',
              }}
              labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
            />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, paddingLeft: 36, top: -4 }}
            />
            {breakEvenYear !== null && (
              <ReferenceLine
                x={breakEvenYear}
                stroke="var(--color-accent)"
                strokeDasharray="4 3"
                label={{
                  value: `Break-even: Jahr ${breakEvenYear}`,
                  position: breakEvenYear > horizon * 0.6 ? 'insideTopRight' : 'insideTopLeft',
                  fontSize: 11,
                  fill: 'var(--color-accent)',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="cumulativeCost"
              name="Kumulierte Kosten"
              stroke="var(--color-muted)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="cumulativeBenefit"
              name="Kumulierter Nutzen"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
