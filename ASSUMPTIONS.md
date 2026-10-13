# Assumptions & decisions

delta is an **estimation model for illustration, not a forecast**. This file
documents which values are sourced, which are model assumptions, and how gaps
were filled.

- The values are defined, with comments, in `src/config/countries.ts`
  (country metrics) and `src/config/assumptions.ts` (model assumptions).
- Sourced values reference `src/config/sources.ts` via `[Quelle: <id>]`.
  Unsourced values are marked `[Annahme]`.
- The app lists every value in the footer, with footnotes and the linked source
  list.
- A test (`src/config/sources.test.ts`) ensures every reference points to an
  existing source and every source is used.

The research was done in October 2026.

## Sourced metrics

| Metric | Germany | Netherlands | Source |
| --- | --- | --- | --- |
| Car share of all trips (driver + passenger) | 53 % | 44.7 % | MiD 2023; CBS ODiN 2023 |
| Bicycle share of all trips | 11 % | 26.8 % | MiD 2023; CBS ODiN 2023 |
| Rail punctuality | 60.1 % (DB long-distance 2025, trains < 6 min) | 90.7 % (NS main network 2025, passengers < 5 min) | DB; NS Jaarverantwoording 2025 |
| Door-to-door speed, bus/tram | 15.9 km/h | 18.9 km/h | MiD 2023 table 24; CBS 84711NED |
| Door-to-door speed, bicycle | approx. 10 km/h (Hesse as a proxy) | 11.1 km/h | MiD 2023 Hesse report; CBS 84711NED |
| Tram/light rail per 100,000 inhabitants | 4.0 km | 1.7 km | VDV statistics 2023; Wikipedia (fallback) |
| Cycle paths per 1,000 inhabitants | **0.9 km (assumption)** | 1.9 km | Fietsberaad 2012; DE: no national figure |

Comparability notes:
- The two travel surveys differ in scope: MiD covers all ages, ODiN covers ages
  6 and up. The values are only roughly comparable.
- Punctuality is defined differently. Since 2025, NS officially uses a 3-minute
  threshold (85.5 %). We use the 5-minute value because it is closest to DB's
  threshold.
- For Germany, only the length of cycle paths along federal roads is published
  (16,398 km, approx. 0.2 km per 1,000 inhabitants).

## Not sourced – kept as assumptions on purpose

- **Public transport frequency** (Germany every 20 min, Netherlands every 10 min):
  there is no comparable metric for both countries. Agora Verkehrswende finds the
  Netherlands *not* more frequently served than Germany outside the Randstad.
  - As decided, frequency still drives the public transport slider, but the app
    labels it as an assumption.
  - The slider shortens commute time through the reduction in headway: −18 % at
    Dutch level.
- **Buffer time** of 10 min/day at today's German level: this is a project
  specification; no study was found.
- **All effect sizes**: elasticities, location factors, weights and the caps on
  the probability of giving up a car.
- **Full car cost of €550/month**: deliberately below ADAC figures for new
  compact cars (approx. €640–675/month). The existing fleet is older and drives
  less (avg. 12,300 km/year).

## Model

### Sliders and effects
- Each slider interpolates linearly between the German value (0 %) and the
  benchmark value (100 %).
- Effects are calculated from the **improvement over Germany**:
  - relative reduction in headway,
  - gain in punctuality,
  - increase in bicycle share,
  - relative decline in car share.
- If a benchmark country is worse than Germany on a metric, the model applies no
  effect there rather than a deterioration.
- Example: the Netherlands has less tram network per capita than Germany, so no
  tram investment is needed.

### Time
- Commute: 52 min/day at 17 km one-way, derived from Destatis distance and time
  bands (2024). Commute time scales linearly with distance.
- Commuting: commute time × 0.36 × relative headway reduction, i.e. −18 % at Dutch
  level.
- Buffer time: proportional to unpunctuality (1 − p). For short commutes it is
  applied pro rata, and not at all without a commute.
- Everyday trips: 345 min/week for shopping, errands and leisure, derived from
  MiD 2023 table 11. Cycling effect = 0.75 × increase in bicycle share, i.e. −12 %
  at Dutch level.
- Result at full Dutch level and 17 km: big city 2.2 h, small town 2.1 h, rural
  2.0 h per week.
- The plausibility test checks the displayed value, rounded to one decimal. The
  exact rural value is 1.998 h.

