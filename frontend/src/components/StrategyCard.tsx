import type { RankedStrategy } from "../types/strategy";
import { loanSummary } from "../utils/loanMath";

type Props = {
  item: RankedStrategy;
  rank: number;
  selected: boolean;
  compared: boolean;
  onSelect: () => void;
  onCompare: (checked: boolean) => void;
};

export function StrategyCard({ item, rank, selected, compared, onSelect, onCompare }: Props) {
  const loan = loanSummary(item.strategy, item.maturity_month);
  const final = item.normal_simulation.monthly_results[item.normal_simulation.monthly_results.length - 1];
  const overallLabel = item.overall_score >= 85 ? "Strong fit" : item.overall_score >= 70 ? "Balanced trade-off" : item.overall_score >= 50 ? "Review trade-offs" : "High risk";
  const stressBreach = item.stress_simulation.breaking_point_month;
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
        <div className="overall-score"><span>PLAN FIT</span><strong>{Math.round(item.overall_score)}<small>/100</small></strong><em>{overallLabel}</em></div>
        <div className={`stress-ring ${stressBreach ? "has-breach" : "no-breach"}`}>
          <span>STRESS TEST</span>
          <b>{stressBreach ? `Breach · M${stressBreach}` : "No breach"}</b>
        </div>
      </div>
      <div className="card-stats">
        <div><span>MATURITY</span><strong>{item.maturity_month ? `Month ${item.maturity_month}` : "Not reached"}</strong></div>
        <div><span>LIQUIDITY</span><strong>{Math.round(item.liquidity_score)}<small>/100</small></strong></div>
        <div><span>LOAN</span><strong>₹{Math.round(item.strategy.loan_amount).toLocaleString("en-IN")}</strong></div>
        <div><span>GOAL CONTRIBUTION</span><strong>₹{Math.round(item.strategy.monthly_contribution).toLocaleString("en-IN")}</strong></div>
        <div><span>DOWN PAYMENT</span><strong>₹{Math.round(item.strategy.down_payment).toLocaleString("en-IN")}</strong></div>
        <div><span>LOAN TERMS</span><strong>{item.strategy.loan_amount > 0 ? `${item.strategy.loan_term_months} mo / ${(item.strategy.annual_interest_rate * 100).toFixed(1)}%` : "No loan"}</strong></div>
        <div><span>EST. EMI</span><strong>{loan.emi ? `₹${Math.round(loan.emi).toLocaleString("en-IN")}` : "No loan"}</strong></div>
        <div><span>EST. INTEREST</span><strong>{loan.totalInterest ? `₹${Math.round(loan.totalInterest).toLocaleString("en-IN")}` : "No loan"}</strong></div>
        <div><span>EXPECTED PAYOFF</span><strong>{loan.payoffMonth ? `Month ${loan.payoffMonth}` : "No loan"}</strong></div>
        <div><span>INVESTED SHARE</span><strong>{Math.round(item.strategy.investment_allocation * 100)}%</strong></div>
      </div>
      {final && <div className="normal-outcome" aria-label="Ending values at the planning horizon">
        <div><span>CASH AT HORIZON</span><strong>₹{Math.round(final.cash_balance).toLocaleString("en-IN")}</strong></div>
        <div><span>INVESTMENTS AT HORIZON</span><strong>₹{Math.round(final.investment_value).toLocaleString("en-IN")}</strong></div>
        <div><span>NET WORTH AT HORIZON</span><strong>₹{Math.round(final.net_worth).toLocaleString("en-IN")}</strong></div>
      </div>}
      <p className="tradeoff">{item.strategy.explanation || "Balances time to goal with available liquidity."}</p>
      <div className="card-actions">
        <button type="button" className="text-action" aria-pressed={selected} onClick={onSelect}>{selected ? "Selected for analysis" : "Open analysis"}</button>
        <label className="compare-check"><input type="checkbox" checked={compared} onChange={event => onCompare(event.target.checked)} /> Compare</label>
      </div>
    </article>
  );
}
