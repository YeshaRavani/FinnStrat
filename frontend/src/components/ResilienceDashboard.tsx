import { useState } from "react";
import type { RankedStrategy, SimulationResult } from "../types/strategy";

export function ResilienceDashboard({ item }: { item: RankedStrategy }) {
  const [scenario, setScenario] = useState<"normal" | "stress">("stress");
  const simulation = scenario === "normal" ? item.normal_simulation : item.stress_simulation;
  return <section className="dashboard"><div className="results-heading"><div><p className="section-label">03 / RESILIENCE READOUT</p><h2>Where this plan holds—and where it bends</h2></div><span className="results-note">{scenario === "normal" ? "Normal conditions" : "Combined shock"}</span></div><div className="scenario-tabs">{[["normal", "Normal conditions"], ["stress", "Combined shock"]].map(([value, label]) => <button type="button" className={scenario === value ? "scenario-tab active" : "scenario-tab"} onClick={() => setScenario(value as "normal" | "stress")} key={value}>{label}</button>)}</div><div className="dashboard-grid"><Trajectory simulation={simulation} /><Readout item={item} simulation={simulation} /></div></section>;
}

function Trajectory({ simulation }: { simulation?: SimulationResult }) {
  const points = simulation?.monthly_results ?? [];
  if (!points.length) return <div className="chart-panel"><span className="chart-label">LIQUIDITY TRAJECTORY</span><div className="empty-chart">Run a live simulation to see the trajectory.</div></div>;
  const values = points.map(point => point.cash_balance); const min = Math.min(...values, 0); const max = Math.max(...values, 1); const scale = (value: number) => 100 - ((value - min) / (max - min)) * 90 - 5; const path = values.map((value, index) => `${index ? "L" : "M"}${(index / Math.max(values.length - 1, 1)) * 100},${scale(value)}`).join(" ");
  return <div className="chart-panel"><div className="chart-heading"><div><span className="chart-label">LIQUIDITY TRAJECTORY</span><strong>Cash balance over time</strong></div><span className="chart-legend"><i /> Cash</span></div><svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1={scale(0)} x2="100" y2={scale(0)} className="zero-line" /><path d={path} className="chart-line" /></svg></div>;
}

function Readout({ item, simulation }: { item: RankedStrategy; simulation?: SimulationResult }) {
  return <div className="readout-panel"><span className="chart-label">STRESS TEST RESULT</span><div className="big-score">{Math.round(item.resilience_score)}<small>/100</small></div><p>{simulation?.breaking_point_month ? `First constraint breach at month ${simulation.breaking_point_month}: ${simulation.breaking_point_cause?.replaceAll("_", " ")}.` : "No safety constraint was breached in this scenario."}</p><div className="readout-row"><span>MATURITY</span><b>{item.maturity_month ? `Month ${item.maturity_month}` : "Not reached"}</b></div><div className="readout-row"><span>RECOVERY</span><b>{simulation?.recovery_month ? `Month ${simulation.recovery_month}` : "No breach"}</b></div></div>;
}
