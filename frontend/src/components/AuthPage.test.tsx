// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "./AuthPage";
import type { FinancialProfileForm } from "../types/financial";

const profile: FinancialProfileForm = {
  income: "250000",
  expenses: "100000",
  savings: "3000000",
  investments: "1500000",
  existingDebt: "0",
  monthlyDebtPayment: "0",
  existingDebtAnnualInterestRate: "0",
  emergencyMonths: "6",
  riskTolerance: "medium",
};

describe("AuthPage", () => {
  afterEach(cleanup);

  it("creates a username-only prototype account with the baseline profile", async () => {
    const user = userEvent.setup();
    const onSignup = vi.fn(async (_username: string, _password: string, _profile: FinancialProfileForm) => undefined);
    render(<AuthPage initialProfile={profile} onLogin={vi.fn()} onSignup={onSignup} />);

    await user.type(screen.getByPlaceholderText("e.g. arjun_rao"), "arjun_rao");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "safe-password");
    const createButtons = screen.getAllByRole("button", { name: "Create account" });
    await user.click(createButtons[createButtons.length - 1]);

    expect(onSignup).toHaveBeenCalledWith("arjun_rao", "safe-password", expect.objectContaining({
      income: "250000",
      existingDebt: "0",
      existingDebtAnnualInterestRate: "0",
    }));
  });

  it("does not ask for the financial baseline during login", async () => {
    const user = userEvent.setup();
    render(<AuthPage initialProfile={profile} onLogin={vi.fn()} onSignup={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: "Log in" })[0]);

    expect(screen.queryByLabelText("Monthly income")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Log in" })).toHaveLength(2);
    expect(screen.getByText(/Prototype login only/)).toBeTruthy();
  });
});
