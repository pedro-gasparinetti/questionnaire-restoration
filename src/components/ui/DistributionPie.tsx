/**
 * DistributionPie
 *
 * Small filled pie chart that updates dynamically as the user fills
 * in percentage values. No center text — just colour segments.
 */

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: PieSlice[];
  /** Diameter in px (default 36) */
  size?: number;
}

/** Convert polar coordinates to cartesian */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build an SVG arc path for one pie slice */
function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const sweep = endDeg - startDeg;
  // Full circle: draw as two 180° arcs to avoid degenerate case
  if (Math.abs(sweep - 360) < 0.01) {
    const top = polarToCartesian(cx, cy, r, startDeg);
    const bot = polarToCartesian(cx, cy, r, startDeg + 180);
    return [
      `M ${cx} ${cy}`,
      `L ${top.x.toFixed(3)} ${top.y.toFixed(3)}`,
      `A ${r} ${r} 0 0 1 ${bot.x.toFixed(3)} ${bot.y.toFixed(3)}`,
      `A ${r} ${r} 0 0 1 ${top.x.toFixed(3)} ${top.y.toFixed(3)}`,
      "Z",
    ].join(" ");
  }
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end   = polarToCartesian(cx, cy, r, endDeg);
  const large = sweep > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

export function DistributionPie({ slices, size = 36 }: Props) {
  const C = size / 2;
  const R = C - 1; // 1px inset so strokes don't clip

  const total = slices.reduce((s, sl) => s + (Number(sl.value) || 0), 0);
  const isComplete = Math.abs(total - 100) < 0.01;

  // Build rendered slices — cap each at remaining budget so we never exceed 360°
  const rendered: { path: string; color: string }[] = [];
  let cursor = 0;
  for (const sl of slices) {
    const val = Math.max(0, Math.min(Number(sl.value) || 0, 100 - cursor));
    if (val <= 0) continue;
    const startDeg = (cursor / 100) * 360;
    const endDeg   = ((cursor + val) / 100) * 360;
    rendered.push({ path: slicePath(C, C, R, startDeg, endDeg), color: sl.color });
    cursor += val;
  }

  // The grey background disc acts as the unfilled remainder

  return (
    <span
      className="dist-pie-wrapper"
      title={`${total.toFixed(1)}%${isComplete ? " ✓" : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="dist-pie-svg"
        aria-hidden="true"
      >
        {/* Grey background disc */}
        <circle cx={C} cy={C} r={R} fill="#e2e8f0" />

        {/* Filled slices */}
        {rendered.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} />
        ))}

        {/* Thin border */}
        <circle cx={C} cy={C} r={R} fill="none" stroke="#c9d4de" strokeWidth="0.75" />
      </svg>
    </span>
  );
}
