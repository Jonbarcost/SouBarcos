/**
 * Dotted world map (generated once with dotted-map, MIT) with animated routes
 * leaving Brazil. Pin positions match public/images/world-dots.svg (136×65).
 */
const ORIGIN = { x: 49, y: 44.17 };
const routes = [
  { id: "na", label: "AMÉRICA DO NORTE", x: 40, y: 21.65 },
  { id: "eu", label: "EUROPA", x: 68.5, y: 17.32 },
  { id: "af", label: "ÁFRICA", x: 78.5, y: 48.5 },
  { id: "me", label: "ORIENTE MÉDIO", x: 88, y: 28.58 },
  { id: "as", label: "ÁSIA", x: 120.5, y: 24.25 },
];

function arc(to: { x: number; y: number }) {
  const mx = (ORIGIN.x + to.x) / 2;
  const my = (ORIGIN.y + to.y) / 2;
  const lift = Math.hypot(to.x - ORIGIN.x, to.y - ORIGIN.y) * 0.35;
  return `M${ORIGIN.x} ${ORIGIN.y} Q${mx} ${my - lift} ${to.x} ${to.y}`;
}

export function WorldRoutes() {
  return (
    <div className="bf-world" aria-hidden="true">
      <div className="bf-world-map">
        <svg viewBox="0 0 136 65" className="bf-world-routes">
          <defs>
            <linearGradient id="bf-route" x1="0" x2="1">
              <stop offset="0" stopColor="#1e8054" />
              <stop offset="1" stopColor="#f3d79f" />
            </linearGradient>
          </defs>
          {routes.map((r, i) => (
            <g key={r.id} style={{ "--i": i } as React.CSSProperties}>
              <path className="bf-route-path" d={arc(r)} pathLength={100} />
              <circle className="bf-route-dot" cx={r.x} cy={r.y} r="0.9" />
              <circle className="bf-route-ping" cx={r.x} cy={r.y} r="0.9" />
              <text className="bf-route-label" x={r.x} y={r.y - 2.2} textAnchor="middle">
                {r.label}
              </text>
            </g>
          ))}
          <circle className="bf-origin-ring" cx={ORIGIN.x} cy={ORIGIN.y} r="3.2" />
          <circle className="bf-origin-ping" cx={ORIGIN.x} cy={ORIGIN.y} r="1.4" />
          <circle className="bf-origin" cx={ORIGIN.x} cy={ORIGIN.y} r="1.3" />
          <text className="bf-route-label bf-origin-label" x={ORIGIN.x + 3} y={ORIGIN.y + 4.5}>
            BRASIL · BASE
          </text>
        </svg>
      </div>
      <div className="bf-world-readout">
        <span>
          <i className="bf-hud-led" /> ROTAS GLOBAIS
        </span>
        <span>05 DESTINOS · ORIGEM S 15°48′ O 47°53′</span>
      </div>
    </div>
  );
}
