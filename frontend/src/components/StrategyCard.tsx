import type { RankedStrategy } from "../types/strategy";

type Props = {
  item: RankedStrategy;
  rank: number;
  selected: boolean;
  compared: boolean;
  onSelect: () => void;
  onCompare: (checked: boolean) => void;
};

export function StrategyCard({ item, rank, selected, compared, onSelect, onCompare }: Props) {
  return (
    <article className={`strategy-card ${rank === 1 ? "featured" : ""} ${selected ? "selected" : ""}`}>
      <div className="card-top"><span className="rank">{String(rank).padStart(2, "0")}</span>{rank === 1 && <span className="recommended">TOP RANKED</span>}</div>
      <div className="strategy-statuses">
        {item.resilience_score < 50 && <span className="status-pill risk">High risk</span>}
        {item.stress_simulation.breaking_point_month !== null && <span className="status-pill breach">Stress breach</span>}
        {!item.stress_simulation.goal_acquired && <span className="status-pill risk">Not feasible under stress</span>}
      </div>
      <h3>{item.strategy.name}</h3>
      <p className="strategy-type">{item.strategy.type.replaceAll("_", " ")}</p>
      <div className="score-row">
        <div><span>OVERALL</span><strong>{Math.round(item.overall_score)}</strong><small>/100</small></div>
        <div className="score-ring"><b>{Math.round(item.resilience_score)}</b></div>
      </div>
      <div className="card-stats">
        <div><span>MATURITY</span><strong>{item.maturity_month ? `Month ${item.maturity_month}` : "Not reached"}</strong></div>
        <div><span>LIQUIDITY</span><strong>{Math.round(item.liquidity_score)}<small>/100</small></strong></div>
        <div><span>LOAN</span><strong>₹{Math.round(item.strategy.loan_amount).toLocaleString("en-IN")}</strong></div>
        <div><span>MONTHLY PLAN</span><strong>₹{Math.round(item.strategy.monthly_contribution).toLocaleString("en-IN")}</strong></div>
        <div><span>DOWN PAYMENT</span><strong>₹{Math.round(item.strategy.down_payment).toLocaleString("en-IN")}</strong></div>
        <div><span>LOAN TERMS</span><strong>{item.strategy.loan_amount > 0 ? `${item.strategy.loan_term_months} mo / ${(item.strategy.annual_interest_rate * 100).toFixed(1)}%` : "No loan"}</strong></div>
        <div><span>INVESTED SHARE</span><strong>{Math.round(item.strategy.investment_allocation * 100)}%</strong></div>
      </div>
      <p className="tradeoff">{item.strategy.explanation || "Balances time to goal with available liquidity."}</p>
      <div className="card-actions">
        <button type="button" className="text-action" aria-pressed={selected} onClick={onSelect}>{selected ? "Selected for analysis" : "Open analysis"}</button>
        <label className="compare-check"><input type="checkbox" checked={compared} onChange={event => onCompare(event.target.checked)} /> Compare</label>
      </div>
    </article>
  );
}
