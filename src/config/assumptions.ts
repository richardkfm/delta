/**
 * Model assumptions for Germany as the target country.
 *
 * Sourced values reference `sources.ts` with [Source: <id>]. Values marked
 * [Assumption] are model assumptions without a direct source (e.g. effect sizes),
 * chosen for plausible orders of magnitude. Country-specific key figures live
 * in `countries.ts`.
 */

export type Location = 'grossstadt' | 'kleinstadt' | 'land'
export type CarCount = 0 | 1 | 2

export const LOCATION_LABELS: Record<Location, string> = {
  grossstadt: 'Großstadt',
  kleinstadt: 'Kleinstadt',
  land: 'Land',
}

/** Effect factors per residential location (1 = average). */
export interface LocationFactors {
  /** Effect of public transit headway on commute time. Rural areas benefit most from headway. */
  transit: number
  /** Effect of rail punctuality on buffer time. */
  rail: number
  /** Effect of cycling infrastructure on everyday trips. Short urban trips benefit most. */
  bike: number
  /** Max. probability of giving up a car at full benchmark level (0–1). */
  maxCarAbolishProbability: number
  /** Factor on public transit door-to-door speed (rural: longer access/egress walks). */
  transitSpeed: number
  /** Factor on bike door-to-door speed (urban: more traffic lights). */
  bikeSpeed: number
}

export interface ExternalCostItem {
  label: string
  /** Annual external costs of car traffic in €. */
  annualEur: number
  /** Share that falls in proportion to the decline in car trips (0–1). */
  elasticity: number
}

