import type { RankedStrategy, StrategyRequest } from "../types/strategy";
import { postJson } from "./client";

export function generateStrategies(request: StrategyRequest) {
  return postJson<RankedStrategy[]>("/strategies/generate", request);
}
