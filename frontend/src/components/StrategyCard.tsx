import type { RankedStrategy } from "../types/strategy";

type Props = { item: RankedStrategy; rank: number; selected: boolean; onSelect: () => void };

export function StrategyCard({ item, rank, selected, onSelect }: Props) {
  return <article onClick={onSelect} className={`${rank === 1 ? "strategy-card featured" : "strategy-card"} ${selected ? "selected" : ""}`}><div className="card-top"><span className="rank">0{rank}</span>{rank === 1 && <span className="recommended">RECOMMENDED</span>}</div><h3>{item.strategy.name}</h3><p className="strategy-type">{item.strategy.type.replaceAll("_", " ")}</p><div className="score-row"><div><span>OVERALL SCORE</span><strong>{Math.round(item.overall_score)}</strong><small>/100</small></div><div className="score-ring"><b>{Math.round(item.resilience_score)}</b></div></div><div className="card-stats"><div><span>MATURITY</span><strong>{item.maturity_month ? `Month ${item.maturity_month}` : "Not reached"}</strong></div><div><span>LIQUIDITY</span><strong>{Math.round(item.liquidity_score)}<small>/100</small></strong></div></div><div className="card-action">{selected ? "Selected for analysis" : "View resilience analysis →"}</div></article>;
}
