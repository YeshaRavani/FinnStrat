import type { MonthlyResult } from "../types/strategy";
import { TrendChart } from "./TrendChart";

export function CashFlowChart({ results, comparisonResults, breachMonth }: { results: MonthlyResult[]; comparisonResults?: MonthlyResult[]; breachMonth?: number | null }) {
  return <TrendChart title="Cash balance" tone="gold" points={results.map(item => ({ month: item.month, value: item.cash_balance }))} comparisonPoints={comparisonResults?.map(item => ({ month: item.month, value: item.cash_balance }))} markers={breachMonth ? [{ month: breachMonth, label: `Breach M${breachMonth}`, tone: "red" }] : []} />;
}
