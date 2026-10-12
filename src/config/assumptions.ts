/**
 * Modellannahmen für Deutschland als Zielland.
 *
 * Alle Werte sind gerundete Schätzwerte/Platzhalter zur Veranschaulichung von
 * Größenordnungen, keine Prognose. Länderspezifische Kennzahlen stehen in
 * `countries.ts`, hier stehen Kosten, Wirkungsstärken und Profilfaktoren.
 */

export type Location = 'grossstadt' | 'kleinstadt' | 'land'
export type CarCount = 0 | 1 | 2

export const LOCATION_LABELS: Record<Location, string> = {
  grossstadt: 'Großstadt',
  kleinstadt: 'Kleinstadt',
  land: 'Land',
}

/** Wirkungsfaktoren je Wohnlage (1 = Durchschnitt). */
export interface LocationFactors {
  /** Wirkung des ÖPNV-Takts auf die Pendelzeit. Land profitiert am stärksten vom Takt. */
  transit: number
  /** Wirkung der Bahn-Pünktlichkeit auf die Pufferzeit. */
  rail: number
  /** Wirkung der Radinfrastruktur auf Alltagswege. Kurze Wege in der Stadt profitieren am stärksten. */
  bike: number
  /** Max. Wahrscheinlichkeit, ein Auto abzuschaffen, auf vollem Benchmark-Niveau (0–1). */
  maxCarAbolishProbability: number
  /** Faktor auf die ÖPNV-Tür-zu-Tür-Geschwindigkeit (Land: längere Zu-/Abgangswege). */
  transitSpeed: number
  /** Faktor auf die Rad-Tür-zu-Tür-Geschwindigkeit (Stadt: mehr Ampeln). */
  bikeSpeed: number
}

export interface ExternalCostItem {
  label: string
  /** Jährliche Folgekosten des Autoverkehrs in € (Schätzwert). */
  annualEur: number
  /** Anteil, der proportional zum Rückgang der Autofahrten sinkt (0–1). */
  elasticity: number
}

