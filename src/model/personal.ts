import type { Assumptions } from '../config/assumptions'
import { clamp } from './interpolate'
import type { Improvements, Profile } from './types'

export interface TimeSavings {
  /** Kürzere Pendelzeit durch dichteren ÖPNV-Takt, Min./Woche. */
  commuteMin: number
  /** Wegfallende Pufferzeit durch pünktlichere Bahn, Min./Woche. */
  bufferMin: number
  /** Kürzere Alltagswege durch bessere Radinfrastruktur, Min./Woche. */
  everydayMin: number
  /** Summe in Min./Woche. */
  totalMinPerWeek: number
  /** Summe in Std./Woche. */
  totalHoursPerWeek: number
}

/**
 * Persönliche Zeitersparnis pro Woche.
 *
 * - Pendeln: Pendelzeit (skaliert mit der Distanz) × Takt-Elastizität ×
 *   relative Taktverkürzung × Wohnlagefaktor. Gilt als Mittel aus Umstieg
 *   auf den ÖPNV und weniger Stau für alle, die weiter Auto fahren.
 * - Puffer: Die heutige Pufferzeit ist proportional zur Unpünktlichkeit (1 − p).
 *   Ersparnis = Puffer × Pünktlichkeitsgewinn / (1 − p_DE). Nur für Pendelnde,
 *   anteilig bei kurzen Wegen (bis zum Ø-Arbeitsweg).
 * - Alltag: Alltagswege × Rad-Elastizität × Zuwachs Radanteil × Wohnlagefaktor.
 */
export function timeSavings(
  imp: Improvements,
  profile: Profile,
  baseRailPunctuality: number,
  a: Assumptions,
): TimeSavings {
  const loc = a.locationFactors[profile.location]
  const commuteKm = Math.max(0, profile.commuteKm)

  // Heutige Pendelzeit pro Tag, linear mit der Distanz skaliert (Ø-Pendelzeit beim Ø-Arbeitsweg).
  const commuteMinPerDay = a.commuteMinutesPerDay * (commuteKm / a.averageCommuteKm)
  const commuteMin = commuteMinPerDay * a.transitCommuteElasticity * imp.transit * loc.transit * a.workDaysPerWeek

  // Pufferanteil: volle Pufferzeit ab Ø-Arbeitsweg, darunter anteilig.
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
 * Wahrscheinlichkeit (0–1), dass der Haushalt auf ein Auto verzichten kann.
 *
 * Jede Dimension trägt gewichtet bei, normiert auf ihre Referenzverbesserung
 * (≈ Abstand DE → NL). Das Ergebnis wird mit der Wohnlage-Obergrenze
 * multipliziert: In der Großstadt ist Autoverzicht viel leichter als auf dem Land.
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
  /** Erwartete Ersparnis in €/Jahr (Hauptzahl). */
  totalPerYear: number
  /** Wahrscheinlichkeit, ein Auto abzuschaffen (0 bei Haushalten ohne Auto). */
  carAbolishProbability: number
  /** Ersparnis in €/Jahr, falls ein Auto tatsächlich abgeschafft wird (0 ohne Auto). */
  savingsIfCarAbolished: number
  /** Ohne Auto: Ersparnis durch besseres Angebot (Taxi, Carsharing …) in €/Jahr. */
  betterServicePerYear: number
  /** Ohne Auto: monetarisierter Zeitgewinn in €/Jahr. */
  timeValuePerYear: number
}

/**
 * Persönliche Geldersparnis pro Jahr.
 *
 * - Mit Auto: Wahrscheinlichkeit × (Auto-Vollkosten − Ticketkosten) × 12.
 *   Das Ticket fällt nur an, wenn das Auto tatsächlich abgeschafft wird.
 *   Bei 2+ Autos geht es um den Zweitwagen: höhere Wahrscheinlichkeit.
 * - Ohne Auto: kein Autoeffekt. Ersparnis aus besserem Angebot (weniger Taxi,
 *   Carsharing, Mietwagen) plus Zeitgewinn × konservativer Zeitwert.
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
    // Angebotsindex 0–1 aus den Angebotsdimensionen (ohne Autoanteil), gleiche Gewichte wie oben.
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
