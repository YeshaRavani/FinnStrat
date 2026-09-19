import type { RankedStrategy, Scenario, SimulationRequest, SimulationResult, StrategyRequest } from "../types/strategy";
import { getJson, postJson } from "./client";

export function generateStrategies(request: StrategyRequest) {
  return postJson<RankedStrategy[]>("/strategies/generate", request);
}

export function getScenarios() {
  return getJson<Scenario[]>("/scenarios");
}

export function runSimulation(request: SimulationRequest) {
  return postJson<SimulationResult>("/simulations", request);
}
