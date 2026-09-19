import type { RankedStrategy } from "../types/strategy";
import { loanSummary } from "../utils/loanMath";

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
          <tr><th scope="row">Estimated EMI</th>{strategies.map(item => { const loan = loanSummary(item.strategy, item.maturity_month); return <td key={item.strategy.id}>{loan.emi ? `₹${Math.round(loan.emi).toLocaleString("en-IN")}` : "No loan"}</td>; })}</tr>
          <tr><th scope="row">Estimated interest</th>{strategies.map(item => { const loan = loanSummary(item.strategy, item.maturity_month); return <td key={item.strategy.id}>{loan.totalInterest ? `₹${Math.round(loan.totalInterest).toLocaleString("en-IN")}` : "No loan"}</td>; })}</tr>
          <tr><th scope="row">Expected payoff</th>{strategies.map(item => { const loan = loanSummary(item.strategy, item.maturity_month); return <td key={item.strategy.id}>{loan.payoffMonth ? `Month ${loan.payoffMonth}` : "No loan"}</td>; })}</tr>
          <tr><th scope="row">Goal contribution</th>{strategies.map(item => <td key={item.strategy.id}>₹{Math.round(item.strategy.monthly_contribution).toLocaleString("en-IN")}</td>)}</tr>
          <tr><th scope="row">Invested share</th>{strategies.map(item => <td key={item.strategy.id}>{Math.round(item.strategy.investment_allocation * 100)}%</td>)}</tr>
          <tr><th scope="row">Cash at horizon</th>{strategies.map(item => { const final = item.normal_simulation.monthly_results[item.normal_simulation.monthly_results.length - 1]; return <td key={item.strategy.id}>₹{Math.round(final?.cash_balance ?? 0).toLocaleString("en-IN")}</td>; })}</tr>
          <tr><th scope="row">Investments at horizon</th>{strategies.map(item => { const final = item.normal_simulation.monthly_results[item.normal_simulation.monthly_results.length - 1]; return <td key={item.strategy.id}>₹{Math.round(final?.investment_value ?? 0).toLocaleString("en-IN")}</td>; })}</tr>
          <tr><th scope="row">Net worth at horizon</th>{strategies.map(item => { const final = item.normal_simulation.monthly_results[item.normal_simulation.monthly_results.length - 1]; return <td key={item.strategy.id}>₹{Math.round(final?.net_worth ?? 0).toLocaleString("en-IN")}</td>; })}</tr>
        </tbody>
      </table>
    </div>
  );
}