export const ASSUMPTIONS = {
  // ---------------- Population ----------------
  /** Population of Germany, end of 2025: 83.5 million. [Source: destatis-bev-2025] */
  population: 83_500_000,

  // ---------------- Household costs ----------------
  /**
   * Full cost of car ownership incl. depreciation in €/month. According to ADAC, new
   * compact-class cars cost approx. 640–675 €/month (5 years, 15,000 km/year). The existing
   * fleet is older and drives less (avg. 12,300 km), hence a conservative 550 € [Assumption].
   * [Source: adac-autokosten, adac-kompaktklasse]
   */
  carFullCostPerMonth: 550,
  /** Deutschlandticket 2026: 63 €/month. [Source: correctiv-dticket] */
  transitTicketPerMonth: 63,
  /** [Assumption] Factor on the give-up probability for a second car (households with 2+ cars). */
  secondCarProbabilityFactor: 1.4,
  /** [Assumption] Upper bound for every give-up probability. */
  maxProbability: 0.95,

  // ---------------- Households without a car ----------------
  /** [Assumption] Spending on taxis, car sharing, rental cars, deliveries in €/year. */
  noCarSubstituteCostPerYear: 600,
  /** [Assumption] Max. reduction of this spending at full benchmark service level (0–1). */
  noCarSubstituteReductionMax: 0.5,
  /** [Assumption] Conservative value of time in €/hour, applied only to households without a car. */
  valueOfTimePerHour: 8,

  // ---------------- Time ----------------
  /**
   * Avg. commute in minutes per day (there + back). Derived from the Destatis time
   * classes 2024: approx. 26 min one way. [Source: destatis-pendelzeit-2024]
   */
  commuteMinutesPerDay: 52,
  /** Avg. commute in km (one way), derived from the Destatis distance classes 2024: approx. 17 km. [Source: destatis-pendler-2024] */
  averageCommuteKm: 17,
  /** Working days per week. */
  workDaysPerWeek: 5,
  /** Working weeks per year (for annual values). */
  workWeeksPerYear: 46,
  /**
   * [Assumption] Commute-time elasticity with respect to headway improvement: commute time falls by
   * elasticity × relative headway reduction. NL (headway halved, 50%) → −18%.
   */
  transitCommuteElasticity: 0.36,
  /** [Assumption] Daily buffer time due to unpunctuality at today's DE level in min/day (project default, no study found). */
  bufferMinutesPerDay: 10,
  /**
   * Time for shopping, errands and leisure in min/week, derived from
   * MiD 2023 (trips × duration per purpose, table 11). [Source: mid2023-ergebnisbericht]
   */
  everydayTripMinutesPerWeek: 345,
  /**
   * [Assumption] Time effect of cycling infrastructure: everyday trips get shorter by
   * elasticity × increase in bike share. NL (+15.8 pp) → −12%.
   */
  bikeTimeElasticity: 0.75,

  // ---------------- Residential location ----------------
  /** [Assumption] All location factors are model assumptions. */
  locationFactors: {
    grossstadt: { transit: 0.9, rail: 1.0, bike: 1.2, maxCarAbolishProbability: 0.7, transitSpeed: 1.0, bikeSpeed: 0.95 },
    kleinstadt: { transit: 1.0, rail: 1.0, bike: 1.0, maxCarAbolishProbability: 0.45, transitSpeed: 0.8, bikeSpeed: 1.0 },
    land: { transit: 1.3, rail: 0.9, bike: 0.6, maxCarAbolishProbability: 0.25, transitSpeed: 0.6, bikeSpeed: 1.05 },
  } satisfies Record<Location, LocationFactors>,

  // ---------------- Giving up the car ----------------
  /** [Assumption] Weight of each slider for the give-up probability (sum 1). */
  carAbolishWeights: { transit: 0.35, rail: 0.15, bike: 0.25, car: 0.25 },
  /**
   * [Assumption] Improvement per dimension at which its full contribution to giving up
   * the car is reached (corresponds to the DE → NL gap).
   * transit: relative headway reduction, rail: punctuality gain,
   * bike: increase in bike share, car: relative decline in car share.
   */
  carAbolishReferenceImprovement: { transit: 0.5, rail: 0.907 - 0.601, bike: 0.268 - 0.11, car: 1 - 0.447 / 0.53 },

  // ---------------- Mobility radius ----------------
  /** Travel time for the mobility radius in minutes. */
  radiusMinutes: 30,

  // ---------------- State: investments ----------------
  /** Bike path 2.5 m wide outside built-up areas: benchmark 0.5 million €/km (inside built-up areas/cycle highway more expensive: 1–2 million). [Source: hessen-radweg-kosten] */
  bikeLaneCostPerKm: 500_000,
  /** New double-track tram line: 10–15 million €/km (2020 prices), midpoint. [Source: oepnv-db-kosten] */
  transitLaneCostPerKm: 12_500_000,
  /**
   * General renovation (Generalsanierung) of rail in €/km. Riedbahn: 1.5 billion € for 70 km ≈ 21 million €/km,
   * original DB estimate for all corridors ≈ 6.8 million €/km; midpoint 15 million. [Source: brh-generalsanierung]
   */
  railUpgradeCostPerKm: 15_000_000,
  /**
   * Rail km to renovate per percentage point of punctuality gain. [Assumption] based on
   * 4,000 km of high-performance corridors for the DE → NL gap (30.6 pp) ≈ 130 km. [Source: brh-generalsanierung]
   */
  railUpgradeKmPerPoint: 130,
  /** Public transit expenditure in Germany 2024: approx. 39 billion €/year. [Source: vdv-deutschlandangebot] */
  transitOperatingCostPerYear: 39_000_000_000,
  /**
   * Share of the additional costs not covered by fares (cost recovery approx. 33%).
   * [Source: vdv-deutschlandangebot] Additional costs = expenditure × transit speed gain × share [Assumption].
   */
  transitExtraOperatingNetShare: 0.67,
  /** [Assumption] Construction time in years: investments are spread evenly, benefits grow linearly. */
  buildYears: 10,
  /** Evaluation horizon in years. */
  horizonYears: 30,

  // ---------------- State: external costs of car traffic ----------------
  /**
   * External costs of car traffic 2017 (INFRAS for Allianz pro Schiene, table 8)
   * plus road maintenance. Societal costs, not just the state budget.
   */
  externalCosts: [
    // Maintenance and operation of all roads ≈ 19.1 billion €/year (2020). [Source: boettger-2021]
    // [Assumption] 40% variable with car traffic: cars bear 48% of the infrastructure costs of
    // federal trunk roads, but weight-dependent wear is caused almost only by trucks. [Source: wegekosten-2021]
    { label: 'Straßenerhalt', annualEur: 19_100_000_000, elasticity: 0.4 },
    // Car accident costs 48.8 billion € (INFRAS). For comparison BASt 2024: 40.2 billion € for all
    // road traffic accidents (different valuation). [Source: infras-2019, bast-unfallkosten]
    { label: 'Unfälle', annualEur: 48_800_000_000, elasticity: 1.0 },
    // Cars: air pollutants 5.7 + noise 3.4 billion €. Physical inactivity is not included. [Source: infras-2019]
    { label: 'Gesundheit (Luft, Lärm)', annualEur: 9_070_000_000, elasticity: 1.0 },
    // Cars: climate costs 16.6 billion €. [Source: infras-2019]
    { label: 'Klima', annualEur: 16_580_000_000, elasticity: 1.0 },
    // Cars: nature and landscape 8.9 billion €. [Source: infras-2019]
    { label: 'Natur & Landschaft', annualEur: 8_850_000_000, elasticity: 1.0 },
    // Cars: upstream and downstream processes (energy, vehicle manufacturing) 20.5 billion €. [Source: infras-2019]
    { label: 'Energie & Fahrzeugherstellung', annualEur: 20_490_000_000, elasticity: 1.0 },
  ] satisfies ExternalCostItem[],

  // ---------------- CO₂ ----------------
  /** Car km per person and year: 591 billion car km (2023) / 83.5 million inhabitants ≈ 7,100 km. [Source: kba-fahrleistung-2023] */
  carKmPerPersonYear: 7_100,
  /** Avg. occupancy of a car (persons). [Source: uba-emissionen-2024] */
  carOccupancy: 1.4,
  /** CO₂e per car km in kg: 164 g per person-km × 1.4 persons ≈ 230 g (incl. upstream chain). [Source: uba-emissionen-2024] */
  carCo2KgPerKm: 0.23,
  /**
   * CO₂e per person-km in public transit in kg. Bus 90, tram/subway 42, regional rail 44 g;
   * weighted approx. 58 g [Assumption: weighting]. [Source: uba-emissionen-2024]
   */
  transitCo2KgPerKm: 0.058,
  /** [Assumption] Share of avoided person-km that shift to public transit (rest: bike, walking, shorter trips). */
  transitReplacementShare: 0.6,
}

export type Assumptions = typeof ASSUMPTIONS
