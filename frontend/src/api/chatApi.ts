import type { StrategyChatRequest, StrategyChatResponse } from "../types/chat";
import { postJson } from "./client";

export function askStrategyChat(request: StrategyChatRequest) {
  return postJson<StrategyChatResponse>("/chat/strategy", request);
}
