import type { RankedStrategy, Scenario, SimulationResult, Strategy, StrategyRequest } from "../types/strategy";
import { BreakingPointCard } from "../components/BreakingPointCard";
import { CashFlowChart } from "../components/CashFlowChart";
import { MetricCard } from "../components/MetricCard";
import { NetWorthChart } from "../components/NetWorthChart";
import { ScenarioSelector } from "../components/ScenarioSelector";
import { StrategyAdjustmentPanel } from "../components/StrategyAdjustmentPanel";
import { TrendChart } from "../components/TrendChart";

type Props = {
  item: RankedStrategy;
  strategy: Strategy;
  isModified: boolean;
  targetAmount: number;
  scenarios: Scenario[];
  scenarioId: string;
  simulation: SimulationResult | null;
  loading: boolean;
  error: string;
  isDemo: boolean;
  profile: StrategyRequest["profile"];
  onScenarioChange: (id: string) => void;
  onApplyAdjustment: (strategy: Strategy) => void;
  onBack: () => void;
  onRetry: () => void;
};

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export function DashboardPage({ item, strategy, isModified, targetAmount, scenarios, scenarioId, simulation, loading, error, isDemo, profile, onScenarioChange, onApplyAdjustment, onBack, onRetry }: Props) {
  const results = simulation?.monthly_results ?? [];
  const lowestCash = results.length ? Math.min(...results.map(result => result.cash_balance)) : null;
  const final = results[results.length - 1];
  const resilience = simulation?.resilience_score ?? item.resilience_score;
  const debtPoints = results.map(result => ({ month: result.month, value: result.loan_balance + result.existing_debt_balance }));

  return (
    <main className="content dashboard-page">
      <div className="results-heading"><div><p className="section-label">DETAILED RESILIENCE ANALYSIS</p><h1>{strategy.name}</h1><p className="page-subtitle">{strategy.explanation}</p></div><button type="button" className="secondary" onClick={onBack}>Back to strategies</button></div>
      <ScenarioSelector scenarios={scenarios} selectedId={scenarioId} loading={loading} onChange={onScenarioChange} />
      <div className={isDemo ? "data-badge demo" : "data-badge live"}><i />{isDemo ? "Demo data" : "Scenario simulation"}</div>
      {error && <div className="notice" role="alert"><span>{error}</span><button type="button" className="text-action" onClick={onRetry}>Retry scenario</button></div>}
      <StrategyAdjustmentPanel strategy={strategy} targetAmount={targetAmount} onApply={onApplyAdjustment} />
      {loading ? <div className="dashboard-skeleton" aria-label="Running scenario simulation"><span /><span /><span /><span /></div> : simulation ? <>
        <div className="metric-grid">
          <MetricCard label="GOAL MATURITY" value={simulation.maturity_month ? `Month ${simulation.maturity_month}` : "Not reached"} />
          <MetricCard label="RESILIENCE" value={`${Math.round(resilience ?? 0)} / 100`} tone={(resilience ?? 0) >= 75 ? "positive" : (resilience ?? 0) >= 50 ? "warning" : "breach"} />
          <MetricCard label="LOWEST CASH" value={lowestCash === null ? "—" : inr(lowestCash)} tone={lowestCash !== null && lowestCash < profile.monthly_expenses * profile.emergency_reserve_months ? "warning" : "positive"} />
          <MetricCard label="FINAL NET WORTH" value={final ? inr(final.net_worth) : "—"} />
        </div>
        <div className="dashboard-grid charts-grid">
          <CashFlowChart results={results} />
          <TrendChart title="Investment value" tone="green" points={results.map(result => ({ month: result.month, value: result.investment_value }))} />
          <TrendChart title="Outstanding debt" tone="red" points={debtPoints} />
          <NetWorthChart results={results} />
        </div>
        <BreakingPointCard simulation={simulation} originalRecoveryMonth={isModified && scenarioId === "combined_shock" ? item.stress_simulation.recovery_month : undefined} />
      </> : <div className="empty-state"><h2>Simulation unavailable</h2><p>Choose Retry scenario to request this analysis again.</p><button type="button" className="primary compact" onClick={onRetry}>Retry scenario</button></div>}
    </main>
  );
}
