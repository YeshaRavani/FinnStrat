export type RiskTolerance = "low" | "medium" | "high";
export type GoalPriority = "low" | "medium" | "high";
export type GoalFlexibility = "low" | "medium" | "high";
export type GoalAssetType = "appreciating_asset" | "depreciating_asset" | "consumable";

export type FinancialProfileForm = {
  income: string;
  expenses: string;
  savings: string;
  investments: string;
  existingDebt: string;
  monthlyDebtPayment: string;
  emergencyMonths: string;
  riskTolerance: RiskTolerance;
};

export type GoalForm = {
  name: string;
  amount: string;
  category: string;
  targetDate: string;
  priority: GoalPriority;
  flexibility: GoalFlexibility;
  inflationRate: string;
  appreciationRate: string;
  assetType: GoalAssetType;
};
