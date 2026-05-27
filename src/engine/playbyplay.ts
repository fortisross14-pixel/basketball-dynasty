// ═══ Final-two-minutes play-by-play generator ═══
// Used only for close (≤5 pt) playoff games in rounds 2+ (not the First Round).
// Reconstructs a believable final 2:00 that lands EXACTLY on the real final
// score — points are pre-allocated to possessions so the running total never
// makes an unrealistic jump.
import type { Team, Player, PlayByPlayBeat } from './types';
import { rng, randInt, pick, chance } from './rng';

function clockStr(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TWO_DESC = [
  'drives the lane', 'pulls up from mid-range', 'backs his man down',
  'cuts baseline', 'attacks off the dribble', 'spins into the paint',
  'rises up from the elbow', 'slips to the rim',
];
const THREE_DESC = [
  'spots up from deep', 'pulls from way downtown', 'rises from the corner',
  'steps into a three', 'launches from the wing', 'fires from the top of the key',
];
const MISS_DESC = [
  'rims out', 'off the iron', 'short — front rim', 'in and out!', 'just long',
  'rattles out', 'no good',
];

// scoring play kinds: 0 miss, 2 layup, 3 three, 'ft1' one made FT, 'ft2' two made FTs, 'ft3' three made FTs
type Play = 0 | 2 | 3 | 'ft1' | 'ft2' | 'ft3';

/**
 * Decompose a window-point total into a list of scoring plays whose values
 * sum EXACTLY to the total. Realistic late-game mix: mostly 2s and free
 * throws, with three-pointers as an occasional swing (~1 in 5 made baskets),
 * never a barrage.
 */
function decompose(total: number): Play[] {
  const plays: Play[] = [];
  let r = total;
  // cap how many 3s a single team's final-2:00 window may contain
  let threesLeft = total >= 11 ? 2 : 1;
  while (r > 0) {
    if (r >= 3 && threesLeft > 0 && chance(0.2)) {
      // an occasional three
      plays.push(3); r -= 3; threesLeft -= 1;
    } else if (r >= 2) {
      // a 2 — sometimes from the free-throw line
      if (chance(0.3)) { plays.push('ft2'); r -= 2; }
      else { plays.push(2); r -= 2; }
    } else if (r === 1) {
      plays.push('ft1'); r -= 1;
    } else {
      // r is an odd leftover ≥3 with no threes allowed — take a 2
      plays.push(2); r -= 2;
    }
  }
  return plays;
}

export function buildPlayByPlay(
  home: Team, away: Team, homeFinal: number, awayFinal: number,
  homeStars: Player[], awayStars: Player[],
): PlayByPlayBeat[] {
  const beats: PlayByPlayBeat[] = [];

  // points scored by each side in the final 2:00 (realistic chunk)
  const homeWindow = Math.min(homeFinal, randInt(6, 12));
  const awayWindow = Math.min(awayFinal, randInt(6, 12));

  const homeScores = decompose(homeWindow);
  const awayScores = decompose(awayWindow);

  // pad each side with a few misses/stops so it's not all makes
  const homeMisses = randInt(2, 4);
  const awayMisses = randInt(2, 4);
  const homePoss: Play[] = [...homeScores, ...Array(homeMisses).fill(0 as Play)];
  const awayPoss: Play[] = [...awayScores, ...Array(awayMisses).fill(0 as Play)];
  shuffleInPlace(homePoss);
  shuffleInPlace(awayPoss);

  let homeScore = homeFinal - homeWindow;
  let awayScore = awayFinal - awayWindow;

  // interleave possessions
  type Poss = { home: boolean; play: Play };
  const seq: Poss[] = [];
  let hi = 0, ai = 0;
  let turn = chance(0.5);
  while (hi < homePoss.length || ai < awayPoss.length) {
    if (turn && hi < homePoss.length) seq.push({ home: true, play: homePoss[hi++] });
    else if (!turn && ai < awayPoss.length) seq.push({ home: false, play: awayPoss[ai++] });
    else if (hi < homePoss.length) seq.push({ home: true, play: homePoss[hi++] });
    else if (ai < awayPoss.length) seq.push({ home: false, play: awayPoss[ai++] });
    turn = !turn;
  }

  let clock = 120;
  const step = Math.max(6, Math.floor(118 / Math.max(1, seq.length)));

  for (const { home: onHome, play } of seq) {
    clock = Math.max(2, clock - step - randInt(-3, 4));
    const team = onHome ? home : away;
    const stars = onHome ? homeStars : awayStars;
    const defStars = onHome ? awayStars : homeStars;
    const star = pick(stars);
    const add = (n: number) => { if (onHome) homeScore += n; else awayScore += n; };
    const cs = () => clockStr(Math.max(0, clock));
    const push = (text: string, kind: PlayByPlayBeat['kind']) =>
      beats.push({ clock: cs(), teamAbbr: team.abbr, text, kind, homeScore, awayScore });

    if (play === 3) {
      push(`${star.name} ${pick(THREE_DESC)}...`, 'setup');
      add(3);
      push('BANG! Three-pointer is GOOD!', 'make');
    } else if (play === 2) {
      push(`${star.name} ${pick(TWO_DESC)}...`, 'setup');
      add(2);
      push('Scores! Lays it in.', 'make');
    } else if (play === 'ft1' || play === 'ft2' || play === 'ft3') {
      const shots = play === 'ft1' ? 1 : play === 'ft2' ? 2 : 3;
      push(`${star.name} draws the foul — to the line for ${shots}.`, 'setup');
      const ordinals = ['First', 'Second', 'Third'];
      for (let k = 0; k < shots; k++) {
        add(1);
        push(`${ordinals[k]} free throw... good.`, 'ft');
      }
    } else {
      if (chance(0.5)) {
        push(`${star.name} ${pick(rng() < 0.5 ? TWO_DESC : THREE_DESC)}...`, 'setup');
        push(`${pick(MISS_DESC)} — rebound.`, 'miss');
      } else {
        const defender = pick(defStars);
        push(`${star.name} probes the defense...`, 'setup');
        push(`${defender.name} digs it out — turnover!`, 'miss');
      }
    }
  }

  const winner = homeFinal > awayFinal ? home : away;
  beats.push({
    clock: '0:00', teamAbbr: winner.abbr,
    text: `Final buzzer! ${winner.city} ${winner.name} take it.`,
    kind: 'final', homeScore: homeFinal, awayScore: awayFinal,
  });

  return beats;
}

function shuffleInPlace<T>(a: T[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
