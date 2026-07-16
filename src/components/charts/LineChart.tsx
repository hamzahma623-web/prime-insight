// Mehrreihiger Liniengraph. Reines SVG, responsiv über viewBox, keine Libs.

export interface LineSeries {
  name: string;
  values: number[];
  color: string; // z. B. "var(--accent)"
  area?: boolean;
}

export function LineChart({
  series,
  labels,
  min,
  max,
  height = 260,
  valueFormat = (n) => n.toFixed(1),
}: {
  series: LineSeries[];
  labels: string[];
  min?: number;
  max?: number;
  height?: number;
  valueFormat?: (n: number) => string;
}) {
  const W = 640;
  const H = height;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 30;

  const all = series.flatMap((s) => s.values);
  const dataMin = min ?? Math.min(...all);
  const dataMax = max ?? Math.max(...all);
  const span = dataMax - dataMin || 1;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const count = labels.length;
  const stepX = count > 1 ? plotW / (count - 1) : 0;

  const xAt = (i: number) => padL + i * stepX;
  const yAt = (v: number) => padT + (1 - (v - dataMin) / span) * plotH;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => {
    const v = dataMin + (span * i) / gridLines;
    return { v, y: yAt(v) };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Liniendiagramm"
    >
      {/* Gitternetz */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={t.y}
            y2={t.y}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={t.y + 3}
            textAnchor="end"
            className="fill-[var(--muted-foreground)]"
            fontSize={10}
          >
            {valueFormat(t.v)}
          </text>
        </g>
      ))}

      {/* X-Beschriftung */}
      {labels.map((label, i) => (
        <text
          key={label}
          x={xAt(i)}
          y={H - 10}
          textAnchor="middle"
          className="fill-[var(--muted-foreground)]"
          fontSize={10}
        >
          {label}
        </text>
      ))}

      {/* Reihen */}
      {series.map((s) => {
        const pts = s.values.map((v, i) => [xAt(i), yAt(v)] as const);
        const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
        const areaPts = `${xAt(0)},${padT + plotH} ${line} ${xAt(
          count - 1,
        )},${padT + plotH}`;
        return (
          <g key={s.name}>
            {s.area ? (
              <polygon points={areaPts} fill={s.color} opacity={0.08} />
            ) : null}
            <polyline
              points={line}
              fill="none"
              stroke={s.color}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={3} fill={s.color}>
                <title>{`${s.name} · ${labels[i]}: ${valueFormat(
                  s.values[i],
                )}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
