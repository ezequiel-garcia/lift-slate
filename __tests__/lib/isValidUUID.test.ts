import { isValidUUID } from "@/lib/constants";

describe("isValidUUID", () => {
  it("returns true for valid lowercase UUID", () => {
    expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("returns true for valid uppercase UUID", () => {
    expect(isValidUUID("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
  });

  it("returns true for valid mixed-case UUID", () => {
    expect(isValidUUID("550e8400-e29b-41d4-A716-446655440000")).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(isValidUUID(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("returns false for plain string", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
  });

  it("returns false for UUID missing hyphens", () => {
    expect(isValidUUID("123e4567e89b12d3a456426614174000")).toBe(false);
  });

  it("returns false for UUID with wrong segment lengths", () => {
    expect(isValidUUID("123e4567-e89b-12d3-a456-42661417400")).toBe(false);
  });

  it("returns false for path traversal attempt", () => {
    expect(isValidUUID("../../etc/passwd")).toBe(false);
  });

  it("returns false for SQL injection attempt", () => {
    expect(isValidUUID("' OR '1'='1")).toBe(false);
  });

  it("returns false for UUID with extra characters", () => {
    expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000-extra")).toBe(false);
  });

  it("acts as a type guard — narrows undefined to string", () => {
    const value: string | undefined = "123e4567-e89b-12d3-a456-426614174000";
    if (isValidUUID(value)) {
      const _narrowed: string = value; // should compile without error
      expect(typeof _narrowed).toBe("string");
    }
  });
});
