type Point = { month: number; value: number };
type Marker = { month: number; label: string; tone?: "gold" | "red" | "green" };

export function TrendChart({ title, points, tone = "gold", formatter, comparisonPoints, markers = [] }: { title: string; points: Point[]; tone?: "gold" | "green" | "red" | "gray"; formatter?: (value: number) => string; comparisonPoints?: Point[]; markers?: Marker[] }) {
  const fmt = formatter ?? (value => `₹${Math.round(value).toLocaleString("en-IN")}`);
  if (points.length === 0) return <section className="chart-panel"><span className="chart-label">{title}</span><div className="empty-chart">No monthly data is available for this simulation.</div></section>;
  const values = [...points, ...(comparisonPoints ?? [])].map(point => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const chartLeft = 12;
  const chartWidth = 88;
  const x = (index: number, count: number) => chartLeft + (index / Math.max(count - 1, 1)) * chartWidth;
  const y = (value: number) => 94 - ((value - min) / range) * 84;
  const pathFor = (series: Point[]) => series.map((point, index) => `${index ? "L" : "M"}${x(index, series.length)},${y(point.value)}`).join(" ");
  const compact = (value: number) => {
    const absolute = Math.abs(value);
    if (absolute >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
    if (absolute >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
    if (absolute >= 1_000) return `₹${(value / 1_000).toFixed(0)}k`;
    return `₹${Math.round(value)}`;
  };
  const yLabels = [max, min + range / 2, min];
  const markerX = (month: number) => chartLeft + ((month - 1) / Math.max(points[points.length - 1].month - 1, 1)) * chartWidth;
  return (
    <section className="chart-panel">
      <div className="chart-heading"><div><span className="chart-label">{title}</span><strong>{fmt(points[points.length - 1].value)}</strong></div><span className="chart-range">MONTH 1–{points[points.length - 1].month}</span></div>
      {comparisonPoints && comparisonPoints.length > 0 && <div className="chart-legend"><span className="legend-selected">Selected scenario</span><span className="legend-normal">Normal conditions</span></div>}
      <svg className={`line-chart tone-${tone}`} viewBox="0 0 112 100" preserveAspectRatio="none" role="img" aria-label={`${title} over ${points.length} months`}>
        {yLabels.map((label, index) => <text key={`${label}-${index}`} x="0" y={index === 0 ? 9 : index === 1 ? 51 : 95} className="axis-label">{compact(label)}</text>)}
        <line x1={chartLeft} y1={y(0)} x2="100" y2={y(0)} className="zero-line" />
        {comparisonPoints && comparisonPoints.length > 0 && <path d={pathFor(comparisonPoints)} className="chart-line comparison-line" />}
        <path d={pathFor(points)} className="chart-line" />
        {points.map((point, index) => <circle key={`${point.month}-${point.value}`} cx={x(index, points.length)} cy={y(point.value)} r="1.2" className="chart-point"><title>{`Month ${point.month}: ${fmt(point.value)}`}</title></circle>)}
        {markers.filter(marker => marker.month >= 1 && marker.month <= points[points.length - 1].month).map(marker => <g key={`${marker.month}-${marker.label}`} className={`chart-marker marker-${marker.tone ?? "gold"}`}><line x1={markerX(marker.month)} y1="5" x2={markerX(marker.month)} y2="95" /><text x={Math.min(markerX(marker.month) + 1, 88)} y="8">{marker.label}</text></g>)}
      </svg>
    </section>
  );
}
