import type { SimulationResult } from "../types/strategy";

export function BreakingPointCard({ simulation, originalRecoveryMonth }: { simulation: SimulationResult; originalRecoveryMonth?: number | null }) {
  return (
    <section className={`breaking-point ${simulation.breaking_point_month ? "has-breach" : "no-breach"}`}>
      <span className="chart-label">STRESS OUTCOME</span>
      <h3>{simulation.breaking_point_month ? `First constraint breach: month ${simulation.breaking_point_month}` : "No constraint breach recorded"}</h3>
      <p>{simulation.breaking_point_cause?.replaceAll("_", " ") ?? "The plan stayed within the modeled constraints."}</p>
      <div className="readout-row"><span>RECOVERY</span><b>{simulation.recovery_month ? `Month ${simulation.recovery_month}` : simulation.breaking_point_month ? "Not recovered" : "Not needed"}</b></div>
      {originalRecoveryMonth !== undefined && <div className="readout-row"><span>ORIGINAL RECOVERY</span><b>{originalRecoveryMonth ? `Month ${originalRecoveryMonth}` : "Not recovered"}</b></div>}
    </section>
  );
}
