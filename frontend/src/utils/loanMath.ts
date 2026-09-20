import type { RankedStrategy, Strategy } from "../types/strategy";

/**
 * Calculates the fixed monthly payment for a fully amortising loan.
 * These are estimates for the strategy card; scenario simulations may
 * reprice the payment when an interest-rate shock is active.
 */
export function calculateMonthlyEmi(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = (1 + monthlyRate) ** termMonths;
  return principal * monthlyRate * factor / (factor - 1);
}

export function loanSummary(strategy: Strategy, maturityMonth: number | null) {
  if (strategy.loan_amount <= 0 || strategy.loan_term_months <= 0) {
    return { emi: 0, totalInterest: 0, payoffMonth: null as number | null };
  }

  const emi = calculateMonthlyEmi(
    strategy.loan_amount,
    strategy.annual_interest_rate,
    strategy.loan_term_months,
  );

  return {
    emi,
    totalInterest: Math.max(0, emi * strategy.loan_term_months - strategy.loan_amount),
    payoffMonth: maturityMonth === null ? null : maturityMonth + strategy.loan_term_months,
  };
}

export function finalNormalNetWorth(item: RankedStrategy): number {
  const results = item.normal_simulation.monthly_results;
  return results.length ? results[results.length - 1].net_worth : Number.NEGATIVE_INFINITY;
}
