import type { MonthlyResult } from "../types/strategy";
import { TrendChart } from "./TrendChart";

export function NetWorthChart({ results, comparisonResults, breachMonth }: { results: MonthlyResult[]; comparisonResults?: MonthlyResult[]; breachMonth?: number | null }) {
  return <TrendChart title="Net worth" tone="green" points={results.map(item => ({ month: item.month, value: item.net_worth }))} comparisonPoints={comparisonResults?.map(item => ({ month: item.month, value: item.net_worth }))} markers={breachMonth ? [{ month: breachMonth, label: `Breach M${breachMonth}`, tone: "red" }] : []} />;
}
