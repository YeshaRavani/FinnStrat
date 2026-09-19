// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { mockScenarios, mockStrategies } from "./api/mockStrategies";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("app integration", () => {
  it("sends the entered context, ranks strategies, and opens the selected dashboard", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/scenarios")) return jsonResponse(mockScenarios);
      if (url.endsWith("/strategies/generate")) return jsonResponse(mockStrategies);
      return jsonResponse(mockStrategies[0].normal_simulation);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Continue to goal" }));
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
      if (String(input).endsWith("/scenarios")) return jsonResponse(mockScenarios);
      return jsonResponse({ detail: "backend validation failed" }, 422);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Continue to goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate strategies" }));

    expect((await screen.findByRole("alert")).textContent).toContain("backend validation failed");
    expect(screen.getByText("Demo data")).toBeTruthy();
  });
});
