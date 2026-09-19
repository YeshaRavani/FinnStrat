export function MetricCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "positive" | "warning" | "breach" | "neutral" }) {
  return <div className={`metric-card tone-${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}
