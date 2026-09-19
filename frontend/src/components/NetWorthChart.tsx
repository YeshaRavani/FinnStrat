import type { MonthlyResult } from "../types/strategy";
import { TrendChart } from "./TrendChart";

export function NetWorthChart({ results }: { results: MonthlyResult[] }) {
  return <TrendChart title="Net worth" tone="green" points={results.map(item => ({ month: item.month, value: item.net_worth }))} />;
}
