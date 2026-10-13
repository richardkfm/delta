import type { Assumptions } from '../config/assumptions'
import { clamp } from './interpolate'
import type { Improvements, Profile } from './types'

export interface TimeSavings {
  /** Shorter commute time from denser transit frequency, min/week. */
  commuteMin: number
  /** Buffer time saved through a more punctual railway, min/week. */
  bufferMin: number
  /** Shorter everyday trips from better cycling infrastructure, min/week. */
  everydayMin: number
  /** Total in min/week. */
  totalMinPerWeek: number
  /** Total in hours/week. */
  totalHoursPerWeek: number
}

/**
 * Personal time savings per week.
 *
 * - Commuting: commute time (scaled by distance) × headway elasticity ×
 *   relative headway reduction × location factor. Treated as an average of switching
 *   to transit and less congestion for those who keep driving.
 * - Buffer: today's buffer time is proportional to unpunctuality (1 − p).
 *   Savings = buffer × punctuality gain / (1 − p_DE). Commuters only,
 *   prorated for short trips (up to the average commute).
 * - Everyday: everyday trips × bike elasticity × increase in bike share × location factor.
 */
export function timeSavings(
  imp: Improvements,
  profile: Profile,
  baseRailPunctuality: number,
  a: Assumptions,
): TimeSavings {
  const loc = a.locationFactors[profile.location]
  const commuteKm = Math.max(0, profile.commuteKm)

  // Today's commute time per day, scaled linearly with distance (average commute time at the average commute).
  const commuteMinPerDay = a.commuteMinutesPerDay * (commuteKm / a.averageCommuteKm)
  const commuteMin = commuteMinPerDay * a.transitCommuteElasticity * imp.transit * loc.transit * a.workDaysPerWeek

  // Buffer share: full buffer time from the average commute upward, prorated below that.
  const bufferWeight = clamp(commuteKm / a.averageCommuteKm)
  const unpunctuality = 1 - baseRailPunctuality
  const bufferSavedPerDay = unpunctuality > 0 ? a.bufferMinutesPerDay * (imp.rail / unpunctuality) : 0
  const bufferMin = Math.min(a.bufferMinutesPerDay, bufferSavedPerDay) * bufferWeight * loc.rail * a.workDaysPerWeek

  const everydayMin = a.everydayTripMinutesPerWeek * a.bikeTimeElasticity * imp.bike * loc.bike

  const totalMinPerWeek = commuteMin + bufferMin + everydayMin
  return {
    commuteMin,
    bufferMin,
    everydayMin,
    totalMinPerWeek,
    totalHoursPerWeek: totalMinPerWeek / 60,
  }
}

/**
 * Probability (0–1) that the household can give up a car.
 *
 * Each dimension contributes with a weight, normalised to its reference improvement
 * (≈ gap DE → NL). The result is multiplied by the location cap:
 * in a big city, going car-free is much easier than in the countryside.
 */
export function carAbolishProbability(imp: Improvements, profile: Profile, a: Assumptions): number {
  const w = a.carAbolishWeights
  const ref = a.carAbolishReferenceImprovement
  const score =
    w.transit * clamp(imp.transit / ref.transit) +
    w.rail * clamp(imp.rail / ref.rail) +
    w.bike * clamp(imp.bike / ref.bike) +
    w.car * clamp(imp.car / ref.car)
  return clamp(score) * a.locationFactors[profile.location].maxCarAbolishProbability
}

export interface MoneySavings {
  /** Expected savings in €/year (headline figure). */
  totalPerYear: number
  /** Probability of giving up a car (0 for households without a car). */
  carAbolishProbability: number
  /** Savings in €/year if a car is actually given up (0 without a car). */
  savingsIfCarAbolished: number
  /** Without a car: savings from better service (taxi, car sharing …) in €/year. */
  betterServicePerYear: number
  /** Without a car: monetised time gain in €/year. */
  timeValuePerYear: number
}

/**
 * Personal money savings per year.
 *
 * - With a car: probability × (full car cost − ticket cost) × 12.
 *   The ticket is only incurred if the car is actually given up.
 *   With 2+ cars it is about the second car: higher probability.
 * - Without a car: no car effect. Savings from better service (less taxi,
 *   car sharing, rental cars) plus time gain × conservative value of time.
 */
export function moneySavings(
  imp: Improvements,
  profile: Profile,
  time: TimeSavings,
  a: Assumptions,
): MoneySavings {
  if (profile.cars === 0) {
    const w = a.carAbolishWeights
    const ref = a.carAbolishReferenceImprovement
    // Service index 0–1 from the service dimensions (excluding car share), same weights as above.
    const offerWeight = w.transit + w.rail + w.bike
    const offerScore =
      offerWeight > 0
        ? (w.transit * clamp(imp.transit / ref.transit) +
            w.rail * clamp(imp.rail / ref.rail) +
            w.bike * clamp(imp.bike / ref.bike)) /
          offerWeight
        : 0
    const betterServicePerYear = a.noCarSubstituteCostPerYear * a.noCarSubstituteReductionMax * offerScore
    const timeValuePerYear = time.totalHoursPerWeek * a.workWeeksPerYear * a.valueOfTimePerHour
    return {
      totalPerYear: betterServicePerYear + timeValuePerYear,
      carAbolishProbability: 0,
      savingsIfCarAbolished: 0,
      betterServicePerYear,
      timeValuePerYear,
    }
  }

  let p = carAbolishProbability(imp, profile, a)
  if (profile.cars >= 2) p = Math.min(a.maxProbability, p * a.secondCarProbabilityFactor)
  p = Math.min(a.maxProbability, p)

  const savingsIfCarAbolished = (a.carFullCostPerMonth - a.transitTicketPerMonth) * 12
  return {
    totalPerYear: p * savingsIfCarAbolished,
    carAbolishProbability: p,
    savingsIfCarAbolished,
    betterServicePerYear: 0,
    timeValuePerYear: 0,
  }
}
