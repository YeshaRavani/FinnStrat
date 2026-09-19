import type { MonthlyResult } from "../types/strategy";
import { TrendChart } from "./TrendChart";

export function CashFlowChart({ results }: { results: MonthlyResult[] }) {
  return <TrendChart title="Cash balance" tone="gold" points={results.map(item => ({ month: item.month, value: item.cash_balance }))} />;
}
