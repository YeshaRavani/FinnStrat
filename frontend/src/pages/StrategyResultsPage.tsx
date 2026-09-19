import type { AffordabilityResult, RankedStrategy, RankingPreference } from "../types/strategy";
import { PreferenceSelector } from "../components/PreferenceSelector";
import { StrategyCard } from "../components/StrategyCard";
import { StrategyComparison } from "../components/StrategyComparison";
import { finalNormalNetWorth } from "../utils/loanMath";

type Props = {
  strategies: RankedStrategy[];
  goalName: string;
  preference: RankingPreference;
  selectedId: string | null;
  comparedIds: string[];
  loading: boolean;
  isDemo: boolean;
  error: string;
  onSelect: (item: RankedStrategy) => void;
  onOpen: (item: RankedStrategy) => void;
  onCompare: (id: string, checked: boolean) => void;
  onPreferenceChange: (preference: RankingPreference) => void;
  onRetry: () => void;
  onEdit: () => void;
  affordability: AffordabilityResult | null;
};

export function StrategyResultsPage({ strategies, goalName, preference, selectedId, comparedIds, loading, isDemo, error, affordability, onSelect, onOpen, onCompare, onPreferenceChange, onRetry, onEdit }: Props) {
  const selected = strategies.find(item => item.strategy.id === selectedId) ?? null;
  const compared = strategies.filter(item => comparedIds.includes(item.strategy.id));
  const bestNormal = [...strategies].sort((a, b) => finalNormalNetWorth(b) - finalNormalNetWorth(a))[0];
  const bestResilience = [...strategies].sort((a, b) => b.resilience_score - a.resilience_score)[0];
  const fastest = [...strategies].sort((a, b) => (a.maturity_month ?? Infinity) - (b.maturity_month ?? Infinity))[0];
  const lowestDebt = [...strategies].sort((a, b) => b.debt_score - a.debt_score)[0];

  return (
    <main className="content results-page">
      <div className="results-heading"><div><p className="section-label">STRATEGY RESULTS</p><h1>Plans for {goalName}</h1></div><button type="button" className="secondary" onClick={onEdit}>Edit inputs</button></div>
      <div className="results-toolbar"><PreferenceSelector value={preference} onChange={onPreferenceChange} /><span className={isDemo ? "data-badge demo" : "data-badge live"}><i />{isDemo ? "Demo data" : "Live API results"}</span></div>
      {error && <div className="notice" role="alert"><span>{error}</span><button type="button" className="text-action" onClick={onRetry}>Retry</button></div>}
      {loading ? <div className="strategy-grid" aria-label="Generating strategies">{[1, 2, 3].map(number => <div className="strategy-skeleton" key={number} />)}</div> : strategies.length === 0 ? (
        <AffordabilityNotice result={affordability} onEdit={onEdit} />
      ) : <>
        <div className="insight-strip" aria-label="Strategy highlights">
          <div><span>TOP RECOMMENDATION</span><b>{strategies[0]?.strategy.name ?? "—"}</b></div>
          <div><span>BEST NORMAL CASE</span><b>{bestNormal?.strategy.name ?? "—"}</b></div>
          <div><span>BEST RESILIENCE</span><b>{bestResilience?.strategy.name ?? "—"}</b></div>
          <div><span>FASTEST</span><b>{fastest?.strategy.name ?? "—"}</b></div>
          <div><span>LOWEST DEBT</span><b>{lowestDebt?.strategy.name ?? "—"}</b></div>
        </div>
        <div className="strategy-grid">{strategies.map((item, index) => <StrategyCard item={item} rank={index + 1} selected={selectedId === item.strategy.id} compared={comparedIds.includes(item.strategy.id)} onSelect={() => onSelect(item)} onCompare={checked => onCompare(item.strategy.id, checked)} key={item.strategy.id} />)}</div>
        <StrategyComparison strategies={compared} />
        {selected && <div className="open-dashboard"><span>Selected: {selected.strategy.name}</span><button type="button" className="primary compact" onClick={() => onOpen(selected)}>Open detailed analysis</button></div>}
      </>}
    </main>
  );
}

function AffordabilityNotice({ result, onEdit }: { result: AffordabilityResult | null; onEdit: () => void }) {
  return <div className="affordability-state"><span className="section-label">AFFORDABILITY CHECK</span><h2>This goal is not feasible under the current plan.</h2><p>{result?.affordability_reason.replaceAll("_", " ") ?? "No feasible strategy was found."}</p>{result && <div className="affordability-metrics"><div><span>AVAILABLE SURPLUS</span><b>₹{Math.round(result.available_monthly_surplus).toLocaleString("en-IN")}</b></div><div><span>REQUIRED MONTHLY CONTRIBUTION</span><b>₹{Math.round(result.required_monthly_contribution).toLocaleString("en-IN")}</b></div><div><span>SHORTFALL</span><b>₹{Math.round(result.shortfall).toLocaleString("en-IN")}</b></div></div>}<h3>Ways to make it feasible</h3><ul>{(result?.recovery_options ?? ["Reduce the target amount", "Increase the timeline", "Increase monthly savings"]).map(option => <li key={option}>{option}</li>)}</ul><button type="button" className="primary compact" onClick={onEdit}>Adjust my plan</button></div>;
}
