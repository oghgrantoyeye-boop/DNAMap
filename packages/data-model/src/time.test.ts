import { describe, expect, it } from "vitest";
import { formatRange, formatYear, formatYearsAgo, bpToYear } from "./time";

describe("astronomical year display", () => {
  it("handles the BCE/CE boundary without a year zero", () => {
    expect(formatYear(0)).toBe("1 BCE");
    expect(formatYear(1)).toBe("1 CE");
    expect(formatYear(-2999)).toBe("3000 BCE");
  });
  it("rounds deep dates for display only", () => {
    expect(formatYear(-43050)).toBe("43,100 BCE");
    expect(formatYear(-8001)).toBe("8000 BCE");
  });
  it("formats ranges", () => {
    expect(formatRange(-3299, -2599)).toBe("3300–2600 BCE");
    expect(formatRange(-199, 100)).toBe("200 BCE – 100 CE");
    expect(formatRange(1000, 1500)).toBe("1000–1500 CE");
  });
  it("years ago is relative to 2000 CE", () => {
    expect(formatYearsAgo(0)).toBe("2000 years ago");
  });
  it("converts BP (1950-based)", () => {
    expect(bpToYear(1950)).toBe(0);
    expect(bpToYear(5626)).toBe(-3676);
  });
});
