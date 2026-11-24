import { describe, expect, it } from "vitest";
import { authErrorReason, isAcceptedOtpType, safeNextPath } from "@/lib/auth/redirects";

describe("auth callback redirects", () => {
  it("defaults to the localized confirmation page", () => {
    expect(safeNextPath(null, "fr")).toBe("/fr/auth/confirmed");
  });

  it("allows same-site paths in the user's language", () => {
    expect(safeNextPath("/en/post-ad", "en")).toBe("/en/post-ad");
    expect(safeNextPath("/fr/search?q=moto", "fr")).toBe("/fr/search?q=moto");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "/en//evil.example",
    "/\\evil.example",
    "/en/\\evil",
    "javascript:alert(1)",
    "/fr/search",
    "/en/%0d%0aSet-Cookie:x",
    "/en/\u0000",
  ])("rejects %s", (next) => {
    const result = safeNextPath(next, "en");
    expect(result === "/en/auth/confirmed" || result.startsWith("/en/")).toBe(true);
    expect(result).not.toContain("evil");
    expect(result).not.toMatch(/^\/\//);
  });

  it("accepts only known email link types", () => {
    expect(isAcceptedOtpType("signup")).toBe(true);
    expect(isAcceptedOtpType("sms")).toBe(false);
    expect(isAcceptedOtpType(null)).toBe(false);
  });

  it("maps expiry error codes", () => {
    expect(authErrorReason("otp_expired")).toBe("expired");
    expect(authErrorReason("bad_jwt")).toBe("invalid");
  });
});
