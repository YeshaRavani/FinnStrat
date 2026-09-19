export type RankingPreference = "balanced" | "resilience" | "speed" | "wealth" | "liquidity" | "low_debt";

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
    asset_type?: "appreciating_asset" | "depreciating_asset" | "consumable";
  };
  ranking_preference: RankingPreference;
  max_months: number;
};

export type RankedStrategy = {
  strategy: {
    id: string;
    name: string;
    type: "save_then_buy" | "financed_purchase" | "invest_then_buy" | "hybrid";
    down_payment: number;
    loan_amount: number;
    monthly_contribution: number;
    investment_allocation: number;
    purchase_month: number | null;
    annual_interest_rate: number;
    loan_term_months: number;
    explanation: string;
  };
  maturity_month: number | null;
  resilience_score: number;
  goal_success_score: number;
  liquidity_score: number;
  speed_score: number;
  wealth_score: number;
  debt_score: number;
  overall_score: number;
  normal_simulation: SimulationResult;
  stress_simulation: SimulationResult;
};

export type MonthlyResult = {
  month: number;
  cash_balance: number;
  investment_value: number;
  loan_balance: number;
  goal_asset_value: number;
  net_worth: number;
  monthly_cash_flow: number;
  goal_acquired: boolean;
  purchase_amount: number;
  down_payment_paid: number;
  loan_created: number;
  constraint_breaches: string[];
};

export type SimulationResult = {
  strategy_id: string;
  scenario_id: string;
  maturity_month: number | null;
  goal_acquired: boolean;
  purchase_amount: number;
  down_payment_paid: number;
  loan_created: number;
  breaking_point_month: number | null;
  breaking_point_cause: string | null;
  recovery_month: number | null;
  resilience_score: number | null;
  monthly_results: MonthlyResult[];
  status: "pending" | "completed";
};
