import { describe, expect, it } from "vitest";
import { assetTypeForGoalCategory, planningHorizonMonths, toStrategyRequest } from "./requestBuilder";
import type { FinancialProfileForm, GoalForm } from "../types/financial";
import { loanSummary } from "../utils/loanMath";

const profile: FinancialProfileForm = {
  income: "250000", expenses: "100000", savings: "3000000", investments: "1500000",
  existingDebt: "400000", monthlyDebtPayment: "12000", existingDebtAnnualInterestRate: "8.5", emergencyMonths: "6", riskTolerance: "medium",
};
const goal: GoalForm = {
  name: "  Education fund  ", amount: "1800000", category: "education", targetDate: "2030-06-01",
  priority: "high", flexibility: "medium", inflationRate: "6", appreciationRate: "0", assetType: "consumable",
};

describe("strategy request mapping", () => {
  it("maps financial and goal form values to the backend contract", () => {
    expect(toStrategyRequest(profile, goal, "balanced")).toEqual({
      profile: {
        monthly_income: 250000, monthly_expenses: 100000, cash_savings: 3000000, investments: 1500000,
        existing_debt: 400000, monthly_debt_payment: 12000, existing_debt_annual_interest_rate: 0.085, emergency_reserve_months: 6, risk_tolerance: "medium",
      },
      goal: {
        name: "Education fund", category: "education", target_amount: 1800000, target_date: "2030-06-01",
        priority: "high", flexibility: "medium", inflation_rate: 0.06, appreciation_rate: 0, asset_type: "consumable",
      },
        ranking_preference: "balanced", max_months: 45,
    });
  });

  it("maps categories to sensible asset treatment", () => {
    expect(assetTypeForGoalCategory("education")).toBe("consumable");
    expect(assetTypeForGoalCategory("medical")).toBe("consumable");
    expect(assetTypeForGoalCategory("vehicle")).toBe("depreciating_asset");
    expect(assetTypeForGoalCategory("custom")).toBe("appreciating_asset");
  });

  it("uses a selected target month as the simulation horizon", () => {
    expect(planningHorizonMonths("2030-06-01", new Date(2026, 8, 19))).toBe(45);
    expect(planningHorizonMonths("", new Date(2026, 8, 19))).toBe(120);
    expect(planningHorizonMonths("2100-01-01", new Date(2026, 8, 19))).toBe(600);
  });
});

describe("loan timing", () => {
  it("counts the first installment in the month after purchase", () => {
    expect(loanSummary({
      id: "loan", name: "Loan", type: "financed_purchase", down_payment: 100000,
      loan_amount: 900000, monthly_contribution: 0, investment_allocation: 0,
      purchase_month: 0, annual_interest_rate: 0.1, loan_term_months: 60, explanation: "",
    }, 5).payoffMonth).toBe(65);
  });
});
