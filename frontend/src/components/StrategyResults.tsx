import type { RankedStrategy, RankingPreference } from "../types/strategy";
import { StrategyCard } from "./StrategyCard";

type Props = { strategies: RankedStrategy[]; goalName: string; preference: RankingPreference; selectedId?: string; isDemo: boolean; onSelect: (strategy: RankedStrategy) => void };

export function StrategyResults({ strategies, goalName, preference, selectedId, isDemo, onSelect }: Props) {
  return <section className="results"><div className="results-heading"><div><p className="section-label">02 / YOUR SHORTLIST</p><h2>Top strategies for {goalName.toLowerCase()}</h2></div><span className="results-note">Ranked by {preference}</span></div><div className={isDemo ? "data-badge demo" : "data-badge live"}><span />{isDemo ? "Sample analysis" : "Live simulation results"}</div><div className="strategy-grid">{strategies.map((item, index) => <StrategyCard item={item} rank={index + 1} selected={selectedId === item.strategy.id} onSelect={() => onSelect(item)} key={item.strategy.id} />)}</div></section>;
}
