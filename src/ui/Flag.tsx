// ═══ Inline SVG flags — render identically in every browser ═══
// viewBox is 3:2 (60×40). Designs are simplified but recognizable.

interface FlagProps {
  abbr: string;
  size?: number;   // rendered width in px (height = size * 2/3)
}

// each entry returns the inner SVG content for a 60×40 canvas
const FLAGS: Record<string, () => React.ReactNode> = {
  USA: () => (
    <>
      {/* 13 stripes */}
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x="0" y={(i * 40) / 13} width="60" height={40 / 13}
          fill={i % 2 === 0 ? '#b22234' : '#fff'} />
      ))}
      <rect x="0" y="0" width="24" height={40 * 7 / 13} fill="#3c3b6e" />
      {/* a few stars suggested as dots */}
      {[4, 10, 16].map((x) => [4, 9, 14].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill="#fff" />
      )))}
    </>
  ),
  SLO: () => (
    <>
      <rect width="60" height="13.33" fill="#fff" />
      <rect y="13.33" width="60" height="13.33" fill="#0050a0" />
      <rect y="26.66" width="60" height="13.34" fill="#d00" />
      <rect x="10" y="6" width="14" height="14" fill="#0050a0" />
      <rect x="11" y="7" width="12" height="9" fill="#fff" />
    </>
  ),
  SRB: () => (
    <>
      <rect width="60" height="13.33" fill="#c6363c" />
      <rect y="13.33" width="60" height="13.33" fill="#0c4076" />
      <rect y="26.66" width="60" height="13.34" fill="#fff" />
      <rect x="16" y="9" width="9" height="22" fill="#edb92e" />
    </>
  ),
  GRE: () => (
    <>
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} y={(i * 40) / 9} width="60" height={40 / 9}
          fill={i % 2 === 0 ? '#0d5eaf' : '#fff'} />
      ))}
      <rect width="22.2" height="22.2" fill="#0d5eaf" />
      <rect x="8.8" y="0" width="4.6" height="22.2" fill="#fff" />
      <rect x="0" y="8.8" width="22.2" height="4.6" fill="#fff" />
    </>
  ),
  ESP: () => (
    <>
      <rect width="60" height="10" fill="#aa151b" />
      <rect y="10" width="60" height="20" fill="#f1bf00" />
      <rect y="30" width="60" height="10" fill="#aa151b" />
      <rect x="12" y="15" width="7" height="10" fill="#aa151b" opacity="0.85" />
    </>
  ),
  GER: () => (
    <>
      <rect width="60" height="13.33" fill="#000" />
      <rect y="13.33" width="60" height="13.33" fill="#d00" />
      <rect y="26.66" width="60" height="13.34" fill="#ffce00" />
    </>
  ),
  FRA: () => (
    <>
      <rect width="20" height="40" fill="#0055a4" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ef4135" />
    </>
  ),
  ARG: () => (
    <>
      <rect width="60" height="13.33" fill="#74acdf" />
      <rect y="13.33" width="60" height="13.33" fill="#fff" />
      <rect y="26.66" width="60" height="13.34" fill="#74acdf" />
      <circle cx="30" cy="20" r="4.4" fill="#f6b40e" />
    </>
  ),
  CMR: () => (
    <>
      <rect width="20" height="40" fill="#007a5e" />
      <rect x="20" width="20" height="40" fill="#ce1126" />
      <rect x="40" width="20" height="40" fill="#fcd116" />
      <polygon points="30,15 31.5,19 35.5,19 32.3,21.5 33.5,25.5 30,23 26.5,25.5 27.7,21.5 24.5,19 28.5,19"
        fill="#fcd116" />
    </>
  ),
  AUS: () => (
    <>
      <rect width="60" height="40" fill="#00247d" />
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="3" />
      <path d="M15,0 L15,20 M0,10 L30,10" stroke="#fff" strokeWidth="4" />
      <path d="M15,0 L15,20 M0,10 L30,10" stroke="#e4002b" strokeWidth="2" />
      <circle cx="45" cy="28" r="2.4" fill="#fff" />
      <circle cx="38" cy="14" r="1.6" fill="#fff" />
      <circle cx="50" cy="10" r="1.6" fill="#fff" />
      <circle cx="52" cy="22" r="1.6" fill="#fff" />
      <circle cx="42" cy="34" r="1.6" fill="#fff" />
      <circle cx="15" cy="30" r="2.2" fill="#fff" />
    </>
  ),
  CAN: () => (
    <>
      <rect width="60" height="40" fill="#fff" />
      <rect width="15" height="40" fill="#d80621" />
      <rect x="45" width="15" height="40" fill="#d80621" />
      <polygon points="30,9 32,16 38,14 34,20 39,23 33,24 34,31 30,26 26,31 27,24 21,23 26,20 22,14 28,16"
        fill="#d80621" />
    </>
  ),
  LTU: () => (
    <>
      <rect width="60" height="13.33" fill="#fdb913" />
      <rect y="13.33" width="60" height="13.33" fill="#006a44" />
      <rect y="26.66" width="60" height="13.34" fill="#c1272d" />
    </>
  ),
  CRO: () => (
    <>
      <rect width="60" height="13.33" fill="#ff0000" />
      <rect y="13.33" width="60" height="13.33" fill="#fff" />
      <rect y="26.66" width="60" height="13.34" fill="#171796" />
      <rect x="25" y="13" width="10" height="9" fill="#ff0000" />
      <rect x="25" y="13" width="10" height="3" fill="#fff" />
    </>
  ),
  NGA: () => (
    <>
      <rect width="20" height="40" fill="#008751" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#008751" />
    </>
  ),
  BRA: () => (
    <>
      <rect width="60" height="40" fill="#009b3a" />
      <polygon points="30,5 55,20 30,35 5,20" fill="#fedf00" />
      <circle cx="30" cy="20" r="8" fill="#002776" />
    </>
  ),
};

export function Flag({ abbr, size = 18 }: FlagProps) {
  const render = FLAGS[abbr];
  const h = (size * 2) / 3;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 40"
      className="flag-svg"
      aria-label={abbr}
      role="img"
    >
      {render ? render() : <rect width="60" height="40" fill="#444" />}
    </svg>
  );
}
