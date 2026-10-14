import { ASSUMPTIONS, type Assumptions } from '../config/assumptions'
import { GERMANY, type CountryData } from '../config/countries'
import { co2SavingsKgPerPersonYear } from './co2'
import { improvements, scenarioMetrics } from './interpolate'
import { moneySavings, timeSavings, type MoneySavings, type TimeSavings } from './personal'
import { mobilityRadius, type MobilityRadius } from './radius'
import { costBenefit, externalCostSavings, investment, type CostBenefit, type ExternalCostSaving, type Investment } from './state'
import type { Improvements, Profile, ScenarioMetrics, Sliders } from './types'

export * from './types'
export * from './interpolate'
export * from './personal'
export * from './radius'
export * from './state'
export * from './co2'

export interface ScenarioResult {
  metrics: ScenarioMetrics
  improvements: Improvements
  time: TimeSavings
  money: MoneySavings
  radius: MobilityRadius
  investment: Investment
  externalSavings: ExternalCostSaving[]
  /** Total of avoided external costs in €/year. */
  externalSavingsPerYear: number
  costBenefit: CostBenefit
  co2KgPerPersonYear: number
}

/** Computes all results of a scenario. Pure function without side effects. */
export function computeScenario(
  bench: CountryData,
  sliders: Sliders,
  profile: Profile,
  a: Assumptions = ASSUMPTIONS,
  base: CountryData = GERMANY,
): ScenarioResult {
  const metrics = scenarioMetrics(base, bench, sliders)
  const imp = improvements(base, metrics)
  const time = timeSavings(imp, profile, base.railPunctuality, a)
  const money = moneySavings(imp, profile, a)
  const radius = mobilityRadius(base, metrics, profile, a)
  const inv = investment(base, metrics, imp, a)
  const externalSavings = externalCostSavings(imp, a)
  const externalSavingsPerYear = externalSavings.reduce((sum, e) => sum + e.eurPerYear, 0)
  return {
    metrics,
    improvements: imp,
    time,
    money,
    radius,
    investment: inv,
    externalSavings,
    externalSavingsPerYear,
    costBenefit: costBenefit(inv.totalEur, inv.extraOperatingEurPerYear, externalSavingsPerYear, a),
    co2KgPerPersonYear: co2SavingsKgPerPersonYear(imp, a),
  }
}
