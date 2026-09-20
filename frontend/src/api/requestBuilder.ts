import type { FinancialProfileForm, GoalAssetType, GoalForm } from "../types/financial";
import type { ApiProfile } from "../types/auth";
import type { RankingPreference, StrategyRequest } from "../types/strategy";

export function assetTypeForGoalCategory(category: string): GoalAssetType {
  if (["education", "medical", "wedding"].includes(category)) return "consumable";
  if (category === "vehicle") return "depreciating_asset";
  return "appreciating_asset";
}

export function planningHorizonMonths(targetDate: string, now = new Date()): number {
  if (!targetDate) return 120;
  const [year, month] = targetDate.split("-").map(Number);
  const months = (year - now.getFullYear()) * 12 + month - (now.getMonth() + 1);
  return Math.max(1, Math.min(600, months));
}

export function toStrategyRequest(profile: FinancialProfileForm, goal: GoalForm, preference: RankingPreference): StrategyRequest {
  return {
    profile: toProfileRequest(profile),
    goal: {
      name: goal.name.trim(),
      category: goal.category,
      target_amount: Number(goal.amount),
      target_date: goal.targetDate || null,
      priority: goal.priority,
      flexibility: goal.flexibility,
      inflation_rate: Number(goal.inflationRate) / 100,
      appreciation_rate: Number(goal.appreciationRate) / 100,
      asset_type: goal.assetType,
    },
    ranking_preference: preference,
    max_months: planningHorizonMonths(goal.targetDate),
  };
}

export function toProfileRequest(profile: FinancialProfileForm): ApiProfile {
  return {
    monthly_income: Number(profile.income),
    monthly_expenses: Number(profile.expenses),
    cash_savings: Number(profile.savings),
    investments: Number(profile.investments),
    existing_debt: Number(profile.existingDebt),
    monthly_debt_payment: Number(profile.monthlyDebtPayment),
    existing_debt_annual_interest_rate: Number(profile.existingDebtAnnualInterestRate) / 100,
    emergency_reserve_months: Number(profile.emergencyMonths),
    risk_tolerance: profile.riskTolerance,
  };
}

export function fromProfileRequest(profile: ApiProfile): FinancialProfileForm {
  return {
    income: String(profile.monthly_income),
    expenses: String(profile.monthly_expenses),
    savings: String(profile.cash_savings),
    investments: String(profile.investments),
    existingDebt: String(profile.existing_debt),
    monthlyDebtPayment: String(profile.monthly_debt_payment),
    existingDebtAnnualInterestRate: String(profile.existing_debt_annual_interest_rate * 100),
    emergencyMonths: String(profile.emergency_reserve_months),
    riskTolerance: profile.risk_tolerance,
  };
}