### Money
- Formula: probability of giving up a car × (€550 − €63) × 12, i.e. €5,844/year
  if the car is actually given up.
- The headline number is an expected value: €4,088/year in a big city at full
  Dutch level.
- The probability is a weighted index of the four improvements, each normalised
  to the gap between Germany and the Netherlands. A cap by location then applies:
  big city 70 %, small town 45 %, rural 25 %.
- Households with 2+ cars: this concerns the second car. Probability × 1.4, capped
  at 95 %.
- Households without a car: savings from fewer taxi, car-sharing and similar costs
  (€600/year, up to −50 %) plus time gained × €8/h.

### Mobility radius
- Radius = sourced door-to-door speed × 30 min, separately for public transport
  and bicycle. The faster mode counts.
- Location factors (assumption): public transport small town × 0.8 and rural
  × 0.6, bicycle big city × 0.95.

### State
- **Cycle paths:** gap per 1,000 inhabitants × 83.5 million × €0.5 million/km.
  - This is the reference value for rural cycle paths.
  - Urban paths or cycle highways cost €1–2 million/km, so the value is on the
    conservative side.
- **Tram:** €12.5 million/km. With the Netherlands as benchmark there is no gap.
- **Rail:** punctuality gain in percentage points × 130 km × €15 million/km.
  - Anchor: 4,000 km of high-performance corridors for the Germany–Netherlands
    gap (30.6 pp).
  - Cost: the Riedbahn cost approx. €21 million/km; DB's original estimate was
    approx. €6.8 million/km.
  - Linking km to punctuality is an assumption.
- **Public transport operations:** €39 bn operating cost × relative speed gain
  (19 %) × 67 % not covered by fares, i.e. approx. €4.9 bn/year.
  - Assumption: service grows as much as speed.
  - The VDV "Deutschlandangebot" (+90 % service, +€31 bn/year) was deliberately
    not used in full, as it goes far beyond Dutch level.
- **Benefit:** external costs of car traffic according to INFRAS (2017) ×
  relative decline in car trips (15.7 % at Dutch level). It was decided to
  include all cost categories:

  | Item | € bn/year | Share variable |
  | --- | --- | --- |
  | Accidents | 48.8 | 100 % |
  | Health (air, noise) | 9.1 | 100 % |
  | Climate | 16.6 | 100 % |
  | Nature & landscape | 8.9 | 100 % |
  | Energy & vehicle production | 20.5 | 100 % |
  | Road maintenance (Böttger 2021) | 19.1 | 40 % |

  - These are societal costs, not just public budget spending.
  - Lack of physical activity is not included; no reliable source was found.
  - For comparison, BASt 2024: €40.2 bn economic cost of all road accidents,
    with a different valuation method.
- **Timeline:** 10 years of construction. Benefits and extra operating costs grow
  linearly during that time. The horizon is 30 years without discounting.
- **Result at full Dutch level:**
  - approx. €101 bn investment, of which €42 bn cycle paths and €60 bn rail,
  - plus €4.9 bn/year for operations,
  - approx. €17.5 bn/year avoided external costs,
  - break-even in year 13.

### CO₂
- Avoided car-km = 7,100 km per person per year × relative decline in car trips
  (KBA 2023).
- One car-km emits 230 g CO₂e including upstream emissions (UBA: 164 g per
  passenger-km × 1.4 persons).
- 60 % of the avoided passenger-km shift to public transport (assumption). These
  emit approx. 58 g per passenger-km (UBA; own weighting of bus, tram and
  regional rail).

## UI
- The app UI is in German; the docs are in English.
- Default state without URL parameters: all sliders at 100 % (full Dutch level),
  big city, 17 km, 1 car.
- URL parameters: `b`, `oepnv`, `bahn`, `rad`, `auto` (0–100), `lage`, `km`,
  `autos`. Invalid values fall back to the defaults.
- On mobile, a bar at the bottom keeps the headline numbers visible.
- The chart is lazy-loaded. The number animation respects "reduce motion".
- The country name in running text comes from the config field `inName`, for
  German grammar.

## Extensibility
- A new benchmark country only needs an entry in `BENCHMARKS` in
  `src/config/countries.ts`.
- Tested with a dummy country: the dropdown, sliders, URL, footer table and all
  calculations worked without code changes. The dummy was removed afterwards.
- An inline dummy country remains as a regression test in
  `src/model/index.test.ts`.
