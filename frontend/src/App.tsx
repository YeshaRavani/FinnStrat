import { useEffect, useState } from "react";
import { checkAffordability, getScenarios, generateStrategies, runSimulation } from "./api/strategyApi";
import { makeDemoScenario, mockScenarios, mockStrategies } from "./api/mockStrategies";
import { assetTypeForGoalCategory, toStrategyRequest } from "./api/requestBuilder";
import { BrandHeader } from "./components/BrandHeader";
import { DashboardPage } from "./pages/DashboardPage";
import { PlanningPage } from "./pages/PlanningPage";
import { StrategyResultsPage } from "./pages/StrategyResultsPage";
import type { FinancialProfileForm, GoalForm } from "./types/financial";
import type { AffordabilityResult, RankedStrategy, RankingPreference, Scenario, SimulationRequest, SimulationResult, Strategy, StrategyRequest } from "./types/strategy";

type View = "planning" | "results" | "dashboard";

const initialProfile: FinancialProfileForm = {
  income: "250000",
  expenses: "100000",
  savings: "3000000",
  investments: "1500000",
  existingDebt: "0",
  monthlyDebtPayment: "0",
  emergencyMonths: "6",
  riskTolerance: "medium",
};

const initialGoal: GoalForm = {
  name: "Buy a car",
  amount: "1800000",
  category: "vehicle",
  targetDate: "",
  priority: "high",
  flexibility: "medium",
  inflationRate: "6",
  appreciationRate: "0",
  assetType: "depreciating_asset",
};

function App() {
  const [profile, setProfile] = useState(initialProfile);
  const [goal, setGoal] = useState(initialGoal);
  const [preference, setPreference] = useState<RankingPreference>("balanced");
  const [view, setView] = useState<View>("planning");
  const [strategies, setStrategies] = useState<RankedStrategy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modifiedStrategy, setModifiedStrategy] = useState<Strategy | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioCatalogDemo, setScenarioCatalogDemo] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState("normal");
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [lastRequest, setLastRequest] = useState<StrategyRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState("");
  const [scenarioError, setScenarioError] = useState("");
  const [affordability, setAffordability] = useState<AffordabilityResult | null>(null);

  useEffect(() => {
    let active = true;
    getScenarios().then(result => {
      if (active) setScenarios(result);
    }).catch(() => {
      if (active) {
        setScenarios(mockScenarios);
        setScenarioCatalogDemo(true);
      }
    });
    return () => { active = false; };
  }, []);

  const updateProfile = (key: keyof FinancialProfileForm, value: string) => setProfile(current => ({ ...current, [key]: value }));
  const updateGoal = (key: keyof GoalForm, value: string) => setGoal(current => {
    if (key !== "category") return { ...current, [key]: value };
    const category = value;
    const assetType = assetTypeForGoalCategory(category);
    return { ...current, category, assetType };
  });

  const generate = async (nextPreference: RankingPreference = preference) => {
    const request = toStrategyRequest(profile, goal, nextPreference);
    setLoading(true);
    setError("");
    setPreference(nextPreference);
    setLastRequest(request);
    try {
      const affordabilityResult = await checkAffordability(request);
      setAffordability(affordabilityResult);
      if (affordabilityResult.goal_status === "not_feasible") {
        setStrategies([]);
        setView("results");
        return;
      }
      const result = await generateStrategies(request);
      setStrategies(result);
      setIsDemo(false);
      setSelectedId(result[0]?.strategy.id ?? null);
      setModifiedStrategy(null);
      setSimulation(result[0]?.normal_simulation ?? null);
    } catch (cause) {
      setAffordability(null);
      const reason = cause instanceof Error ? cause.message : "Unknown API error";
      setStrategies(mockStrategies);
      setIsDemo(true);
      setSelectedId(mockStrategies[0].strategy.id);
      setModifiedStrategy(null);
      setSimulation(mockStrategies[0].normal_simulation);
      setError(`Live analysis failed: ${reason}. Showing clearly labeled demo results.`);
    } finally {
      setComparedIds([]);
      setActiveScenarioId("normal");
      setView("results");
      setLoading(false);
    }
  };

  const selected = strategies.find(item => item.strategy.id === selectedId) ?? null;
  const openDashboard = (item: RankedStrategy) => {
    setSelectedId(item.strategy.id);
    setModifiedStrategy(null);
    setActiveScenarioId("normal");
    setSimulation(item.normal_simulation);
    setScenarioError("");
    setView("dashboard");
  };

  const runScenario = async (scenarioId = activeScenarioId, strategyOverride: Strategy | null = modifiedStrategy) => {
    if (!selected) return;
    const strategy = strategyOverride ?? selected.strategy;
    setActiveScenarioId(scenarioId);
    setScenarioLoading(true);
    setScenarioError("");
    if (isDemo) {
      setSimulation(makeDemoScenario(selected, scenarioId));
      setScenarioLoading(false);
      return;
    }
    setSimulation(null);
    const scenario = scenarios.find(item => item.id === scenarioId);
    if (!scenario || !lastRequest) {
      setScenarioError("Scenario details are unavailable. Refresh the page and try again.");
      setScenarioLoading(false);
      return;
    }
    const request: SimulationRequest = { ...lastRequest, strategy, scenario };
    try {
      setSimulation(await runSimulation(request));
    } catch (cause) {
      setScenarioError(cause instanceof Error ? cause.message : "Scenario simulation failed.");
    } finally {
      setScenarioLoading(false);
    }
  };

  const toggleCompared = (id: string, checked: boolean) => setComparedIds(current => checked
    ? current.length >= 4 ? current : [...current, id]
    : current.filter(item => item !== id));

  return (
    <div className="app-shell">
      <BrandHeader />
      {view === "planning" && <main className="content"><PlanningPage profile={profile} goal={goal} loading={loading} onProfileChange={updateProfile} onGoalChange={updateGoal} onGenerate={() => generate()} /></main>}
      {view === "results" && <StrategyResultsPage strategies={strategies} goalName={goal.name} preference={preference} selectedId={selectedId} comparedIds={comparedIds} loading={loading} isDemo={isDemo} error={error} affordability={affordability} onSelect={item => setSelectedId(item.strategy.id)} onOpen={openDashboard} onCompare={toggleCompared} onPreferenceChange={next => { void generate(next); }} onRetry={() => { void generate(); }} onEdit={() => setView("planning")} />}
      {view === "dashboard" && selected && <DashboardPage item={selected} strategy={modifiedStrategy ?? selected.strategy} isModified={modifiedStrategy !== null} targetAmount={lastRequest?.goal.target_amount ?? Number(goal.amount)} scenarios={scenarios} scenarioId={activeScenarioId} simulation={simulation} loading={scenarioLoading} error={scenarioError || (scenarioCatalogDemo ? "Using sample scenario definitions." : "")} isDemo={isDemo} profile={lastRequest?.profile ?? toStrategyRequest(profile, goal, preference).profile} onApplyAdjustment={strategy => { setModifiedStrategy(strategy); void runScenario(activeScenarioId, strategy); }} onScenarioChange={id => { void runScenario(id); }} onBack={() => setView("results")} onRetry={() => { void runScenario(); }} />}
    </div>
  );
}

export default App;
