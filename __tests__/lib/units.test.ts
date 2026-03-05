import { toKg, fromKg, roundToPlate, calculatePercentage, formatWeight } from "@/lib/units";

const LBS_PER_KG = 2.20462;

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

describe("roundToPlate", () => {
  it("rounds to nearest 2.5 kg increment", () => {
    expect(roundToPlate(96, 2.5, "kg")).toBe(95);
    expect(roundToPlate(97.5, 2.5, "kg")).toBe(97.5);
    expect(roundToPlate(98, 2.5, "kg")).toBe(97.5);
    expect(roundToPlate(98.8, 2.5, "kg")).toBe(100);
  });

  it("rounds to nearest 5 kg increment", () => {
    expect(roundToPlate(97, 5, "kg")).toBe(95);
    expect(roundToPlate(103, 5, "kg")).toBe(105);
  });

  it("rounds lbs using converted increment", () => {
    const result = roundToPlate(fromKg(100, "lbs"), 2.5, "lbs");
    // 100 kg = 220.462 lbs, increment = 5.511 lbs → nearest = 220.462
    expect(result).toBeCloseTo(220.5, 0);
  });

  it("handles zero", () => {
    expect(roundToPlate(0, 2.5, "kg")).toBe(0);
  });
});

describe("calculatePercentage", () => {
  it("calculates 80% of 100 kg", () => {
    const { raw, rounded } = calculatePercentage(100, 80, "kg", 2.5);
    expect(raw).toBe(80);
    expect(rounded).toBe(80);
  });

  it("calculates 75% of 120 kg", () => {
    const { raw, rounded } = calculatePercentage(120, 75, "kg", 2.5);
    expect(raw).toBe(90);
    expect(rounded).toBe(90);
  });

  it("rounds to plate increment when not exact", () => {
    // 83% of 100 kg = 83 kg → rounds to 82.5 kg
    const { rounded } = calculatePercentage(100, 83, "kg", 2.5);
    expect(rounded).toBe(82.5);
  });

  it("works in lbs", () => {
    // 80% of 100 kg = 80 kg = 176.37 lbs → rounds to nearest 5.511
    const { raw } = calculatePercentage(100, 80, "lbs", 2.5);
    expect(raw).toBeCloseTo(176.4, 1);
  });

  it("handles 100%", () => {
    const { raw, rounded } = calculatePercentage(100, 100, "kg", 2.5);
    expect(raw).toBe(100);
    expect(rounded).toBe(100);
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
