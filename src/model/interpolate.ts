import type { CountryData } from '../config/countries'
import type { Improvements, ScenarioMetrics, Sliders } from './types'

/** Clamps x to [min, max]. */
export function clamp(x: number, min = 0, max = 1): number {
  if (Number.isNaN(x)) return min
  return Math.min(max, Math.max(min, x))
}

/** Linear interpolation: t = 0 → from, t = 1 → to. t is clamped to [0, 1]. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp(t)
}

/**
 * Scenario metrics: each slider interpolates linearly between the
 * German value and the benchmark value of its associated metrics.
 */
export function scenarioMetrics(base: CountryData, bench: CountryData, s: Sliders): ScenarioMetrics {
  return {
    transitHeadwayMin: lerp(base.transitHeadwayMin, bench.transitHeadwayMin, s.transit),
    transitLaneKmPer100k: lerp(base.transitLaneKmPer100k, bench.transitLaneKmPer100k, s.transit),
    transitDoorToDoorKmh: lerp(base.transitDoorToDoorKmh, bench.transitDoorToDoorKmh, s.transit),
    railPunctuality: lerp(base.railPunctuality, bench.railPunctuality, s.rail),
    bikeShare: lerp(base.bikeShare, bench.bikeShare, s.bike),
    bikeLaneKmPer1000: lerp(base.bikeLaneKmPer1000, bench.bikeLaneKmPer1000, s.bike),
    bikeDoorToDoorKmh: lerp(base.bikeDoorToDoorKmh, bench.bikeDoorToDoorKmh, s.bike),
    carShare: lerp(base.carShare, bench.carShare, s.car),
  }
}

/**
 * Improvements over Germany (all ≥ 0). Basis for all effects.
 * Worse benchmark values are counted as 0.
 */
export function improvements(base: CountryData, m: ScenarioMetrics): Improvements {
  return {
    transit: Math.max(0, 1 - m.transitHeadwayMin / base.transitHeadwayMin),
    rail: Math.max(0, m.railPunctuality - base.railPunctuality),
    bike: Math.max(0, m.bikeShare - base.bikeShare),
    car: Math.max(0, 1 - m.carShare / base.carShare),
  }
}
