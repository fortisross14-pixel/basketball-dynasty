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
- 32 teams: the 30 real NBA franchises plus 2 expansion teams (Montreal,
  Seattle SuperSonics), 16 per conference.
- Each team has **exactly 3 named stars** plus a **support core** — a single
  49–72 rating representing the rest of the roster (no names, no stats).
- ~105 tracked players exist at any time: 96 rostered stars + ~9 free agents.
  The free-agent pool swells when contracts expire, then shrinks as teams sign.

### Team rating
A team's score is the **sum of its parts** — every piece competes for the same
budget:

    franchise star + star 2 + star 3 + coach + GM + support core

Each star, coach, and GM contributes its **rarity points** (Common 0, Uncommon
1, Rare 2, Epic 3, Legend 4). The support core contributes 0-4 by tier (70+ → 4,
65-69 → 3, 60-64 → 2, 55-59 → 1, below 55 → 0).

The total cannot exceed the team's **max-points cap** (market tier 1/2/3 plus a
random 8-12, so caps run 9-15, rerolled every offseason). This forces real
tradeoffs: a team that signs a Legend (+4), an Epic coach (+3) and has a strong
support core (+3) has only a few points left for its other two stars. A roster
of three Legends is impossible to fully field.

Free agency and the draft respect each team's **remaining budget** — a team can
only sign a player whose rarity points fit the cap room it has left.

### Contracts & careers
- Each star has a **9–14 season career** (also bounded by age).
- Contracts run **1–5 years**. When a deal expires, the player may re-sign.
- Renewal odds depend on player rarity, team record, recent playoff success,
  titles, morale, and randomness. A Legend stuck on a losing team is very
  likely to leave; a cheap role player can be cut loose by a team that wants
  to spend its cap room on an upgrade.

### Offseason (in order)
1. **Awards** — Champion, MVP, Rookie of the Year, and All-Star Starting Five
2. **Retirement** — players at the end of their careers
3. **Max-points reroll** — the random component of each team's cap changes
4. **Support-core update** — shifts on a normal distribution (−5..+5), clamped 49–72
5. **Draft** — new stars enter to refill the pool toward ~105; worst records pick first
6. **Free agency** — teams with the most unused cap space sign first
7. **Trades** — cap reconciliation: no team may finish over its cap, so
   over-cap teams trade a star (or release one and sign cheaper) until legal

Every offseason produces a full report you can review on the Offseason tab.

### Playoffs
The playoffs are an 8-seed bracket per conference (First Round → Conference
Semifinals → Conference Finals → Finals). Series lengths scale by round: First Round best-of-3, Conference
Semifinals and Conference Finals best-of-5, Finals best-of-7.

Click any series in the Playoffs tab to open it, then simulate each game one at a time (best-of-3, 5, or 7 depending on the round). From the Conference Semifinals onward, any game
decided by **5 points or fewer** opens a live **final-two-minutes play-by-play**:
the game clock counts down, possessions play out one beat at a time (~1 second
each), free throws are shown shot by shot, and the score ticks up live. You can
let it auto-play or hit **Skip to Final**. First-round games show only the final
score.

The main Advance button is locked during a playoff round until every series in
that round has a winner — then it builds the next round.

## Tabs
- **Standings** — by conference or by division
- **Teams** — filterable/sortable cards; click for full team detail
- **Stars** — sortable table of every active star; click for career detail
- **Stats** — season per-game leaders and all-time records/career boards
- **Playoffs** — interactive bracket; click any series to play it
- **Awards** — the season's Champion, MVP, Rookie of the Year, All-Star Five
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
    playbyplay.ts   final-2:00 play-by-play generator
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
