/** Drifting embers and dust over the hero. Deterministic layout, CSS-only motion. */
const COUNT = 22;
const particles = Array.from({ length: COUNT }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = (n: number) => ((seed * (n + 1)) % 1000) / 1000;
  return {
    left: `${(r(1) * 100).toFixed(1)}%`,
    size: `${(1.5 + r(2) * 3).toFixed(1)}px`,
    duration: `${(9 + r(3) * 10).toFixed(1)}s`,
    delay: `${(-r(4) * 18).toFixed(1)}s`,
    drift: `${((r(5) - 0.5) * 120).toFixed(0)}px`,
    ember: i % 3 === 0,
  };
});

export function Embers() {
  return (
    <div className="bf-embers" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className={p.ember ? "bf-ember" : "bf-dust"}
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              "--drift": p.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
