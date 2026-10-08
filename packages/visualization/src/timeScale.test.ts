import { describe, expect, it } from "vitest";
import { segmentedScale, linearScale, ticksFor } from "./timeScale";
import { timeWeight } from "./weights";

describe("segmented time scale", () => {
  const s = segmentedScale();
  it("maps domain ends to 0 and 1", () => {
    expect(s.toUnit(s.domain[0])).toBe(0);
    expect(s.toUnit(s.domain[1])).toBe(1);
  });
  it("is monotonic and invertible", () => {
    let prev = -1;
    for (let y = -49999; y <= 1500; y += 137) {
      const u = s.toUnit(y);
      expect(u).toBeGreaterThanOrEqual(prev);
      prev = u;
      expect(Math.abs(s.fromUnit(u) - y)).toBeLessThan(1e-6 * 60000);
    }
  });
  it("puts segment boundaries at cumulative shares", () => {
    expect(s.toUnit(-14999)).toBeCloseTo(0.2, 6);
    expect(s.toUnit(0)).toBeCloseTo(0.8, 6);
  });
  it("linear scale", () => {
    const l = linearScale(-5000, -3000);
    expect(l.toUnit(-4000)).toBe(0.5);
  });
  it("ticks lie inside the domain", () => {
    for (const t of ticksFor(s, 1000)) expect(t).toBeGreaterThanOrEqual(-49999);
  });
});

describe("time weight", () => {
  it("is zero outside the window", () => expect(timeWeight(-3000, -2900, -2000, 100)).toBe(0));
  it("is 1 for a narrow range inside the window", () => expect(timeWeight(-2050, -2000, -2000, 100)).toBe(1));
  it("is faint for a very broad range", () => expect(timeWeight(-5000, 1000, -2000, 100)).toBeLessThan(0.3));
});
