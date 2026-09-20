// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreferenceSelector } from "./PreferenceSelector";
import { StrategyCard } from "./StrategyCard";
import { mockStrategies } from "../api/mockStrategies";

describe("strategy UI", () => {
  it("emits a selected ranking preference", () => {
    const onChange = vi.fn();
    render(<PreferenceSelector value="balanced" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "low debt" }));

    expect(onChange).toHaveBeenCalledWith("low_debt");
  });

  it("renders live strategy scores and supports selection and comparison", () => {
    const onSelect = vi.fn();
    const onCompare = vi.fn();
    render(<StrategyCard item={mockStrategies[0]} rank={1} selected={false} compared={false} onSelect={onSelect} onCompare={onCompare} />);

    expect(screen.getByText("Hybrid reserve-first plan")).toBeTruthy();
    expect(screen.getByText("84")).toBeTruthy();
    expect(screen.getByText("PLAN FIT")).toBeTruthy();
    expect(screen.getByText("STRESS TEST")).toBeTruthy();
    expect(screen.getByText("DOWN PAYMENT")).toBeTruthy();
    expect(screen.getByText("LOAN TERMS")).toBeTruthy();
    expect(screen.getByText("EST. EMI")).toBeTruthy();
    expect(screen.getByText("EST. INTEREST")).toBeTruthy();
    expect(screen.getByText("LOAN PAYOFF")).toBeTruthy();
    expect(screen.getByText("CASH AT HORIZON")).toBeTruthy();
    expect(screen.getByText("INVESTMENTS AT HORIZON")).toBeTruthy();
    expect(screen.getByText("NET WORTH AT HORIZON")).toBeTruthy();
    expect(screen.getByText("INVESTED SHARE")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open analysis" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onCompare).toHaveBeenCalledWith(true);
  });
});
