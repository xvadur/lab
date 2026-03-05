import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../widget/src/main";

describe("widget", () => {
  it("shows fallback error when bridge is missing", async () => {
    render(<App />);
    const button = screen.getByRole("button", { name: "Generate" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText(/No ChatGPT bridge available/i).length).toBeGreaterThan(0);
    });
  });
});
