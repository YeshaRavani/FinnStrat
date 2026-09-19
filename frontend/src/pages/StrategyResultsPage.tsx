import type { RankedStrategy, RankingPreference } from "../types/strategy";
import { PreferenceSelector } from "../components/PreferenceSelector";
import { StrategyCard } from "../components/StrategyCard";
import { StrategyComparison } from "../components/StrategyComparison";

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
};

export function StrategyResultsPage({ strategies, goalName, preference, selectedId, comparedIds, loading, isDemo, error, onSelect, onOpen, onCompare, onPreferenceChange, onRetry, onEdit }: Props) {
  const selected = strategies.find(item => item.strategy.id === selectedId) ?? null;
  const compared = strategies.filter(item => comparedIds.includes(item.strategy.id));
  const bestNormal = [...strategies].sort((a, b) => (b.normal_simulation.resilience_score ?? 0) - (a.normal_simulation.resilience_score ?? 0))[0];
  const bestResilience = [...strategies].sort((a, b) => b.resilience_score - a.resilience_score)[0];
  const fastest = [...strategies].sort((a, b) => (a.maturity_month ?? Infinity) - (b.maturity_month ?? Infinity))[0];
  const lowestDebt = [...strategies].sort((a, b) => b.debt_score - a.debt_score)[0];

  return (
    <main className="content results-page">
      <div className="results-heading"><div><p className="section-label">STRATEGY RESULTS</p><h1>Plans for {goalName}</h1></div><button type="button" className="secondary" onClick={onEdit}>Edit inputs</button></div>
      <div className="results-toolbar"><PreferenceSelector value={preference} onChange={onPreferenceChange} /><span className={isDemo ? "data-badge demo" : "data-badge live"}><i />{isDemo ? "Demo data" : "Live API results"}</span></div>
      {error && <div className="notice" role="alert"><span>{error}</span><button type="button" className="text-action" onClick={onRetry}>Retry</button></div>}
      {loading ? <div className="strategy-grid" aria-label="Generating strategies">{[1, 2, 3].map(number => <div className="strategy-skeleton" key={number} />)}</div> : strategies.length === 0 ? (
        <div className="empty-state"><h2>No feasible strategies found</h2><p>Adjust the goal amount, timeline, or monthly finances and try again.</p><button type="button" className="primary compact" onClick={onEdit}>Review inputs</button></div>
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
