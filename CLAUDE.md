# delta – notes for Claude

## Facts to keep

- Deutschlandticket price: 63 €/month in 2026, 68 €/month from 2027 on.
  The model (`transitTicketPerMonth` in `src/config/assumptions.ts`) uses the
  2026 price. Bump it to 68 and update `ASSUMPTIONS.md` when the model year
  moves to 2027.

## Deferred ideas

- Rework the car-free money and bike-time assumptions: make the taxi/carsharing
  baseline (`noCarSubstituteCostPerYear`, flat 600 €/year) depend on location,
  and revisit `bikeTimeElasticity` (more cycling is assumed to shorten everyday
  trips, which is debatable). Deferred by Richard in October 2026, maybe later.
