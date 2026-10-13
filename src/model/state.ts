import type { Assumptions } from '../config/assumptions'
import type { CountryData } from '../config/countries'
import type { Improvements, ScenarioMetrics } from './types'

export interface Investment {
  /** Additional bike lane km. */
  bikeLaneKm: number
  /** Additional transit line km. */
  transitLaneKm: number
  /** Rail km to be upgraded. */
  railUpgradeKm: number
  /** Investments per area in €. */
  bikeEur: number
  transitEur: number
  railEur: number
  /** Total investment need in €. */
  totalEur: number
  /** Additional transit operating costs (net of fares) in €/year at full build-out. */
  extraOperatingEurPerYear: number
}

/**
 * Investment need = build-out need × cost per km.
 *
 * - Bike: gap in bike lane km per 1,000 residents × residents × cost/km.
 * - Transit: gap in line km per 100,000 residents × residents × cost/km.
 * - Rail: punctuality gain in percentage points × km per point × cost/km.
 * - Plus ongoing extra costs for the better transit service (net of fares):
 *   operating costs × relative door-to-door speed gain × uncovered share.
 *   Assumption: the service (and thus the effort) grows as much as the speed.
 * The car dependence slider stands for regulatory policy (parking, pricing)
 * and incurs no infrastructure costs.
 */
export function investment(base: CountryData, m: ScenarioMetrics, imp: Improvements, a: Assumptions): Investment {
  const bikeLaneKm = Math.max(0, m.bikeLaneKmPer1000 - base.bikeLaneKmPer1000) * (a.population / 1_000)
  const transitLaneKm = Math.max(0, m.transitLaneKmPer100k - base.transitLaneKmPer100k) * (a.population / 100_000)
  const railUpgradeKm = imp.rail * 100 * a.railUpgradeKmPerPoint

  const bikeEur = bikeLaneKm * a.bikeLaneCostPerKm
  const transitEur = transitLaneKm * a.transitLaneCostPerKm
  const railEur = railUpgradeKm * a.railUpgradeCostPerKm

  const speedGain = base.transitDoorToDoorKmh > 0 ? m.transitDoorToDoorKmh / base.transitDoorToDoorKmh - 1 : 0
  const extraOperatingEurPerYear =
    Math.max(0, speedGain) * a.transitOperatingCostPerYear * a.transitExtraOperatingNetShare

  return {
    bikeLaneKm,
    transitLaneKm,
    railUpgradeKm,
    bikeEur,
    transitEur,
    railEur,
    totalEur: bikeEur + transitEur + railEur,
    extraOperatingEurPerYear,
  }
}

export interface ExternalCostSaving {
  label: string
  eurPerYear: number
}

/**
 * Annual savings in external costs of car traffic (societal costs):
 * external costs × elasticity × relative decline in car trips.
 */
export function externalCostSavings(imp: Improvements, a: Assumptions): ExternalCostSaving[] {
  return a.externalCosts.map((c) => ({
    label: c.label,
    eurPerYear: c.annualEur * c.elasticity * imp.car,
  }))
}

export interface TimelinePoint {
  /** Year from start (1 … horizon). */
  year: number
  /** Cumulative costs (investment + operation) in €. */
  cumulativeCost: number
  /** Cumulative benefit (avoided external costs) in €. */
  cumulativeBenefit: number
}

export interface CostBenefit {
  timeline: TimelinePoint[]
  /** First year in which the cumulative benefit reaches the costs; null = not within the period. */
  breakEvenYear: number | null
}

/**
 * Cumulative costs vs. benefit over the period considered.
 * Investments are spread evenly over the build period. Extra operating costs
 * and benefits grow linearly with build progress during the build period.
 */
export function costBenefit(
  totalInvestment: number,
  extraOperatingPerYear: number,
  annualBenefit: number,
  a: Assumptions,
): CostBenefit {
  const timeline: TimelinePoint[] = []
  let cumulativeCost = 0
  let cumulativeBenefit = 0
  let breakEvenYear: number | null = null
  const buildYears = Math.max(1, a.buildYears)

  for (let year = 1; year <= a.horizonYears; year++) {
    const progress = Math.min(1, year / buildYears)
    const investThisYear = year <= buildYears ? totalInvestment / buildYears : 0
    cumulativeCost += investThisYear + extraOperatingPerYear * progress
    cumulativeBenefit += annualBenefit * progress
    timeline.push({ year, cumulativeCost, cumulativeBenefit })
    const anyEffect = cumulativeCost > 0 || cumulativeBenefit > 0
    if (breakEvenYear === null && anyEffect && cumulativeBenefit >= cumulativeCost) {
      breakEvenYear = year
    }
  }
  return { timeline, breakEvenYear }
}
