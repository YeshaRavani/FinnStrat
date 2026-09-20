import type { FinancialProfileForm as Profile } from "../types/financial";
import { Field } from "./Field";
import { SelectField } from "./SelectField";

type Props = {
  profile: Profile;
  errors: Partial<Record<keyof Profile, string>>;
  onChange: (key: keyof Profile, value: string) => void;
};

export function FinancialProfileForm({ profile, errors, onChange }: Props) {
  const currency = (key: keyof Profile, label: string, help: string, required = true) => (
    <Field label={label} value={profile[key]} onChange={value => onChange(key, value)} help={help} error={errors[key]} required={required} />
  );
  return (
    <section className="form-section" aria-labelledby="profile-title">
      <div className="panel-heading">
        <div><p className="section-label">01 / FINANCIAL CONTEXT</p><h2 id="profile-title">Your starting point</h2></div>
        <span className="step">STEP 1 OF 2</span>
      </div>
      <div className="form-grid">
        {currency("income", "Monthly income", "Your regular take-home income.")}
        {currency("expenses", "Monthly expenses", "Living costs before debt payments.")}
        {currency("savings", "Cash savings", "Money available in cash or bank accounts.")}
        {currency("investments", "Investments", "Current market value of your investments.")}
        {currency("existingDebt", "Existing debt", "Outstanding balances across current loans.")}
        {currency("monthlyDebtPayment", "Monthly debt payments", "Monthly payments on current debt.")}
        {Number(profile.existingDebt) > 0 && <Field label="Existing debt interest (% annual)" value={profile.existingDebtAnnualInterestRate} onChange={value => onChange("existingDebtAnnualInterestRate", value)} type="percentage" help="Estimated from your balance, payment, and rate; the remaining loan term is not collected." error={errors.existingDebtAnnualInterestRate} required />}
      </div>
      {Number(profile.existingDebt) > 0 && <p className="debt-model-note">Existing debt is modeled as an estimated amortizing balance using the amount, monthly payment, and annual interest rate you enter.</p>}
      <div className="control-grid">
        <SelectField label="Emergency reserve" value={profile.emergencyMonths} onChange={value => onChange("emergencyMonths", value)} help="Cash kept aside for essential expenses." options={[3, 6, 9, 12].map(value => ({ value: String(value), label: `${value} months` }))} />
        <SelectField label="Risk tolerance" value={profile.riskTolerance} onChange={value => onChange("riskTolerance", value)} help="Used to shape financing assumptions." options={["low", "medium", "high"].map(value => ({ value, label: value }))} />
      </div>
    </section>
  );
}
