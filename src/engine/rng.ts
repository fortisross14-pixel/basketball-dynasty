// ═══ Deterministic RNG + helpers ═══

let seed = (Date.now() % 2147483647) || 12345;

export function setSeed(s: number) {
  seed = s % 2147483647;
  if (seed <= 0) seed += 2147483646;
}
export function rng(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
export function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
export function chance(p: number): boolean {
  return rng() < p;
}
export function gaussian(mean: number, sd: number): number {
  const u = 1 - rng();
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

let idCounter = 0;
export function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}${idCounter.toString(36)}${Math.floor(rng() * 1e6).toString(36)}`;
}
