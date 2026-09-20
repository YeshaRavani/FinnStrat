import type { FinancialProfileForm } from "../types/financial";

export function validateProfile(profile: FinancialProfileForm): Partial<Record<keyof FinancialProfileForm, string>> {
  const errors: Partial<Record<keyof FinancialProfileForm, string>> = {};
  const income = Number(profile.income);
  const expenses = Number(profile.expenses);
  for (const [key, value] of Object.entries(profile)) {
    if (key === "riskTolerance" || key === "emergencyMonths" || (key === "existingDebtAnnualInterestRate" && Number(profile.existingDebt) === 0)) continue;
    if (value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0) errors[key as keyof FinancialProfileForm] = "Enter a valid non-negative amount.";
  }
  if (income <= 0) errors.income = "Monthly income must be greater than zero.";
  if (expenses > income) errors.expenses = "Expenses cannot exceed monthly income.";
  if (Number(profile.monthlyDebtPayment) > income) errors.monthlyDebtPayment = "Debt payments cannot exceed monthly income.";
  if (Number(profile.existingDebt) > 0) {
    const debtRate = Number(profile.existingDebtAnnualInterestRate);
    if (!Number.isFinite(debtRate) || debtRate < 0 || debtRate > 100) errors.existingDebtAnnualInterestRate = "Use an annual rate between 0 and 100 percent.";
  }
  return errors;
}
