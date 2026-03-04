import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleShell } from "../ConsoleShell";

describe("ConsoleShell", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders generation success flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          text: "Test generated content",
          model: "openai-codex/gpt-5.3-codex",
          latencyMs: 120,
          traceId: "trace-1",
        }),
      }),
    );

    render(<ConsoleShell />);
    fireEvent.change(screen.getByPlaceholderText(/Write a launch announcement/i), {
      target: { value: "Write a short teaser" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate/i }));

    await waitFor(() => {
      expect(screen.getByText("Test generated content")).toBeInTheDocument();
    });
    expect(screen.getByText(/Generation completed/i)).toBeInTheDocument();
  });

  it("shows gateway-down banner on API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          code: "GATEWAY_UNREACHABLE",
          message: "gateway down",
          traceId: "trace-2",
        }),
      }),
    );

    render(<ConsoleShell />);
    fireEvent.change(screen.getByPlaceholderText(/Write a launch announcement/i), {
      target: { value: "try again" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/OpenClaw gateway is unreachable/i).length).toBeGreaterThan(0);
    });
  });
});
