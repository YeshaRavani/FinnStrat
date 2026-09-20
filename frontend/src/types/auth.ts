import type { FinancialProfileForm, GoalAssetType, GoalFlexibility, GoalPriority } from "./financial";

export type ApiProfile = {
  monthly_income: number;
  monthly_expenses: number;
  cash_savings: number;
  investments: number;
  existing_debt: number;
  monthly_debt_payment: number;
  existing_debt_annual_interest_rate: number;
  emergency_reserve_months: number;
  risk_tolerance: "low" | "medium" | "high";
};

export type AuthUser = { id: number; username: string; created_at: string };

export type SavedGoal = {
  id: number;
  name: string;
  category: string;
  target_amount: number;
  target_date: string | null;
  priority: GoalPriority;
  flexibility: GoalFlexibility;
  inflation_rate: number;
  appreciation_rate: number;
  asset_type: GoalAssetType;
  created_at: string;
};

export type AuthSession = {
  access_token?: string;
  token_type?: string;
  user: AuthUser;
  profile: ApiProfile;
  goals: SavedGoal[];
};

export type ProfileChange = (key: keyof FinancialProfileForm, value: string) => void;
