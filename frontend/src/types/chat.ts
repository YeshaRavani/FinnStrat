import type { RankedStrategy, SimulationResult, Strategy, StrategyRequest } from "./strategy";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSimulationSummary = {
  maturity_month: number | null;
  goal_acquired: boolean;
  breaking_point_month: number | null;
  breaking_point_cause: string | null;
  recovery_month: number | null;
  resilience_score: number | null;
  lowest_cash: number | null;
  final_cash: number;
  final_investments: number;
  final_debt: number;
  final_net_worth: number;
};

export type ChatStrategySummary = {
  strategy: Strategy;
  maturity_month: number | null;
  resilience_score: number;
  goal_success_score: number;
  liquidity_score: number;
  speed_score: number;
  wealth_score: number;
  debt_score: number;
  overall_score: number;
  normal: ChatSimulationSummary;
  stress: ChatSimulationSummary;
};

export type StrategyChatRequest = {
  profile: StrategyRequest["profile"];
  goal: StrategyRequest["goal"];
  strategies: ChatStrategySummary[];
  selected_strategy_id: string | null;
  messages: ChatMessage[];
};

export type StrategyChatResponse = {
  message: string;
  model: string;
};

export function summarizeSimulation(simulation: SimulationResult): ChatSimulationSummary {
  const final = simulation.monthly_results[simulation.monthly_results.length - 1];
  return {
    maturity_month: simulation.maturity_month,
    goal_acquired: simulation.goal_acquired,
    breaking_point_month: simulation.breaking_point_month,
    breaking_point_cause: simulation.breaking_point_cause,
    recovery_month: simulation.recovery_month,
    resilience_score: simulation.resilience_score,
    lowest_cash: simulation.monthly_results.length ? Math.min(...simulation.monthly_results.map(result => result.cash_balance)) : null,
    final_cash: final?.cash_balance ?? 0,
    final_investments: final?.investment_value ?? 0,
    final_debt: (final?.loan_balance ?? 0) + (final?.existing_debt_balance ?? 0),
    final_net_worth: final?.net_worth ?? 0,
  };
}

export function summarizeStrategy(item: RankedStrategy): ChatStrategySummary {
  return {
    strategy: item.strategy,
    maturity_month: item.maturity_month,
    resilience_score: item.resilience_score,
    goal_success_score: item.goal_success_score,
    liquidity_score: item.liquidity_score,
    speed_score: item.speed_score,
    wealth_score: item.wealth_score,
    debt_score: item.debt_score,
    overall_score: item.overall_score,
    normal: summarizeSimulation(item.normal_simulation),
    stress: summarizeSimulation(item.stress_simulation),
  };
}
