import { describe, expect, it } from "vitest";
import { toToolError } from "../server/errors";

describe("error mapping", () => {
  it("maps known code", () => {
    const out = toToolError({ code: "AUTH_FAILED" }, "11111111-1111-4111-8111-111111111111");
    expect(out.code).toBe("AUTH_FAILED");
    expect(out.traceId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("maps unknown to internal", () => {
    const out = toToolError(new Error("x"), "22222222-2222-4222-8222-222222222222");
    expect(out.code).toBe("INTERNAL");
    expect(out.traceId).toBe("22222222-2222-4222-8222-222222222222");
  });
});
