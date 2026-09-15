import { describe, expect, it } from "vitest";
import { selectVariant } from "@/lib/variant-assignment";

describe("persistent variant allocation", () => {
  it("keeps the persisted assignment across reorder, additions, and allocation changes", () => {
    expect(selectVariant("visitor", "campaign", ["c", "a", "b"], "b")).toBe("b");
    expect(selectVariant("visitor", "campaign", ["new", "b", "a"], "b")).toBe("b");
  });

  it("safely reallocates when the assigned variant is no longer enabled", () => {
    expect(["a", "c"]).toContain(selectVariant("visitor", "campaign", ["a", "c"], "disabled"));
  });

  it("distributes different visitors approximately evenly", () => {
    const counts = { a: 0, b: 0, c: 0 };
    for (let index = 0; index < 3000; index += 1) {
      counts[selectVariant(`visitor-${index}`, "campaign", Object.keys(counts)) as keyof typeof counts] += 1;
    }
    expect(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts))).toBeLessThan(150);
  });
});
