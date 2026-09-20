import { useState } from "react";
import type { FinancialProfileForm, GoalForm as GoalFormData } from "../types/financial";
import { FinancialProfileForm as ProfileForm } from "../components/FinancialProfileForm";
import { GoalForm } from "../components/GoalForm";
import { FinanceSketch } from "../components/FinanceSketch";
import { LensPanel } from "../components/LensPanel";
import { BackButton } from "../components/BackButton";
import { validateProfile } from "../utils/profileValidation";

type Step = "profile" | "goal";
type Props = {
  profile: FinancialProfileForm;
  goal: GoalFormData;
  loading: boolean;
  onProfileChange: (key: keyof FinancialProfileForm, value: string) => void;
  onGoalChange: (key: keyof GoalFormData, value: string) => void;
  onGenerate: () => void;
  startAtGoal?: boolean;
  onBack: () => void;
};

export function PlanningPage({ profile, goal, loading, onProfileChange, onGoalChange, onGenerate, startAtGoal = false, onBack }: Props) {
  const [step, setStep] = useState<Step>(startAtGoal ? "goal" : "profile");
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof FinancialProfileForm, string>>>({});
  const [goalErrors, setGoalErrors] = useState<Partial<Record<keyof GoalFormData, string>>>({});

  const continueToGoal = () => {
    const errors = validateProfile(profile);
    setProfileErrors(errors);
    if (Object.keys(errors).length === 0) setStep("goal");
  };

  const generate = () => {
    const errors: typeof goalErrors = {};
    if (!goal.name.trim()) errors.name = "Enter a name for this goal.";
    if (!Number.isFinite(Number(goal.amount)) || Number(goal.amount) <= 0) errors.amount = "Enter a target amount greater than zero.";
    const inflation = Number(goal.inflationRate);
    const appreciation = Number(goal.appreciationRate);
    if (!Number.isFinite(inflation) || inflation < 0 || inflation > 100) errors.inflationRate = "Use a rate between 0 and 100 percent.";
    if (!Number.isFinite(appreciation) || appreciation < -100 || appreciation > 100) errors.appreciationRate = "Use a rate between -100 and 100 percent.";
    if (goal.targetDate) {
      const selectedDate = new Date(`${goal.targetDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) errors.targetDate = "Choose today or a future date.";
    }
    setGoalErrors(errors);
    if (Object.keys(errors).length === 0) onGenerate();
  };

  return (
    <>
      <div className="page-back"><BackButton label="Back to home" onClick={onBack} /></div>
      <section className="hero">
        <div><p className="kicker">FINANCIAL RESILIENCE ENGINE</p><h1>Make the big move.<br /><em>Keep your options open.</em></h1><p className="hero-copy">Compare paths to your goal and see which plans can withstand the unexpected.</p><p className="hero-tagline">“The highest return is not always the strongest plan.”</p></div>
        <FinanceSketch />
      </section>
      <div className="workspace">
        <form className="panel form-panel" noValidate onSubmit={event => { event.preventDefault(); step === "profile" ? continueToGoal() : generate(); }}>
          {step === "profile"
            ? <ProfileForm profile={profile} errors={profileErrors} onChange={onProfileChange} />
            : <GoalForm goal={goal} errors={goalErrors} onChange={onGoalChange} />}
          <div className="form-actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Generating strategies…" : step === "profile" ? "Continue to goal" : "Generate strategies"}
            </button>
          </div>
        </form>
        <LensPanel profile={profile} goal={goal} />
      </div>
    </>
  );
}
