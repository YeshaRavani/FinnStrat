import type { RankedStrategy } from "../types/strategy";

export function StrategyComparison({ strategies }: { strategies: RankedStrategy[] }) {
  if (strategies.length < 2) return null;
  return (
    <div className="comparison-wrap">
      <table className="comparison-table">
        <caption>Selected strategy comparison</caption>
        <thead><tr><th scope="col">Measure</th>{strategies.map(item => <th scope="col" key={item.strategy.id}>{item.strategy.name}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Overall score</th>{strategies.map(item => <td key={item.strategy.id}>{Math.round(item.overall_score)}/100</td>)}</tr>
          <tr><th scope="row">Resilience</th>{strategies.map(item => <td key={item.strategy.id}>{Math.round(item.resilience_score)}/100</td>)}</tr>
          <tr><th scope="row">Maturity</th>{strategies.map(item => <td key={item.strategy.id}>{item.maturity_month ? `Month ${item.maturity_month}` : "Not reached"}</td>)}</tr>
          <tr><th scope="row">Liquidity</th>{strategies.map(item => <td key={item.strategy.id}>{Math.round(item.liquidity_score)}/100</td>)}</tr>
          <tr><th scope="row">Loan</th>{strategies.map(item => <td key={item.strategy.id}>₹{Math.round(item.strategy.loan_amount).toLocaleString("en-IN")}</td>)}</tr>
          <tr><th scope="row">Down payment</th>{strategies.map(item => <td key={item.strategy.id}>₹{Math.round(item.strategy.down_payment).toLocaleString("en-IN")}</td>)}</tr>
          <tr><th scope="row">Loan terms</th>{strategies.map(item => <td key={item.strategy.id}>{item.strategy.loan_amount > 0 ? `${item.strategy.loan_term_months} mo / ${(item.strategy.annual_interest_rate * 100).toFixed(1)}%` : "No loan"}</td>)}</tr>
          <tr><th scope="row">Monthly contribution</th>{strategies.map(item => <td key={item.strategy.id}>₹{Math.round(item.strategy.monthly_contribution).toLocaleString("en-IN")}</td>)}</tr>
          <tr><th scope="row">Invested share</th>{strategies.map(item => <td key={item.strategy.id}>{Math.round(item.strategy.investment_allocation * 100)}%</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
