import type { GoalForm as GoalFormData } from "../types/financial";
import { Field } from "./Field";
import { SelectField } from "./SelectField";

type Props = {
  goal: GoalFormData;
  errors: Partial<Record<keyof GoalFormData, string>>;
  onChange: (key: keyof GoalFormData, value: string) => void;
};

const categories = ["vehicle", "home", "land", "education", "business", "wedding", "medical", "custom"];

export function GoalForm({ goal, errors, onChange }: Props) {
  return (
    <section className="form-section" aria-labelledby="goal-title">
      <div className="panel-heading">
        <div><p className="section-label">02 / GOAL DEFINITION</p><h2 id="goal-title">What are you planning?</h2></div>
        <span className="step">STEP 2 OF 2</span>
      </div>
      <div className="form-grid">
        <Field label="Goal name" value={goal.name} onChange={value => onChange("name", value)} required help="Use any name that makes the goal clear." error={errors.name} type="text" />
        <SelectField label="Goal category" value={goal.category} onChange={value => onChange("category", value)} options={categories.map(value => ({ value, label: value === "custom" ? "Custom goal" : value[0].toUpperCase() + value.slice(1) }))} />
        <Field label="Target amount" value={goal.amount} onChange={value => onChange("amount", value)} required help="Estimated amount in Indian rupees." error={errors.amount} />
        <Field label="Desired timeline" value={goal.targetDate} onChange={value => onChange("targetDate", value)} help="Optional target date; this sets the simulation horizon." error={errors.targetDate} type="date" />
        <Field label="Annual inflation" value={goal.inflationRate} onChange={value => onChange("inflationRate", value)} help="Percent per year used to adjust the future cost." type="number" min="0" max="100" step="0.1" />
        <Field label="Annual appreciation" value={goal.appreciationRate} onChange={value => onChange("appreciationRate", value)} help="Expected annual change in asset value; use a negative rate for depreciation." type="number" min="-100" max="100" step="0.1" />
      </div>
      <div className="control-grid">
        <SelectField label="Priority" value={goal.priority} onChange={value => onChange("priority", value)} options={["low", "medium", "high"].map(value => ({ value, label: value }))} />
        <SelectField label="Timeline flexibility" value={goal.flexibility} onChange={value => onChange("flexibility", value)} options={["low", "medium", "high"].map(value => ({ value, label: value }))} />
        <SelectField label="Value after purchase" value={goal.assetType} onChange={value => onChange("assetType", value)} help="Education and medical costs are usually consumable goals." options={[
          { value: "appreciating_asset", label: "Appreciating asset" },
          { value: "depreciating_asset", label: "Depreciating asset" },
          { value: "consumable", label: "Consumable expense" },
        ]} />
      </div>
    </section>
  );
}
