import { useEffect, useState } from "react";
import type { Strategy } from "../types/strategy";
import { Field } from "./Field";

export function StrategyAdjustmentPanel({ strategy, targetAmount, onApply }: { strategy: Strategy; targetAmount: number; onApply: (strategy: Strategy) => void }) {
  const [contribution, setContribution] = useState(String(strategy.monthly_contribution));
  const [downPayment, setDownPayment] = useState(String(strategy.down_payment));
  const [error, setError] = useState("");
  const isFinanced = strategy.type === "financed_purchase" || strategy.type === "hybrid";

  useEffect(() => {
    setContribution(String(strategy.monthly_contribution));
    setDownPayment(String(strategy.down_payment));
  }, [strategy]);

  const apply = () => {
    const contributionValue = Number(contribution);
    const downPaymentValue = Number(downPayment);
    if (!Number.isFinite(contributionValue) || contributionValue < 0) {
      setError("Enter a valid non-negative monthly contribution.");
      return;
    }
    if (isFinanced && (!Number.isFinite(downPaymentValue) || downPaymentValue < 0 || downPaymentValue > targetAmount)) {
      setError("Down payment must be between ₹0 and the target amount.");
      return;
    }
    const loanAmount = isFinanced ? Math.max(0, targetAmount - downPaymentValue) : strategy.loan_amount;
    onApply({
      ...strategy,
      id: `${strategy.id}_modified`,
      name: `${strategy.name.replace(/ \(modified\)$/, "")} (modified)`,
      monthly_contribution: contributionValue,
      down_payment: isFinanced ? downPaymentValue : strategy.down_payment,
      loan_amount: loanAmount,
      loan_term_months: loanAmount > 0 ? strategy.loan_term_months : 0,
      explanation: "Adjusted contribution and financing are re-simulated under the selected scenario.",
    });
    setError("");
  };

  return (
    <section className="adjustment-panel">
      <div><p className="section-label">PLAN ADJUSTMENT</p><h2>Try a modified strategy</h2></div>
      <div className="adjustment-fields">
        {isFinanced && <Field label="Down payment" value={downPayment} onChange={setDownPayment} type="currency" help="Remaining target amount becomes the new loan." />}
        <Field label="Monthly contribution" value={contribution} onChange={setContribution} type="currency" help="The simulator checks this against monthly surplus." />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="button" className="secondary" onClick={apply}>Apply and re-simulate</button>
    </section>
  );
}
