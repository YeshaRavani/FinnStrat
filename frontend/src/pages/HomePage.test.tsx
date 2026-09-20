// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";

const user = { id: 7, username: "arjun_rao", created_at: "2026-01-01T00:00:00Z" };

const goal = {
  id: 10,
  name: "Buy a car",
  category: "vehicle",
  target_amount: 1800000,
  target_date: "2027-06",
  priority: "high" as const,
  flexibility: "medium" as const,
  inflation_rate: 0.06,
  appreciation_rate: 0,
  asset_type: "depreciating_asset" as const,
  created_at: "2026-01-01T00:00:00Z",
};

describe("HomePage", () => {
  afterEach(cleanup);

  it("welcomes the user and exposes saved goals and the new-goal action", async () => {
    const openGoal = vi.fn();
    const newGoal = vi.fn();
    const event = userEvent.setup();
    render(<HomePage user={user} goals={[goal]} monthlyIncome={250000} monthlyExpenses={100000} onNewGoal={newGoal} onOpenGoal={openGoal} />);

    expect(screen.getByRole("heading", { name: "Welcome back, arjun." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Previous goals" })).toBeTruthy();
    expect(screen.getByText("Buy a car")).toBeTruthy();
    await event.click(screen.getByRole("button", { name: "Open goal" }));
    await event.click(screen.getByRole("button", { name: "Plan a new goal" }));
    expect(openGoal).toHaveBeenCalledWith(goal);
    expect(newGoal).toHaveBeenCalledOnce();
  });

  it("gives a clear first-goal prompt for a new account", () => {
    render(<HomePage user={user} goals={[]} monthlyIncome={250000} monthlyExpenses={100000} onNewGoal={vi.fn()} onOpenGoal={vi.fn()} />);

    expect(screen.getByText("Your planning library is ready.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create your first goal" })).toBeTruthy();
  });
});