export const ASSUMPTIONS = {
  // ---------------- Bevölkerung ----------------
  /** Einwohner Deutschlands (Schätzwert, ca. 84 Mio.). */
  population: 84_000_000,

  // ---------------- Kosten für Haushalte ----------------
  /** Auto-Vollkosten inkl. Wertverlust, Versicherung, Sprit, Wartung in €/Monat (Schätzwert, ADAC-Größenordnung). */
  carFullCostPerMonth: 550,
  /** ÖPNV-Abo in €/Monat (Größenordnung Deutschlandticket). */
  transitTicketPerMonth: 60,
  /** Faktor auf die Abschaffungs-Wahrscheinlichkeit beim Zweitwagen (Haushalte mit 2+ Autos). */
  secondCarProbabilityFactor: 1.4,
  /** Obergrenze für jede Abschaffungs-Wahrscheinlichkeit. */
  maxProbability: 0.95,

  // ---------------- Haushalte ohne Auto ----------------
  /** Ausgaben für Taxi, Carsharing, Mietwagen, Lieferungen in €/Jahr (Schätzwert). */
  noCarSubstituteCostPerYear: 600,
  /** Max. Reduktion dieser Ausgaben bei vollem Benchmark-Angebot (0–1). */
  noCarSubstituteReductionMax: 0.5,
  /** Konservativer Zeitwert in €/Stunde, nur für Haushalte ohne Auto angesetzt. */
  valueOfTimePerHour: 8,

  // ---------------- Zeit ----------------
  /** Ø Arbeitsweg in Deutschland in Minuten pro Tag (hin + zurück). */
  commuteMinutesPerDay: 60,
  /** Ø Arbeitsweg in Deutschland in km (einfach), passend zu den 60 Min./Tag. */
  averageCommuteKm: 17,
  /** Arbeitstage pro Woche. */
  workDaysPerWeek: 5,
  /** Arbeitswochen pro Jahr (für Jahreswerte). */
  workWeeksPerYear: 46,
  /**
   * Pendelzeit-Elastizität bzgl. Taktverbesserung: Pendelzeit sinkt um
   * Elastizität × relative Taktverkürzung. NL (Takt halbiert, 50 %) → −18 %.
   */
  transitCommuteElasticity: 0.36,
  /** Tägliche Pufferzeit wegen Unpünktlichkeit beim heutigen DE-Niveau in Min./Tag. */
  bufferMinutesPerDay: 10,
  /** Zeit für Alltagswege (Einkauf, Freizeit, Erledigungen) in Min./Woche. */
  everydayTripMinutesPerWeek: 300,
  /**
   * Zeitwirkung der Radinfrastruktur: Alltagswege werden um
   * Elastizität × Zuwachs Radanteil kürzer. NL (+16 Pp.) → −12 %.
   */
  bikeTimeElasticity: 0.75,

  // ---------------- Wohnlage ----------------
  locationFactors: {
    grossstadt: { transit: 0.9, rail: 1.0, bike: 1.2, maxCarAbolishProbability: 0.7, transitSpeed: 1.0, bikeSpeed: 0.95 },
    kleinstadt: { transit: 1.0, rail: 1.0, bike: 1.0, maxCarAbolishProbability: 0.45, transitSpeed: 0.8, bikeSpeed: 1.0 },
    land: { transit: 1.3, rail: 0.9, bike: 0.6, maxCarAbolishProbability: 0.25, transitSpeed: 0.6, bikeSpeed: 1.05 },
  } satisfies Record<Location, LocationFactors>,

  // ---------------- Autoverzicht ----------------
  /** Gewicht der einzelnen Regler für die Abschaffungs-Wahrscheinlichkeit (Summe 1). */
  carAbolishWeights: { transit: 0.35, rail: 0.15, bike: 0.25, car: 0.25 },
  /**
   * Verbesserung je Dimension, bei der ihr voller Beitrag zum Autoverzicht
   * erreicht ist (entspricht ungefähr dem Abstand DE → NL).
   * transit: relative Taktverkürzung, rail: Pünktlichkeitsgewinn,
   * bike: Zuwachs Radanteil, car: relativer Rückgang Autoanteil.
   */
  carAbolishReferenceImprovement: { transit: 0.5, rail: 0.28, bike: 0.16, car: 0.175 },

  // ---------------- Mobilitätsradius ----------------
  /** Reisezeit für den Mobilitätsradius in Minuten. */
  radiusMinutes: 30,

  // ---------------- Staat: Investitionen ----------------
  /** Radweg-Baukosten in €/km (Schätzwert ca. 0,5 Mio. €/km). */
  bikeLaneCostPerKm: 500_000,
  /** ÖPNV-Trasse (Straßenbahn 5–10 Mio. €/km, Mittelwert) in €/km. */
  transitLaneCostPerKm: 7_500_000,
  /** Schienen-Sanierung/-Ausbau für Pünktlichkeit in €/km (Schätzwert, Generalsanierung + Knoten). */
  railUpgradeCostPerKm: 8_000_000,
  /** Zu ertüchtigende Schienen-km je Prozentpunkt Pünktlichkeitsgewinn (Schätzwert). */
  railUpgradeKmPerPoint: 320,
  /** Heutige ÖPNV-Betriebskosten in €/Jahr (Schätzwert). */
  transitOperatingCostPerYear: 14_000_000_000,
  /**
   * Anteil der Mehrbetriebskosten durch dichteren Takt, der netto beim Staat
   * bleibt (nicht durch Mehreinnahmen gedeckt, nicht alle Linien betroffen).
   */
  transitExtraOperatingNetShare: 0.25,
  /** Bauzeit in Jahren: Investitionen verteilen sich gleichmäßig, Nutzen wächst linear mit. */
  buildYears: 10,
  /** Betrachtungszeitraum in Jahren. */
  horizonYears: 30,

  // ---------------- Staat: Folgekosten des Autoverkehrs ----------------
  externalCosts: [
    { label: 'Straßenerhalt', annualEur: 20_000_000_000, elasticity: 0.4 },
    { label: 'Unfälle', annualEur: 30_000_000_000, elasticity: 1.0 },
    { label: 'Gesundheit (Lärm, Luft, Bewegungsmangel)', annualEur: 40_000_000_000, elasticity: 1.0 },
  ] satisfies ExternalCostItem[],

  // ---------------- CO₂ ----------------
  /** Pkw-km pro Person und Jahr (Schätzwert, Fahrleistung / Einwohner). */
  carKmPerPersonYear: 7_000,
  /** CO₂ je Pkw-km in kg (Flottenmittel). */
  carCo2KgPerKm: 0.15,
  /** CO₂ je Personen-km im ÖPNV in kg. */
  transitCo2KgPerKm: 0.04,
  /** Anteil der vermiedenen Auto-km, die auf den ÖPNV verlagert werden (Rest: Rad, Fuß, kürzere Wege). */
  transitReplacementShare: 0.6,
}

export type Assumptions = typeof ASSUMPTIONS
