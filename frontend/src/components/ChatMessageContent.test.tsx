// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessageContent } from "./ChatMessageContent";

describe("ChatMessageContent", () => {
  it("renders common assistant markdown as readable UI", () => {
    const { container } = render(<ChatMessageContent content={'### Why this plan\n\n**Strong fit**\n\n- No loan\n- Highest wealth score\n\n| Metric | Result |\n| --- | --- |\n| Liquidity | 100 / 100 |'} />);

    expect(screen.getByRole("heading", { name: "Why this plan" })).toBeTruthy();
    expect(screen.getByText("Strong fit")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("| --- |");
  });
});
