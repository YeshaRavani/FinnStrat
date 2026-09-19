export type FinancialProfileForm = {
  income: string;
  expenses: string;
  savings: string;
  investments: string;
  emergencyMonths: string;
  riskTolerance: "low" | "medium" | "high";
};

export type GoalForm = {
  name: string;
  amount: string;
  category: string;
  priority: "low" | "medium" | "high";
  flexibility: "low" | "medium" | "high";
};
