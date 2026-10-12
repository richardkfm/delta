import type { Assumptions } from '../config/assumptions'
import type { CountryData } from '../config/countries'
import type { Improvements, ScenarioMetrics } from './types'

export interface Investment {
  /** Zusätzliche Radweg-km. */
  bikeLaneKm: number
  /** Zusätzliche ÖPNV-Trassen-km. */
  transitLaneKm: number
  /** Zu ertüchtigende Schienen-km. */
  railUpgradeKm: number
  /** Investitionen je Bereich in €. */
  bikeEur: number
  transitEur: number
  railEur: number
  /** Investitionsbedarf gesamt in €. */
  totalEur: number
  /** Zusätzliche ÖPNV-Betriebskosten (netto) in €/Jahr bei vollem Ausbau. */
  extraOperatingEurPerYear: number
}

/**
 * Investitionsbedarf = Ausbaubedarf × Kosten pro km.
 *
 * - Rad: Lücke bei Radweg-km je 1.000 Einw. × Einwohner × Kosten/km.
 * - ÖPNV: Lücke bei Trassen-km je 100.000 Einw. × Einwohner × Kosten/km.
 * - Bahn: Pünktlichkeitsgewinn in Prozentpunkten × km je Punkt × Kosten/km.
 * - Dazu laufende Mehrkosten für dichteren Takt (netto nach Mehreinnahmen):
 *   Betriebskosten × (Takt_DE / Takt_Szenario − 1) × Netto-Anteil.
 * Der Regler Autoabhängigkeit steht für Ordnungspolitik (Parkraum, Pricing)
 * und verursacht keine Infrastrukturkosten.
 */
export function investment(base: CountryData, m: ScenarioMetrics, imp: Improvements, a: Assumptions): Investment {
  const bikeLaneKm = Math.max(0, m.bikeLaneKmPer1000 - base.bikeLaneKmPer1000) * (a.population / 1_000)
  const transitLaneKm = Math.max(0, m.transitLaneKmPer100k - base.transitLaneKmPer100k) * (a.population / 100_000)
  const railUpgradeKm = imp.rail * 100 * a.railUpgradeKmPerPoint

  const bikeEur = bikeLaneKm * a.bikeLaneCostPerKm
  const transitEur = transitLaneKm * a.transitLaneCostPerKm
  const railEur = railUpgradeKm * a.railUpgradeCostPerKm

  const headwayRatio = m.transitHeadwayMin > 0 ? base.transitHeadwayMin / m.transitHeadwayMin : 1
  const extraOperatingEurPerYear =
    Math.max(0, headwayRatio - 1) * a.transitOperatingCostPerYear * a.transitExtraOperatingNetShare

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
 * Jährliche Einsparung bei Folgekosten des Autoverkehrs:
 * Folgekosten × Elastizität × relativer Rückgang der Autofahrten.
 */
export function externalCostSavings(imp: Improvements, a: Assumptions): ExternalCostSaving[] {
  return a.externalCosts.map((c) => ({
    label: c.label,
    eurPerYear: c.annualEur * c.elasticity * imp.car,
  }))
}

export interface TimelinePoint {
  /** Jahr ab Start (1 … Horizont). */
  year: number
  /** Kumulierte Kosten (Investition + Betrieb) in €. */
  cumulativeCost: number
  /** Kumulierter Nutzen (vermiedene Folgekosten) in €. */
  cumulativeBenefit: number
}

export interface CostBenefit {
  timeline: TimelinePoint[]
  /** Erstes Jahr, in dem der kumulierte Nutzen die Kosten erreicht; null = nicht im Zeitraum. */
  breakEvenYear: number | null
}

/**
 * Kumulierte Kosten vs. Nutzen über den Betrachtungszeitraum.
 * Investitionen verteilen sich gleichmäßig auf die Bauzeit. Betriebs-Mehrkosten
 * und Nutzen wachsen in der Bauzeit linear mit dem Ausbaufortschritt an.
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
