import type { FinancialProfileForm, GoalForm } from "../types/financial";

type Props = {
  profile: FinancialProfileForm;
  goal: GoalForm;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function horizonLabel(targetDate: string) {
  if (!targetDate) return "Flexible timeline";
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return "Flexible timeline";
  const months = Math.max(1, Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.4375)));
  if (months < 12) return `${months} months`;
  const years = months / 12;
  return `${years.toFixed(years % 1 === 0 ? 0 : 1)} years`;
}

export function LensPanel({ profile, goal }: Props) {
  const monthlySurplus = Number(profile.income) - Number(profile.expenses) - Number(profile.monthlyDebtPayment);
  const emergencyReserve = Number(profile.expenses) * Number(profile.emergencyMonths);

  return <div className="panel insight-panel">
    <p className="section-label">YOUR PLANNING GUARDRAILS</p>
    <div className="guardrail-list">
      <div className="mini-metric"><span>MONTHLY SURPLUS</span><strong>{currency.format(monthlySurplus)}</strong></div>
      <div className="mini-metric"><span>EMERGENCY RESERVE</span><strong>{currency.format(emergencyReserve)}</strong></div>
      <div className="mini-metric"><span>GOAL HORIZON</span><strong>{horizonLabel(goal.targetDate)}</strong></div>
    </div>
    <div className="insight-line" />
    <p>We’ll test this plan against:</p>
    <div className="scenario-list" aria-label="Stress scenarios">
      <span>Job loss</span><span>Market decline</span><span>Emergencies</span><span>Rate increases</span>
    </div>
  </div>;
}
