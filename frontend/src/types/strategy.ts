export type RankingPreference = "balanced" | "resilience" | "speed" | "wealth" | "liquidity";

export type StrategyRequest = {
  profile: {
    monthly_income: number;
    monthly_expenses: number;
    cash_savings: number;
    investments: number;
    existing_debt: number;
    monthly_debt_payment: number;
    emergency_reserve_months: number;
    risk_tolerance: "low" | "medium" | "high";
  };
  goal: {
    name: string;
    category: string;
    target_amount: number;
    target_date: string | null;
    priority: "low" | "medium" | "high";
    flexibility: "low" | "medium" | "high";
    inflation_rate: number;
    appreciation_rate: number;
  };
  ranking_preference: RankingPreference;
  max_months: number;
};

export type RankedStrategy = {
  strategy: { id: string; name: string; type: string; monthly_contribution?: number; loan_amount?: number };
  maturity_month: number | null;
  resilience_score: number;
  liquidity_score: number;
  overall_score: number;
  normal_simulation?: SimulationResult;
  stress_simulation?: SimulationResult;
};

export type MonthlyResult = { month: number; cash_balance: number; investment_value: number; loan_balance: number; net_worth: number; monthly_cash_flow: number; constraint_breaches: string[] };
export type SimulationResult = { maturity_month: number | null; breaking_point_month: number | null; breaking_point_cause: string | null; recovery_month: number | null; resilience_score: number; monthly_results: MonthlyResult[] };
