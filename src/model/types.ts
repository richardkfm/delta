import type { CarCount, Location } from '../config/assumptions'

/** Slider positions, each from 0 (Germany today) to 1 (benchmark level). */
export interface Sliders {
  /** Public transit frequency & network density */
  transit: number
  /** Rail punctuality */
  rail: number
  /** Cycling infrastructure */
  bike: number
  /** Car dependence (share of trips made by car) */
  car: number
}

export type SliderKey = keyof Sliders

export const SLIDER_KEYS: SliderKey[] = ['transit', 'rail', 'bike', 'car']

/** Personal profile. */
export interface Profile {
  location: Location
  /** One-way commute in km (0 = no commuting). */
  commuteKm: number
  /** Cars in the household (2 stands for "2+"). */
  cars: CarCount
}

/** Interpolated metrics in the current scenario (real values for display). */
export interface ScenarioMetrics {
  transitHeadwayMin: number
  transitLaneKmPer100k: number
  transitDoorToDoorKmh: number
  railPunctuality: number
  bikeShare: number
  bikeLaneKmPer1000: number
  bikeDoorToDoorKmh: number
  carShare: number
}

/**
 * Improvement over Germany per dimension, always ≥ 0.
 * If a benchmark country is worse than Germany in a dimension,
 * the improvement stays 0 (the model does not count deteriorations).
 */
export interface Improvements {
  /** Relative reduction in headway: 1 − headway(scenario) / headway(DE). */
  transit: number
  /** Punctuality gain in share points (0.28 = 28 percentage points). */
  rail: number
  /** Increase in bike share in share points. */
  bike: number
  /** Relative decline in car share: 1 − share(scenario) / share(DE). */
  car: number
}
