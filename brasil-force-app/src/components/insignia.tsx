/**
 * Original Brasil Force insignia (drawn for this site, not based on any game or
 * institution): green-yellow ribbon, eight-point star, laurel and BF monogram.
 */
const tiers = {
  bronze: { light: "#f0b98a", mid: "#b8733f", dark: "#6e3d1c" },
  prata: { light: "#f4f6f8", mid: "#aab4be", dark: "#5b6672" },
  ouro: { light: "#fff1bf", mid: "#e2b04a", dark: "#8a5a12" },
} as const;
export type Tier = keyof typeof tiers;

function star(cx: number, cy: number, outer: number, inner: number, points = 8) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / points) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

export function Insignia({ tier, className = "" }: { tier: Tier; className?: string }) {
  const c = tiers[tier];
  const id = `bf-ins-${tier}`;
  return (
    <svg className={className} viewBox="0 0 120 170" role="img" aria-label={`Insígnia ${tier}`}>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.5" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#2a6b48" />
          <stop offset="1" stopColor="#0d2a1c" />
        </radialGradient>
      </defs>
      {/* Ribbon */}
      <path d="M38 0h44l-6 58H44z" fill="#159447" />
      <path d="M52 0h16l-2 58H54z" fill="#f7d44a" />
      <path d="M44 58h32l-4 10H48z" fill={c.dark} />
      {/* Star body */}
      <polygon points={star(60, 112, 50, 30)} fill={`url(#${id}-metal)`} stroke={c.dark} strokeWidth="1.2" />
      <polygon points={star(60, 112, 40, 26)} fill="none" stroke={c.light} strokeOpacity=".55" strokeWidth=".8" />
      {/* Core disc with laurel */}
      <circle cx="60" cy="112" r="24" fill={`url(#${id}-core)`} stroke={`url(#${id}-metal)`} strokeWidth="3" />
      {[-1, 1].map((side) =>
        [0, 1, 2, 3, 4].map((i) => {
          // Wreath: two branches rising from the bottom of the disc.
          const a = (Math.PI / 180) * (90 + side * (34 + i * 27));
          const x = 60 + 18 * Math.cos(a);
          const y = 112 + 18 * Math.sin(a);
          return (
            <ellipse
              key={`${side}-${i}`}
              cx={x.toFixed(2)}
              cy={y.toFixed(2)}
              rx="2.2"
              ry="4.4"
              fill={c.mid}
              transform={`rotate(${((a * 180) / Math.PI + 90).toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})`}
            />
          );
        }),
      )}
      <text x="60" y="118" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontWeight="700" fontSize="17" fill={c.light}>
        BF
      </text>
    </svg>
  );
}
