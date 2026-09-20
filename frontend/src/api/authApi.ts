import { clearAuthToken, getJson, postJson, putJson, setAuthToken } from "./client";
import type { FinancialProfileForm, GoalForm } from "../types/financial";
import type { AuthSession, ApiProfile, SavedGoal } from "../types/auth";
import { toProfileRequest } from "./requestBuilder";

export async function signup(username: string, password: string, profile: FinancialProfileForm): Promise<AuthSession> {
  const session = await postJson<AuthSession>("/auth/signup", { username, password, profile: toProfileRequest(profile) });
  setAuthToken(session.access_token ?? "");
  return session;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const session = await postJson<AuthSession>("/auth/login", { username, password });
  setAuthToken(session.access_token ?? "");
  return session;
}

export async function getSession(): Promise<AuthSession> {
  return getJson<AuthSession>("/auth/me");
}

export async function updateProfile(profile: FinancialProfileForm): Promise<ApiProfile> {
  return putJson<ApiProfile>("/auth/profile", toProfileRequest(profile));
}

export async function saveGoal(goal: GoalForm): Promise<SavedGoal> {
  return postJson<SavedGoal>("/goals", {
    name: goal.name.trim(),
    category: goal.category,
    target_amount: Number(goal.amount),
    target_date: goal.targetDate || null,
    priority: goal.priority,
    flexibility: goal.flexibility,
    inflation_rate: Number(goal.inflationRate) / 100,
    appreciation_rate: Number(goal.appreciationRate) / 100,
    asset_type: goal.assetType,
  });
}

export async function logout() {
  try {
    await postJson<void>("/auth/logout", {});
  } finally {
    clearAuthToken();
  }
}
