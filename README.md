# delta – transport simulator

What would change for you and for the state if public transport, rail and cycling
infrastructure in Germany reached the level of a benchmark country (default: the
Netherlands)? delta is an interactive explainer that makes the orders of magnitude
tangible: **time and money**. It is **not a scientific model and not a forecast**.

The app is in German, as it is aimed at a German audience.

<p>
  <img src="docs/screenshots/desktop.png" alt="delta on desktop: profile, four sliders and the headline numbers – 2.2 hours per week and €4,091 per year saved at full Dutch level" width="68%">
  <img src="docs/screenshots/mobile.png" alt="delta on mobile: investment, avoided external costs and the cumulative cost–benefit chart with break-even in year 13" width="28%">
</p>

## What it shows

- **Inputs:** four sliders from "Germany today" (0 %) to "benchmark level" (100 %).
  The sliders cover public transport frequency, rail punctuality, cycling
  infrastructure and car dependency. Each one shows its real metric. A compact
  profile sets where you live, your commute distance and how many cars your
  household has. You can also pick the benchmark country.
- **Personal results:** hours saved per week and euros saved per year, animated
  as you move the sliders. A mobility radius shows how far you get in 30 minutes
  without a car, today vs. the scenario.
- **State perspective:** total investment, avoided external costs of car traffic
  per year, and a 30-year cumulative cost–benefit chart with the break-even year
  marked. A CO₂e side effect per person is shown as well.
- **Sharing and transparency:** every scenario can be shared via URL parameters.
  The footer lists every value used, with footnotes to the source list or an
  "Annahme" (assumption) label.

## Getting started

```bash
npm install
npm run dev      # development server
npm test         # tests (Vitest)
npm run build    # static build into dist/
npm run preview  # serve the build locally
```

The build is fully static (relative paths) and can be deployed to any web host.

Stack: Vite, React, TypeScript, Tailwind CSS, Recharts and Vitest. There is no
backend.

## Project structure

| Path | Contents |
| --- | --- |
| `src/config/countries.ts` | Metrics per country (Germany + benchmarks), each with a source reference or marked as an assumption |
| `src/config/assumptions.ts` | Model assumptions: costs, effect sizes, location factors |
| `src/config/sources.ts` | Source registry; config values reference it via `[Source: <id>]` |
| `src/config/sliders.ts` | Slider labels and the metric each slider displays |
| `src/model/` | Pure calculation functions without UI, fully tested |
| `src/lib/` | Formatting (de-DE) and URL state for sharing |
| `src/components/` | UI components |

## Adding a benchmark country

Add an entry to `BENCHMARKS` in `src/config/countries.ts`. Nothing else is
needed: the model, the dropdown, the slider metrics, the URL parameter and the
footer table all pick the new country up automatically. If a country is worse
than Germany on a metric, the model applies no effect for it rather than a
deterioration.

## Data, sources and assumptions

- The key metrics come from public sources, including MiD 2023, CBS ODiN 2023,
  DB and NS punctuality reports, VDV, INFRAS, UBA, KBA and Destatis. The research
  was done in October 2026.
- Effect sizes such as elasticities and location factors are model assumptions
  and are labelled as such.
- A test (`src/config/sources.test.ts`) checks that every source reference in the
  config and footer points to an existing source.

See [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) for which values are sourced, which are
assumptions, and how gaps were filled.
