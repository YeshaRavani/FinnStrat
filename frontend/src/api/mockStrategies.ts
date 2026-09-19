import type { RankedStrategy, Scenario, SimulationResult } from "../types/strategy";

const months = Array.from({ length: 24 }, (_, index) => index + 1);

function sampleSimulation(strategyId: string, scenarioId: string, cashStart: number, maturity: number, resilience: number): SimulationResult {
  const stressed = scenarioId !== "normal";
  const monthly_results = months.map(month => {
    const shock = stressed && month >= 6 ? 1 : 0;
    const cash = cashStart + month * 48000 - shock * 210000;
    const investments = 1500000 + month * 10000 - shock * 450000;
    const loanBalance = strategyId === "hybrid" && month >= maturity ? Math.max(0, 900000 - (month - maturity + 1) * 15000) : 0;
    const assetValue = month >= maturity ? 1800000 + (month - maturity) * 8000 : 0;
    return {
      month,
      cash_balance: cash,
      investment_value: investments,
      loan_balance: loanBalance,
      goal_asset_value: assetValue,
      net_worth: cash + investments + assetValue - loanBalance,
      monthly_cash_flow: shock ? -20000 : 50000,
      goal_acquired: month >= maturity,
      purchase_amount: month === maturity ? 1800000 : 0,
      down_payment_paid: month === maturity && strategyId === "hybrid" ? 900000 : month === maturity ? 1800000 : 0,
      loan_created: month === maturity && strategyId === "hybrid" ? 900000 : 0,
      constraint_breaches: shock && month === 6 ? ["emergency_reserve_breached"] : [],
    };
  });
  const breaking = stressed ? 6 : null;
  return {
    strategy_id: strategyId,
    scenario_id: scenarioId,
    maturity_month: maturity,
    goal_acquired: true,
    purchase_amount: 1800000,
    down_payment_paid: strategyId === "hybrid" ? 900000 : 1800000,
    loan_created: strategyId === "hybrid" ? 900000 : 0,
    breaking_point_month: breaking,
    breaking_point_cause: breaking ? "emergency_reserve_breached" : null,
    recovery_month: breaking ? 10 : null,
    resilience_score: resilience,
    monthly_results,
    status: "completed",
  };
}

export const mockStrategies: RankedStrategy[] = [
  {
    strategy: { id: "hybrid", name: "Hybrid reserve-first plan", type: "hybrid", down_payment: 900000, loan_amount: 900000, monthly_contribution: 37500, investment_allocation: 0.25, purchase_month: 0, annual_interest_rate: 0.09, loan_term_months: 60, explanation: "Preserves part of the reserve while balancing a down payment and affordable loan." },
    maturity_month: 11, resilience_score: 86, goal_success_score: 100, liquidity_score: 91, speed_score: 70, wealth_score: 70, debt_score: 80, overall_score: 84.4,
    normal_simulation: sampleSimulation("hybrid", "normal", 3000000, 11, 100),
    stress_simulation: sampleSimulation("hybrid", "combined_shock", 3000000, 11, 86),
  },
  {
    strategy: { id: "save_then_buy", name: "Save and buy later", type: "save_then_buy", down_payment: 0, loan_amount: 0, monthly_contribution: 50000, investment_allocation: 0.25, purchase_month: 0, annual_interest_rate: 0, loan_term_months: 0, explanation: "Avoids new debt and protects the reserve, with a longer path to the goal." },
    maturity_month: 17, resilience_score: 93, goal_success_score: 100, liquidity_score: 95, speed_score: 85, wealth_score: 72, debt_score: 100, overall_score: 82,
    normal_simulation: sampleSimulation("save_then_buy", "normal", 3000000, 17, 100),
    stress_simulation: sampleSimulation("save_then_buy", "combined_shock", 3000000, 17, 93),
  },
];

export const mockScenarios: Scenario[] = [
  { id: "normal", name: "Normal conditions", income_multiplier: 1, income_reduction_percent: 0, income_shock_start_month: null, income_shock_duration_months: 0, investment_shock_month: null, investment_decline: 0, emergency_expense_month: null, emergency_expense: 0, interest_rate_increase: 0, interest_rate_shock_start_month: null, expense_increase_percent: 0, expense_increase_start_month: null },
  { id: "job_loss", name: "Job loss", income_multiplier: 1, income_reduction_percent: 0.6, income_shock_start_month: 6, income_shock_duration_months: 6, investment_shock_month: null, investment_decline: 0, emergency_expense_month: null, emergency_expense: 0, interest_rate_increase: 0, interest_rate_shock_start_month: null, expense_increase_percent: 0, expense_increase_start_month: null },
  { id: "market_crash", name: "Market crash", income_multiplier: 1, income_reduction_percent: 0, income_shock_start_month: null, income_shock_duration_months: 0, investment_shock_month: 6, investment_decline: 0.3, emergency_expense_month: null, emergency_expense: 0, interest_rate_increase: 0, interest_rate_shock_start_month: null, expense_increase_percent: 0, expense_increase_start_month: null },
  { id: "medical_emergency", name: "Medical emergency", income_multiplier: 1, income_reduction_percent: 0, income_shock_start_month: null, income_shock_duration_months: 0, investment_shock_month: null, investment_decline: 0, emergency_expense_month: 6, emergency_expense: 500000, interest_rate_increase: 0, interest_rate_shock_start_month: null, expense_increase_percent: 0, expense_increase_start_month: null },
  { id: "interest_rate_rise", name: "Interest-rate rise", income_multiplier: 1, income_reduction_percent: 0, income_shock_start_month: null, income_shock_duration_months: 0, investment_shock_month: null, investment_decline: 0, emergency_expense_month: null, emergency_expense: 0, interest_rate_increase: 0.02, interest_rate_shock_start_month: 6, expense_increase_percent: 0, expense_increase_start_month: null },
  { id: "combined_shock", name: "Combined shock", income_multiplier: 1, income_reduction_percent: 0.6, income_shock_start_month: 6, income_shock_duration_months: 6, investment_shock_month: 6, investment_decline: 0.3, emergency_expense_month: 6, emergency_expense: 500000, interest_rate_increase: 0.02, interest_rate_shock_start_month: 6, expense_increase_percent: 0.1, expense_increase_start_month: 6 },
];

export function makeDemoScenario(item: RankedStrategy, scenarioId: string): SimulationResult {
  if (scenarioId === "normal") return item.normal_simulation;
  if (scenarioId === "combined_shock") return item.stress_simulation;
  return sampleSimulation(item.strategy.id, scenarioId, 3000000, item.maturity_month ?? 12, Math.max(35, item.resilience_score - 8));
}
