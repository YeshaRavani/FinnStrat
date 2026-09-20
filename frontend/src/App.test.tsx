// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { mockScenarios, mockStrategies } from "./api/mockStrategies";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const mockSession = {
  user: { id: 1, username: "demo_user", created_at: "2026-01-01T00:00:00Z" },
  profile: {
    monthly_income: 250000,
    monthly_expenses: 100000,
    cash_savings: 3000000,
    investments: 1500000,
    existing_debt: 0,
    monthly_debt_payment: 0,
    existing_debt_annual_interest_rate: 0,
    emergency_reserve_months: 6,
    risk_tolerance: "medium",
  },
  goals: [],
};

describe("app integration", () => {
  it("sends the entered context, ranks strategies, and opens the selected dashboard", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return jsonResponse(mockSession);
      if (url.endsWith("/goals")) return jsonResponse({ id: 1, name: "Education fund", category: "education", target_amount: 1800000, target_date: null, priority: "high", flexibility: "medium", inflation_rate: 0.06, appreciation_rate: 0, asset_type: "consumable", created_at: "2026-01-01T00:00:00Z" });
      if (url.endsWith("/scenarios")) return jsonResponse(mockScenarios);
      if (url.endsWith("/strategies/generate")) return jsonResponse(mockStrategies);
      return jsonResponse(mockStrategies[0].normal_simulation);
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("finnstrat.access_token", "test-token");
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Welcome back, demo/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Plan a new goal" }));
    expect(await screen.findByRole("heading", { name: "What are you planning?" })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Goal category"), "education");
    expect((screen.getByRole("combobox", { name: /value after purchase/i }) as HTMLSelectElement).value).toBe("consumable");
    await user.clear(screen.getByLabelText(/Goal name/));
    await user.type(screen.getByLabelText(/Goal name/), "Education fund");
    await user.click(screen.getByRole("button", { name: "Generate strategies" }));
    expect(await screen.findByRole("heading", { level: 3, name: "Hybrid reserve-first plan" })).toBeTruthy();

    const generateCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/strategies/generate"));
    const body = JSON.parse(String(generateCall?.[1]?.body));
    expect(body.profile.existing_debt).toBe(0);
    expect(body.profile.monthly_debt_payment).toBe(0);
    expect(body.profile.existing_debt_annual_interest_rate).toBe(0);
    expect(body.goal.asset_type).toBe("consumable");
    expect(body.goal.category).toBe("education");

    await user.click(screen.getByRole("button", { name: "low debt" }));
    await waitFor(() => expect(fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/strategies/generate"))).toHaveLength(2));
    const rerankCall = fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/strategies/generate"))[1];
    expect(JSON.parse(String(rerankCall?.[1]?.body)).ranking_preference).toBe("low_debt");

    await user.click(screen.getByRole("button", { name: "Open detailed analysis" }));
    expect(await screen.findByRole("heading", { name: "Hybrid reserve-first plan" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Market crash" }));
    const simulationCalls = () => fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/simulations"));
    await waitFor(() => expect(simulationCalls()).toHaveLength(1));
    const contributionField = screen.getByLabelText(/Monthly contribution/);
    await user.clear(contributionField);
    await user.type(contributionField, "60000");
    await user.click(screen.getByRole("button", { name: "Apply and re-simulate" }));
    await waitFor(() => expect(simulationCalls()).toHaveLength(2));
    const adjustedRequest = JSON.parse(String(simulationCalls()[1][1]?.body));
    expect(adjustedRequest.strategy.id).toBe("hybrid_modified");
    expect(adjustedRequest.strategy.monthly_contribution).toBe(60000);
    expect(await screen.findByRole("heading", { name: "Hybrid reserve-first plan (modified)" })).toBeTruthy();
  });

  it("shows backend errors and clearly labels demo fallback data", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/auth/me")) return jsonResponse(mockSession);
      if (String(input).endsWith("/goals")) return jsonResponse({ id: 1, name: "Buy a car", category: "vehicle", target_amount: 1800000, target_date: null, priority: "high", flexibility: "medium", inflation_rate: 0.06, appreciation_rate: 0, asset_type: "depreciating_asset", created_at: "2026-01-01T00:00:00Z" });
      if (String(input).endsWith("/scenarios")) return jsonResponse(mockScenarios);
      return jsonResponse({ detail: "backend validation failed" }, 422);
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("finnstrat.access_token", "test-token");
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Plan a new goal" }));
    expect(await screen.findByRole("heading", { name: "What are you planning?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate strategies" }));

    expect((await screen.findByRole("alert")).textContent).toContain("backend validation failed");
    expect(screen.getByText("Demo data")).toBeTruthy();
  });

  it("opens a saved goal directly in strategy results", async () => {
    const savedGoal = {
      id: 7,
      name: "Education fund",
      category: "education",
      target_amount: 1800000,
      target_date: null,
      priority: "high",
      flexibility: "medium",
      inflation_rate: 0.06,
      appreciation_rate: 0,
      asset_type: "consumable",
      created_at: "2026-01-01T00:00:00Z",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return jsonResponse({ ...mockSession, goals: [savedGoal] });
      if (url.endsWith("/scenarios")) return jsonResponse(mockScenarios);
      if (url.endsWith("/strategies/generate")) return jsonResponse(mockStrategies);
      return jsonResponse(mockStrategies[0].normal_simulation);
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("finnstrat.access_token", "test-token");
    render(<App />);

    await userEvent.setup().click(await screen.findByRole("button", { name: "Open goal" }));
    expect(await screen.findByRole("heading", { name: "Plans for Education fund" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "What are you planning?" })).toBeNull();
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith("/strategies/generate"))).toBe(true);
  });

  it("uses the latest saved profile when starting a new goal", async () => {
    const updatedProfile = {
      monthly_income: 300000,
      monthly_expenses: 100000,
      cash_savings: 3000000,
      investments: 1500000,
      existing_debt: 0,
      monthly_debt_payment: 0,
      existing_debt_annual_interest_rate: 0,
      emergency_reserve_months: 6,
      risk_tolerance: "medium",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return jsonResponse(mockSession);
      if (url.endsWith("/auth/profile") && init?.method === "PUT") return jsonResponse(updatedProfile);
      if (url.endsWith("/scenarios")) return jsonResponse(mockScenarios);
      if (url.endsWith("/strategies/generate")) return jsonResponse(mockStrategies);
      return jsonResponse(mockStrategies[0].normal_simulation);
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("finnstrat.access_token", "test-token");
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Open profile for @demo_user/ }));
    const incomeField = screen.getByLabelText(/Monthly income/);
    await user.clear(incomeField);
    await user.type(incomeField, "300000");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByRole("heading", { name: /Welcome back, demo/ });
    await user.click(screen.getByRole("button", { name: "Plan a new goal" }));
    await user.click(screen.getByRole("button", { name: "Generate strategies" }));
    await screen.findByRole("heading", { level: 3, name: "Hybrid reserve-first plan" });

    const generateCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/strategies/generate"));
    expect(JSON.parse(String(generateCall?.[1]?.body)).profile.monthly_income).toBe(300000);
  });
});
