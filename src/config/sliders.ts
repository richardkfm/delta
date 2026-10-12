import type { SliderKey, ScenarioMetrics } from '../model/types'
import type { CountryData } from './countries'
import { formatNumber, formatPercent } from '../lib/format'

/**
 * Beschriftung und Kennzahl-Anzeige der Regler. Die Kennzahlen kommen aus den
 * Länderdaten, daher funktionieren neue Benchmark-Länder ohne Änderungen hier.
 */
export interface SliderDefinition {
  key: SliderKey
  label: string
  /** Kurzer Erklärtext unter dem Titel. */
  hint: string
  /** Name der angezeigten Kennzahl, z. B. „Pünktlichkeit“. */
  metricLabel: string
  /** Formatierte Kennzahl im Szenario. */
  metric: (m: ScenarioMetrics) => string
  /** Formatierte Kennzahl eines Landes (für „heute → Benchmark“). */
  countryMetric: (c: CountryData) => string
}

const headway = (min: number) => `alle ${formatNumber(min, 0)} Min.`

export const SLIDER_DEFINITIONS: SliderDefinition[] = [
  {
    key: 'transit',
    label: 'ÖPNV-Takt & Netzdichte',
    hint: 'Wie oft fahren Bus und Bahn, wie dicht ist das Netz?',
    metricLabel: 'Ø Takt',
    metric: (m) => headway(m.transitHeadwayMin),
    countryMetric: (c) => headway(c.transitHeadwayMin),
  },
  {
    key: 'rail',
    label: 'Bahn-Pünktlichkeit',
    hint: 'Anteil pünktlicher Züge im Fernverkehr.',
    metricLabel: 'Pünktlichkeit',
    metric: (m) => formatPercent(m.railPunctuality),
    countryMetric: (c) => formatPercent(c.railPunctuality),
  },
  {
    key: 'bike',
    label: 'Radinfrastruktur',
    hint: 'Sichere, durchgängige Radwege.',
    metricLabel: 'Radanteil',
    metric: (m) => `${formatPercent(m.bikeShare)} der Wege`,
    countryMetric: (c) => formatPercent(c.bikeShare),
  },
  {
    key: 'car',
    label: 'Autoabhängigkeit',
    hint: 'Anteil der Wege, die mit dem Auto zurückgelegt werden.',
    metricLabel: 'Autoanteil',
    metric: (m) => `${formatPercent(m.carShare)} der Wege`,
    countryMetric: (c) => formatPercent(c.carShare),
  },
]
