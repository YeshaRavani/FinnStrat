import { useEffect, useState } from "react";
import { checkAffordability, getScenarios, generateStrategies, runSimulation } from "./api/strategyApi";
import { makeDemoScenario, mockScenarios, mockStrategies } from "./api/mockStrategies";
import { getAuthToken, clearAuthToken } from "./api/client";
import { getSession, login, logout, saveGoal, signup, updateProfile as updateProfileApi } from "./api/authApi";
import { assetTypeForGoalCategory, fromProfileRequest, toStrategyRequest } from "./api/requestBuilder";
import { AuthPage } from "./components/AuthPage";
import { BrandHeader } from "./components/BrandHeader";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { PlanningPage } from "./pages/PlanningPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StrategyResultsPage } from "./pages/StrategyResultsPage";
import type { FinancialProfileForm, GoalForm } from "./types/financial";
import type { AuthSession, SavedGoal } from "./types/auth";
import type { AffordabilityResult, RankedStrategy, RankingPreference, Scenario, SimulationRequest, SimulationResult, Strategy, StrategyRequest } from "./types/strategy";

type View = "home" | "planning" | "results" | "dashboard" | "profile";

const initialProfile: FinancialProfileForm = {
  income: "250000",
  expenses: "100000",
  savings: "3000000",
  investments: "1500000",
  existingDebt: "0",
  monthlyDebtPayment: "0",
  existingDebtAnnualInterestRate: "0",
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

function goalFormFromSavedGoal(goal: SavedGoal): GoalForm {
  return {
    name: goal.name,
    amount: String(goal.target_amount),
    category: goal.category,
    targetDate: goal.target_date ?? "",
    priority: goal.priority,
    flexibility: goal.flexibility,
    inflationRate: String(goal.inflation_rate * 100),
    appreciationRate: String(goal.appreciation_rate * 100),
    assetType: goal.asset_type,
  };
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(initialProfile);
  const [goal, setGoal] = useState(initialGoal);
  const [planningStartAtGoal, setPlanningStartAtGoal] = useState(false);
  const [preference, setPreference] = useState<RankingPreference>("balanced");
  const [view, setView] = useState<View>("home");
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
    if (!getAuthToken()) {
      setAuthLoading(false);
      return () => { active = false; };
    }
    getSession().then(next => {
      if (!active) return;
      setSession(next);
      setProfile(fromProfileRequest(next.profile));
    }).catch(() => {
      clearAuthToken();
    }).finally(() => {
      if (active) setAuthLoading(false);
    });
    return () => { active = false; };
  }, []);

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

  const updateProfile = (key: keyof FinancialProfileForm, value: string) => setProfile(current => (
    key === "existingDebt" && Number(value) === 0
      ? { ...current, existingDebt: value, existingDebtAnnualInterestRate: "0" }
      : { ...current, [key]: value }
  ));
  const updateGoal = (key: keyof GoalForm, value: string) => setGoal(current => {
    if (key !== "category") return { ...current, [key]: value };
    const category = value;
    const assetType = assetTypeForGoalCategory(category);
    return { ...current, category, assetType };
  });

  const generate = async (nextPreference: RankingPreference = preference, goalOverride: GoalForm = goal) => {
    const request = toStrategyRequest(profile, goalOverride, nextPreference);
    setLoading(true);
    setError("");
    setPreference(nextPreference);
    setLastRequest(request);
    try {
      if (session) {
        void saveGoal(goalOverride).then(savedGoal => {
          setSession(current => current
            ? { ...current, goals: [savedGoal, ...current.goals.filter(item => item.name !== savedGoal.name)] }
            : current);
        }).catch(() => undefined);
      }
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

  const applySession = (next: AuthSession) => {
    setSession(next);
    setProfile(fromProfileRequest(next.profile));
    setView("home");
    setError("");
    setStrategies([]);
    setSelectedId(null);
    setModifiedStrategy(null);
    setSimulation(null);
    setLastRequest(null);
  };

  const handleProfileSave = async (nextProfile: FinancialProfileForm) => {
    const updated = await updateProfileApi(nextProfile);
    setProfile(fromProfileRequest(updated));
    setSession(current => current ? { ...current, profile: updated } : current);
    setView("home");
  };

  const handleNewGoal = () => {
    setGoal(initialGoal);
    setPlanningStartAtGoal(true);
    setStrategies([]);
    setSelectedId(null);
    setModifiedStrategy(null);
    setSimulation(null);
    setLastRequest(null);
    setView("planning");
  };

  const handleOpenGoal = (savedGoal: SavedGoal) => {
    const savedGoalForm = goalFormFromSavedGoal(savedGoal);
    setGoal(savedGoalForm);
    setPlanningStartAtGoal(true);
    setStrategies([]);
    setSelectedId(null);
    setModifiedStrategy(null);
    setSimulation(null);
    setLastRequest(null);
    void generate(preference, savedGoalForm);
  };

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    setSession(null);
    setProfile(initialProfile);
    setGoal(initialGoal);
    setView("planning");
    setStrategies([]);
    setSelectedId(null);
    setModifiedStrategy(null);
    setSimulation(null);
    setLastRequest(null);
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
      <BrandHeader user={session?.user} onHome={session ? () => setView("home") : undefined} onProfile={session ? () => setView("profile") : undefined} onLogout={session ? () => { void handleLogout(); } : undefined} />
      {authLoading && <main className="content auth-loading"><p className="section-label">SECURE WORKSPACE</p><h1>Loading your plan…</h1></main>}
      {!authLoading && !session && <AuthPage initialProfile={initialProfile} onLogin={async (username, password) => applySession(await login(username, password))} onSignup={async (username, password, nextProfile) => applySession(await signup(username, password, nextProfile))} />}
      {!authLoading && session && view === "home" && <HomePage user={session.user} goals={session.goals} monthlyIncome={Number(profile.income)} monthlyExpenses={Number(profile.expenses)} onNewGoal={handleNewGoal} onOpenGoal={handleOpenGoal} />}
      {!authLoading && session && view === "planning" && <main className="content"><PlanningPage profile={profile} goal={goal} loading={loading} onProfileChange={updateProfile} onGoalChange={updateGoal} onGenerate={() => generate()} startAtGoal={planningStartAtGoal} onBack={() => setView("home")} /></main>}
      {!authLoading && session && view === "results" && <StrategyResultsPage strategies={strategies} goalName={goal.name} preference={preference} selectedId={selectedId} comparedIds={comparedIds} loading={loading} isDemo={isDemo} error={error} affordability={affordability} onSelect={item => setSelectedId(item.strategy.id)} onOpen={openDashboard} onCompare={toggleCompared} onPreferenceChange={next => { void generate(next); }} onRetry={() => { void generate(); }} onEdit={() => setView("planning")} onBack={() => setView("planning")} />}
      {!authLoading && session && view === "dashboard" && selected && <DashboardPage item={selected} strategy={modifiedStrategy ?? selected.strategy} isModified={modifiedStrategy !== null} targetAmount={lastRequest?.goal.target_amount ?? Number(goal.amount)} scenarios={scenarios} scenarioId={activeScenarioId} simulation={simulation} loading={scenarioLoading} error={scenarioError || (scenarioCatalogDemo ? "Using sample scenario definitions." : "")} isDemo={isDemo} profile={lastRequest?.profile ?? toStrategyRequest(profile, goal, preference).profile} onApplyAdjustment={strategy => { setModifiedStrategy(strategy); void runScenario(activeScenarioId, strategy); }} onScenarioChange={id => { void runScenario(id); }} onBack={() => setView("results")} onRetry={() => { void runScenario(); }} />}
      {!authLoading && session && view === "profile" && <ProfilePage user={session.user} profile={profile} goals={session.goals} onSave={handleProfileSave} onBack={() => setView("home")} />}
    </div>
  );
}

export default App;
