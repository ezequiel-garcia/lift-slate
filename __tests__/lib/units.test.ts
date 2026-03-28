import { toKg, fromKg, calculatePercentage, formatWeight } from "@/lib/units";

describe("toKg", () => {
  it("returns value unchanged for kg", () => {
    expect(toKg(100, "kg")).toBe(100);
  });

  it("converts lbs to kg", () => {
    expect(toKg(100, "lbs")).toBeCloseTo(45.359, 3);
  });

  it("handles zero", () => {
    expect(toKg(0, "lbs")).toBe(0);
  });

  it("handles very small weights", () => {
    expect(toKg(0.5, "lbs")).toBeCloseTo(0.227, 3);
  });
});

describe("fromKg", () => {
  it("returns value unchanged for kg", () => {
    expect(fromKg(100, "kg")).toBe(100);
  });

  it("converts kg to lbs", () => {
    expect(fromKg(100, "lbs")).toBeCloseTo(220.462, 3);
  });

  it("handles zero", () => {
    expect(fromKg(0, "lbs")).toBe(0);
  });

  it("handles very small weights", () => {
    expect(fromKg(0.5, "lbs")).toBeCloseTo(1.102, 3);
  });
});

describe("calculatePercentage", () => {
  it("calculates 80% of 100 kg in kg", () => {
    expect(calculatePercentage(100, 80, "kg")).toBe(80);
  });

  it("calculates 75% of 120 kg in kg", () => {
    expect(calculatePercentage(120, 75, "kg")).toBe(90);
  });

  it("calculates percentage with rounding to 1 decimal", () => {
    // 83% of 100 kg = 83 kg
    expect(calculatePercentage(100, 83, "kg")).toBe(83);
  });

  it("works in lbs", () => {
    // 80% of 100 kg = 80 kg = 176.4 lbs
    expect(calculatePercentage(100, 80, "lbs")).toBeCloseTo(176.4, 1);
  });

  it("handles 100%", () => {
    expect(calculatePercentage(100, 100, "kg")).toBe(100);
  });
});

describe("round-trip conversion", () => {
  it("lbs → kg → lbs preserves value within floating point tolerance", () => {
    const original = 225;
    const kg = toKg(original, "lbs");
    const backToLbs = fromKg(kg, "lbs");
    expect(backToLbs).toBeCloseTo(original, 5);
  });

  it("kg → lbs → kg preserves value", () => {
    const original = 100;
    const lbs = fromKg(original, "lbs");
    const backToKg = toKg(lbs, "lbs");
    expect(backToKg).toBeCloseTo(original, 5);
  });
});

describe("formatWeight", () => {
  it("formats integer weights without decimal", () => {
    expect(formatWeight(100, "kg")).toBe("100 kg");
  });

  it("formats decimal weights with one decimal place", () => {
    expect(formatWeight(97.5, "kg")).toBe("97.5 kg");
  });

  it("formats lbs", () => {
    expect(formatWeight(225, "lbs")).toBe("225 lbs");
  });
});
