import type { SliderKey, ScenarioMetrics } from '../model/types'
import type { CountryData } from './countries'
import { formatNumber, formatPercent } from '../lib/format'

/**
 * Labels and metric display of the sliders. The metrics come from the
 * country data, so new benchmark countries work without changes here.
 */
export interface SliderDefinition {
  key: SliderKey
  label: string
  /** Short explanatory text below the title. */
  hint: string
  /** Name of the displayed metric, e.g. "Pünktlichkeit". */
  metricLabel: string
  /** Formatted metric in the scenario. */
  metric: (m: ScenarioMetrics) => string
  /** Formatted metric of a country (for "today → benchmark"). */
  countryMetric: (c: CountryData) => string
}

const headway = (min: number) => `alle ${formatNumber(min, 0)} Min.`

export const SLIDER_DEFINITIONS: SliderDefinition[] = [
  {
    key: 'transit',
    label: 'ÖPNV-Takt & Netzdichte',
    hint: 'Wie oft fahren Bus und Bahn? Die Taktwerte sind Annahmen.',
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
