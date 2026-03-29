import { estimate1RM, MAX_RELIABLE_REPS } from "@/lib/estimate";

describe("estimate1RM", () => {
  describe("invalid inputs → returns 0", () => {
    it("returns 0 for zero reps", () => {
      expect(estimate1RM(100, 0)).toBe(0);
    });

    it("returns 0 for negative reps", () => {
      expect(estimate1RM(100, -1)).toBe(0);
    });

    it("returns 0 for zero weight", () => {
      expect(estimate1RM(0, 5)).toBe(0);
    });

    it("returns 0 for negative weight", () => {
      expect(estimate1RM(-50, 5)).toBe(0);
    });

    it("returns 0 when both weight and reps are zero", () => {
      expect(estimate1RM(0, 0)).toBe(0);
    });

    it("returns 0 when both weight and reps are negative", () => {
      expect(estimate1RM(-100, -5)).toBe(0);
    });
  });

  describe("reps === 1 → returns weight directly", () => {
    it("returns weight unchanged for 1 rep", () => {
      expect(estimate1RM(100, 1)).toBe(100);
    });

    it("returns fractional weight unchanged for 1 rep", () => {
      expect(estimate1RM(102.5, 1)).toBe(102.5);
    });

    it("returns very heavy weight unchanged for 1 rep", () => {
      expect(estimate1RM(300, 1)).toBe(300);
    });
  });

  describe("Epley formula: weight × (1 + reps / 30)", () => {
    it("calculates correctly for 2 reps", () => {
      // 100 × (1 + 2/30) = 100 × 1.0667 = 106.667
      expect(estimate1RM(100, 2)).toBeCloseTo(106.667, 3);
    });

    it("calculates correctly for 3 reps", () => {
      // 100 × (1 + 3/30) = 100 × 1.1 = 110
      expect(estimate1RM(100, 3)).toBeCloseTo(110, 3);
    });

    it("calculates correctly for 5 reps", () => {
      // 100 × (1 + 5/30) = 100 × 1.1667 = 116.667
      expect(estimate1RM(100, 5)).toBeCloseTo(116.667, 3);
    });

    it("calculates correctly for 8 reps", () => {
      // 100 × (1 + 8/30) = 100 × 1.2667 = 126.667
      expect(estimate1RM(100, 8)).toBeCloseTo(126.667, 3);
    });

    it("calculates correctly for 10 reps", () => {
      // 100 × (1 + 10/30) = 100 × 1.3333 = 133.333
      expect(estimate1RM(100, 10)).toBeCloseTo(133.333, 3);
    });

    it("scales linearly with weight for 5 reps", () => {
      const result200 = estimate1RM(200, 5);
      const result100 = estimate1RM(100, 5);
      expect(result200).toBeCloseTo(result100 * 2, 5);
    });
  });

  describe("edge cases", () => {
    it("handles very heavy weights (e.g. 300 kg at 5 reps)", () => {
      // 300 × (1 + 5/30) = 300 × 1.1667 = 350
      expect(estimate1RM(300, 5)).toBeCloseTo(350, 1);
    });

    it("handles fractional weights (e.g. 102.5 kg at 3 reps)", () => {
      // 102.5 × (1 + 3/30) = 102.5 × 1.1 = 112.75
      expect(estimate1RM(102.5, 3)).toBeCloseTo(112.75, 5);
    });

    it("handles very small fractional weights (e.g. 0.5 kg at 5 reps)", () => {
      // 0.5 × (1 + 5/30) ≈ 0.5833
      expect(estimate1RM(0.5, 5)).toBeCloseTo(0.5 * (1 + 5 / 30), 10);
    });

    it("produces a result greater than weight for any reps > 1", () => {
      expect(estimate1RM(100, 2)).toBeGreaterThan(100);
      expect(estimate1RM(100, 10)).toBeGreaterThan(100);
    });

    it("result increases as reps increase for fixed weight", () => {
      const at5 = estimate1RM(100, 5);
      const at10 = estimate1RM(100, 10);
      expect(at10).toBeGreaterThan(at5);
    });
  });
});

describe("MAX_RELIABLE_REPS", () => {
  it("is exactly 10", () => {
    expect(MAX_RELIABLE_REPS).toBe(10);
  });
});
