# Basketball Dynasty Simulator

A multi-season basketball management simulation. Build a franchise, draft
generational talent, navigate contracts and free agency, and chase rings
across decades of alternate basketball history.

## Running it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

To build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Deploying to GitHub Pages

`vite.config.ts` is preset with `base: '/basketball-dynasty/'` and a workflow
at `.github/workflows/deploy.yml`. Push to the `main` branch of a repo named
`basketball-dynasty` and GitHub Actions deploys automatically — the repo URL
becomes the live URL. If you use a different repo name, change the `base`
value to match.

## How the game works

### Save slots
The home screen has **3 save slots**, stored in your browser's `localStorage`.
Progress **autosaves to the active slot after every advance**. You can also
**Export** a save to a JSON file and **Import** it later.

### The league
- 32 teams across 2 conferences and 8 divisions.
- Each team has **exactly 3 named stars** plus a **support core** — a single
  49–72 rating representing the rest of the roster (no names, no stats).
- ~105 tracked players exist at any time: 96 rostered stars + ~9 free agents.
  The free-agent pool swells when contracts expire, then shrinks as teams sign.

### Team rating
A team's effective rating combines:
- **Base quality** from the 3 stars' overall ratings (franchise star weighted heaviest)
- **Rarity bonus**: franchise-star rarity + coach rarity + a capped bonus from
  the other two stars and the GM, minus a support-core penalty
- Clamped to the team's **max-points cap** (market value + a random 8–12 that
  rerolls every offseason)

### Contracts & careers
- Each star has a **9–14 season career** (also bounded by age).
- Contracts run **1–5 years**. When a deal expires, the player may re-sign.
- Renewal odds depend on player rarity, team record, recent playoff success,
  titles, morale, and randomness. A Legend stuck on a losing team is very
  likely to leave; a cheap role player can be cut loose by a team that wants
  to spend its cap room on an upgrade.

### Offseason (in order)
1. **Retirement** — players at the end of their careers
2. **Max-points reroll** — the random component of each team's cap changes
3. **Support-core update** — shifts on a normal distribution (−5..+5), clamped 49–72
4. **Draft** — new stars enter to refill the pool toward ~105; worst records pick first
5. **Free agency** — teams with the most unused cap space sign first

Every offseason produces a full report you can review on the Offseason tab.

## Tabs
- **Standings** — by conference or by division
- **Teams** — filterable/sortable cards; click for full team detail
- **Stars** — sortable table of every active star; click for career detail
- **Stats** — season per-game leaders and all-time records/career boards
- **Playoffs** — live bracket
- **Offseason** — the most recent offseason report

## Architecture

The code is layered so any piece can be swapped without touching the others:

```
src/
  engine/   pure simulation logic (no React)
    types.ts        domain types + tuning constants
    rng.ts          deterministic RNG + helpers
    league.ts       team rating math
    contracts.ts    renewal probability & contract offers
    setup.ts        initial league construction
    simulation.ts   single-game simulation
    season.ts       weekly sim + playoffs
    offseason.ts    full offseason pipeline
  data/     the "database" — teams & player generation
    teamSeeds.ts    32 franchises + relocation cities
    generators.ts   procedural players, coaches, GMs
  state/    persistence
    saves.ts        save slots, autosave, export/import
  ui/       React screens & components (presentation only)
```

The engine never imports from `ui/`. Swap the data files for a different
league, or replace the UI entirely, and the simulation still runs.
