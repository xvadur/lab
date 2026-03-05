import { describe, expect, it } from "vitest";
import { createMcpServer } from "../server/mcp-server";

describe("mcp server scaffold", () => {
  it("creates server without throwing", () => {
    expect(() => createMcpServer()).not.toThrow();
  });
});
