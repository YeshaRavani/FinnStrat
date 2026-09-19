type Point = { month: number; value: number };

export function TrendChart({ title, points, tone = "gold", formatter }: { title: string; points: Point[]; tone?: "gold" | "green" | "red" | "gray"; formatter?: (value: number) => string }) {
  const fmt = formatter ?? (value => `₹${Math.round(value).toLocaleString("en-IN")}`);
  if (points.length === 0) return <section className="chart-panel"><span className="chart-label">{title}</span><div className="empty-chart">No monthly data is available for this simulation.</div></section>;
  const values = points.map(point => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const y = (value: number) => 94 - ((value - min) / range) * 84;
  const path = points.map((point, index) => `${index ? "L" : "M"}${(index / Math.max(points.length - 1, 1)) * 100},${y(point.value)}`).join(" ");
  return (
    <section className="chart-panel">
      <div className="chart-heading"><div><span className="chart-label">{title}</span><strong>{fmt(values[values.length - 1])}</strong></div><span className="chart-range">MONTH 1–{points[points.length - 1].month}</span></div>
      <svg className={`line-chart tone-${tone}`} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${title} over ${points.length} months`}>
        <line x1="0" y1={y(0)} x2="100" y2={y(0)} className="zero-line" />
        <path d={path} className="chart-line" />
      </svg>
    </section>
  );
}
