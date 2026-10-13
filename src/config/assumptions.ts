/**
 * Modellannahmen für Deutschland als Zielland.
 *
 * Belegte Werte verweisen mit [Quelle: <id>] auf `sources.ts`. Werte mit
 * [Annahme] sind Modellannahmen ohne direkte Quelle (z. B. Wirkungsstärken),
 * gewählt für plausible Größenordnungen. Länderspezifische Kennzahlen stehen
 * in `countries.ts`.
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
  /** Jährliche Folgekosten des Pkw-Verkehrs in €. */
  annualEur: number
  /** Anteil, der proportional zum Rückgang der Autofahrten sinkt (0–1). */
  elasticity: number
}

export const ASSUMPTIONS = {
  // ---------------- Bevölkerung ----------------
  /** Einwohner Deutschlands, Ende 2025: 83,5 Mio. [Quelle: destatis-bev-2025] */
  population: 83_500_000,

  // ---------------- Kosten für Haushalte ----------------
  /**
   * Auto-Vollkosten inkl. Wertverlust in €/Monat. Nach ADAC kosten Neuwagen der
   * Kompaktklasse ca. 640–675 €/Monat (5 Jahre, 15.000 km/Jahr). Der Bestand ist
   * älter und fährt weniger (Ø 12.300 km), daher konservativ 550 € [Annahme].
   * [Quelle: adac-autokosten, adac-kompaktklasse]
   */
  carFullCostPerMonth: 550,
  /** Deutschlandticket 2026: 63 €/Monat. [Quelle: correctiv-dticket] */
  transitTicketPerMonth: 63,
  /** [Annahme] Faktor auf die Abschaffungs-Wahrscheinlichkeit beim Zweitwagen (Haushalte mit 2+ Autos). */
  secondCarProbabilityFactor: 1.4,
  /** [Annahme] Obergrenze für jede Abschaffungs-Wahrscheinlichkeit. */
  maxProbability: 0.95,

  // ---------------- Haushalte ohne Auto ----------------
  /** [Annahme] Ausgaben für Taxi, Carsharing, Mietwagen, Lieferungen in €/Jahr. */
  noCarSubstituteCostPerYear: 600,
  /** [Annahme] Max. Reduktion dieser Ausgaben bei vollem Benchmark-Angebot (0–1). */
  noCarSubstituteReductionMax: 0.5,
  /** [Annahme] Konservativer Zeitwert in €/Stunde, nur für Haushalte ohne Auto angesetzt. */
  valueOfTimePerHour: 8,

  // ---------------- Zeit ----------------
  /**
   * Ø Arbeitsweg in Minuten pro Tag (hin + zurück). Aus den Destatis-Zeitklassen
   * 2024 abgeleitet: ca. 26 Min. einfach. [Quelle: destatis-pendelzeit-2024]
   */
  commuteMinutesPerDay: 52,
  /** Ø Arbeitsweg in km (einfach), aus den Destatis-Entfernungsklassen 2024 abgeleitet: ca. 17 km. [Quelle: destatis-pendler-2024] */
  averageCommuteKm: 17,
  /** Arbeitstage pro Woche. */
  workDaysPerWeek: 5,
  /** Arbeitswochen pro Jahr (für Jahreswerte). */
  workWeeksPerYear: 46,
  /**
   * [Annahme] Pendelzeit-Elastizität bzgl. Taktverbesserung: Pendelzeit sinkt um
   * Elastizität × relative Taktverkürzung. NL (Takt halbiert, 50 %) → −18 %.
   */
  transitCommuteElasticity: 0.36,
  /** [Annahme] Tägliche Pufferzeit wegen Unpünktlichkeit beim heutigen DE-Niveau in Min./Tag (Projektvorgabe, keine Studie gefunden). */
  bufferMinutesPerDay: 10,
  /**
   * Zeit für Einkauf, Erledigungen und Freizeit in Min./Woche, abgeleitet aus
   * MiD 2023 (Wege × Dauer je Zweck, Tab. 11). [Quelle: mid2023-ergebnisbericht]
   */
  everydayTripMinutesPerWeek: 345,
  /**
   * [Annahme] Zeitwirkung der Radinfrastruktur: Alltagswege werden um
   * Elastizität × Zuwachs Radanteil kürzer. NL (+15,8 Pp.) → −12 %.
   */
  bikeTimeElasticity: 0.75,

  // ---------------- Wohnlage ----------------
  /** [Annahme] Alle Wohnlage-Faktoren sind Modellannahmen. */
  locationFactors: {
    grossstadt: { transit: 0.9, rail: 1.0, bike: 1.2, maxCarAbolishProbability: 0.7, transitSpeed: 1.0, bikeSpeed: 0.95 },
    kleinstadt: { transit: 1.0, rail: 1.0, bike: 1.0, maxCarAbolishProbability: 0.45, transitSpeed: 0.8, bikeSpeed: 1.0 },
    land: { transit: 1.3, rail: 0.9, bike: 0.6, maxCarAbolishProbability: 0.25, transitSpeed: 0.6, bikeSpeed: 1.05 },
  } satisfies Record<Location, LocationFactors>,

  // ---------------- Autoverzicht ----------------
  /** [Annahme] Gewicht der einzelnen Regler für die Abschaffungs-Wahrscheinlichkeit (Summe 1). */
  carAbolishWeights: { transit: 0.35, rail: 0.15, bike: 0.25, car: 0.25 },
  /**
   * [Annahme] Verbesserung je Dimension, bei der ihr voller Beitrag zum Autoverzicht
   * erreicht ist (entspricht dem Abstand DE → NL).
   * transit: relative Taktverkürzung, rail: Pünktlichkeitsgewinn,
   * bike: Zuwachs Radanteil, car: relativer Rückgang Autoanteil.
   */
  carAbolishReferenceImprovement: { transit: 0.5, rail: 0.907 - 0.601, bike: 0.268 - 0.11, car: 1 - 0.447 / 0.53 },

  // ---------------- Mobilitätsradius ----------------
  /** Reisezeit für den Mobilitätsradius in Minuten. */
  radiusMinutes: 30,

  // ---------------- Staat: Investitionen ----------------
  /** Radweg 2,5 m außerorts: Orientierungswert 0,5 Mio. €/km (innerorts/Radschnellweg teurer: 1–2 Mio.). [Quelle: hessen-radweg-kosten] */
  bikeLaneCostPerKm: 500_000,
  /** Straßenbahn-Neubau zweigleisig: 10–15 Mio. €/km (Preisstand 2020), Mittelwert. [Quelle: oepnv-db-kosten] */
  transitLaneCostPerKm: 12_500_000,
  /**
   * Generalsanierung Schiene in €/km. Riedbahn: 1,5 Mrd. € für 70 km ≈ 21 Mio. €/km,
   * ursprüngliche DB-Schätzung für alle Korridore ≈ 6,8 Mio. €/km; Mittelwert 15 Mio. [Quelle: brh-generalsanierung]
   */
  railUpgradeCostPerKm: 15_000_000,
  /**
   * Zu sanierende Schienen-km je Prozentpunkt Pünktlichkeitsgewinn. [Annahme] auf Basis von
   * 4.000 km Hochleistungskorridoren für den Abstand DE → NL (30,6 Pp.) ≈ 130 km. [Quelle: brh-generalsanierung]
   */
  railUpgradeKmPerPoint: 130,
  /** Aufwand des ÖPNV in Deutschland 2024: ca. 39 Mrd. €/Jahr. [Quelle: vdv-deutschlandangebot] */
  transitOperatingCostPerYear: 39_000_000_000,
  /**
   * Anteil der Mehrkosten, der nicht durch Fahrgeld gedeckt ist (Kostendeckung ca. 33 %).
   * [Quelle: vdv-deutschlandangebot] Mehrkosten = Aufwand × Tempogewinn ÖPNV × Anteil [Annahme].
   */
  transitExtraOperatingNetShare: 0.67,
  /** [Annahme] Bauzeit in Jahren: Investitionen verteilen sich gleichmäßig, Nutzen wächst linear mit. */
  buildYears: 10,
  /** Betrachtungszeitraum in Jahren. */
  horizonYears: 30,

  // ---------------- Staat: Folgekosten des Pkw-Verkehrs ----------------
  /**
   * Externe Kosten des Pkw-Verkehrs 2017 (INFRAS für Allianz pro Schiene, Tab. 8)
   * plus Straßenerhalt. Gesellschaftliche Kosten, nicht nur Staatshaushalt.
   */
  externalCosts: [
    // Erhaltung und Betrieb aller Straßen ≈ 19,1 Mrd. €/Jahr (2020). [Quelle: boettger-2021]
    // [Annahme] 40 % variabel mit dem Pkw-Verkehr: Pkw tragen 48 % der Wegekosten der
    // Bundesfernstraßen, den gewichtsabhängigen Verschleiß aber fast nur Lkw. [Quelle: wegekosten-2021]
    { label: 'Straßenerhalt', annualEur: 19_100_000_000, elasticity: 0.4 },
    // Pkw-Unfallkosten 48,8 Mrd. € (INFRAS). Zum Vergleich BASt 2024: 40,2 Mrd. € für alle
    // Straßenverkehrsunfälle (andere Bewertung). [Quelle: infras-2019, bast-unfallkosten]
    { label: 'Unfälle', annualEur: 48_800_000_000, elasticity: 1.0 },
    // Pkw: Luftschadstoffe 5,7 + Lärm 3,4 Mrd. €. Bewegungsmangel ist nicht enthalten. [Quelle: infras-2019]
    { label: 'Gesundheit (Luft, Lärm)', annualEur: 9_070_000_000, elasticity: 1.0 },
    // Pkw: Klimakosten 16,6 Mrd. €. [Quelle: infras-2019]
    { label: 'Klima', annualEur: 16_580_000_000, elasticity: 1.0 },
    // Pkw: Natur und Landschaft 8,9 Mrd. €. [Quelle: infras-2019]
    { label: 'Natur & Landschaft', annualEur: 8_850_000_000, elasticity: 1.0 },
    // Pkw: vor- und nachgelagerte Prozesse (Energie, Fahrzeugbau) 20,5 Mrd. €. [Quelle: infras-2019]
    { label: 'Energie & Fahrzeugherstellung', annualEur: 20_490_000_000, elasticity: 1.0 },
  ] satisfies ExternalCostItem[],

  // ---------------- CO₂ ----------------
  /** Pkw-km pro Person und Jahr: 591 Mrd. Pkw-km (2023) / 83,5 Mio. Einw. ≈ 7.100 km. [Quelle: kba-fahrleistung-2023] */
  carKmPerPersonYear: 7_100,
  /** Ø Besetzung eines Pkw (Personen). [Quelle: uba-emissionen-2024] */
  carOccupancy: 1.4,
  /** CO₂e je Pkw-km in kg: 164 g je Personen-km × 1,4 Personen ≈ 230 g (inkl. Vorkette). [Quelle: uba-emissionen-2024] */
  carCo2KgPerKm: 0.23,
  /**
   * CO₂e je Personen-km im ÖPNV in kg. Bus 90, Tram/U-Bahn 42, Regionalbahn 44 g;
   * gewichtet ca. 58 g [Annahme Gewichtung]. [Quelle: uba-emissionen-2024]
   */
  transitCo2KgPerKm: 0.058,
  /** [Annahme] Anteil der vermiedenen Personen-km, die auf den ÖPNV verlagert werden (Rest: Rad, Fuß, kürzere Wege). */
  transitReplacementShare: 0.6,
}

export type Assumptions = typeof ASSUMPTIONS
