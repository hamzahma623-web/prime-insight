// Radiale Gauge (270°-Bogen) für den Quality Score. Reines SVG.
export function RadialGauge({
  value,
  max = 100,
  size = 132,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
}) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.75; // 270°
  const arc = circumference * sweep;
  const ratio = Math.max(0, Math.min(1, value / max));

  // Farbschwellen: gut / beobachten / kritisch
  const color =
    ratio >= 0.82
      ? "var(--success)"
      : ratio >= 0.7
        ? "var(--warning)"
        : "var(--danger)";

  // Startpunkt unten links (Gap unten mittig), Drehung um 135°.
  const rotation = 135;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(${rotation} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc * ratio} ${circumference}`}
          />
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
          {Math.round(value)}
        </span>
        {label ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
