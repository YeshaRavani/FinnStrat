import { useState } from "react";
import { FinanceSketch } from "./components/FinanceSketch";
import { Header } from "./components/Header";
import { LensPanel } from "./components/LensPanel";
import { PlanningPanel } from "./components/PlanningPanel";
import { StrategyResults } from "./components/StrategyResults";
import { ResilienceDashboard } from "./components/ResilienceDashboard";
import type { FinancialProfileForm, GoalForm } from "./types/financial";
import type { RankedStrategy, RankingPreference, StrategyRequest } from "./types/strategy";
import { generateStrategies } from "./api/strategyApi";

type Strategy = RankedStrategy;
const demoStrategies: Strategy[] = [
  { strategy: { id: "hybrid", name: "Hybrid reserve-first plan", type: "hybrid" }, maturity_month: 11, resilience_score: 86, liquidity_score: 91, overall_score: 84 },
  { strategy: { id: "save_then_buy", name: "Save and buy later", type: "save_then_buy" }, maturity_month: 17, resilience_score: 93, liquidity_score: 95, overall_score: 82 },
];

function App() {
  const [profile, setProfile] = useState<FinancialProfileForm>({ income: "250000", expenses: "100000", savings: "3000000", investments: "1500000", emergencyMonths: "6", riskTolerance: "medium" });
  const [goal, setGoal] = useState<GoalForm>({ name: "Buy a car", amount: "1800000", category: "vehicle", priority: "high", flexibility: "medium" });
  const [preference, setPreference] = useState<RankingPreference>("balanced");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Strategy | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const updateProfile = (key: keyof FinancialProfileForm, value: string) => setProfile(current => ({ ...current, [key]: value }));
  const updateGoal = (key: keyof GoalForm, value: string) => setGoal(current => ({ ...current, [key]: value }));
  const generate = async () => { setLoading(true); setError(""); setIsDemo(false); const request: StrategyRequest = { profile: { monthly_income: +profile.income, monthly_expenses: +profile.expenses, cash_savings: +profile.savings, investments: +profile.investments, existing_debt: 0, monthly_debt_payment: 0, emergency_reserve_months: +profile.emergencyMonths, risk_tolerance: profile.riskTolerance }, goal: { name: goal.name, category: goal.category, target_amount: +goal.amount, target_date: null, priority: goal.priority, flexibility: goal.flexibility, inflation_rate: 0.06, appreciation_rate: 0 }, ranking_preference: preference, max_months: 120 }; try { const result = await generateStrategies(request); setStrategies(result); setSelected(result[0] ?? null); } catch { setStrategies(demoStrategies); setSelected(demoStrategies[0]); setIsDemo(true); setError("Showing sample strategies. Start FastAPI for a live analysis."); } finally { setLoading(false); } };

  return <div className="app-shell"><Header /><main className="content">
    <section className="hero"><div><p className="kicker">FINANCIAL RESILIENCE ENGINE</p><h1>Make the big move.<br /><em>Keep your options open.</em></h1><p className="hero-copy">Compare the strongest paths to any financial goal—and see which ones can withstand the unexpected.</p></div><FinanceSketch /></section>
    <section className="workspace"><PlanningPanel profile={profile} goal={goal} preference={preference} loading={loading} onProfileChange={updateProfile} onGoalChange={updateGoal} onPreferenceChange={setPreference} onGenerate={generate} /><LensPanel /></section>
    {error && <div className="notice">{error}</div>}{strategies.length > 0 && <StrategyResults strategies={strategies} goalName={goal.name} preference={preference} selectedId={selected?.strategy.id} isDemo={isDemo} onSelect={setSelected} />}{selected && <ResilienceDashboard item={selected} />}
  </main></div>;
}

export default App;
