import type { Scenario } from "../types/strategy";

export function ScenarioSelector({ scenarios, selectedId, loading, onChange }: { scenarios: Scenario[]; selectedId: string; loading: boolean; onChange: (id: string) => void }) {
  return (
    <div className="scenario-control" aria-label="Simulation scenario">
      <span className="chart-label">SCENARIO</span>
      <div className="scenario-tabs" role="group" aria-label="Choose a stress scenario">
        {scenarios.map(scenario => <button type="button" className={selectedId === scenario.id ? "scenario-tab active" : "scenario-tab"} aria-pressed={selectedId === scenario.id} disabled={loading} onClick={() => onChange(scenario.id)} key={scenario.id}>{scenario.name}</button>)}
      </div>
    </div>
  );
}
