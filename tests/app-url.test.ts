import { describe, expect, it } from "vitest";
import { getAppBaseUrl } from "../lib/app-url";

describe("getAppBaseUrl", () => {
  it("uses and normalizes NEXT_PUBLIC_APP_URL", () => {
    const headers = new Headers({ host: "wrong.example.com" });

    expect(getAppBaseUrl(" https://popupgenerator.vercel.app/// ", headers)).toBe(
      "https://popupgenerator.vercel.app",
    );
  });

  it("falls back to the forwarded request origin", () => {
    const headers = new Headers({
      "x-forwarded-host": "preview.example.com",
      "x-forwarded-proto": "https",
    });

    expect(getAppBaseUrl(undefined, headers)).toBe("https://preview.example.com");
  });

  it("provides a safe local fallback without request headers", () => {
    expect(getAppBaseUrl(undefined)).toBe("http://localhost:3000");
  });
});
