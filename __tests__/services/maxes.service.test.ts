import {
  getCurrentMaxes,
  getMaxHistory,
  createMax,
  updateMax,
  deleteMax,
  getAthleteMaxes,
  createAthleteMax,
  updateAthleteMax,
  deleteExerciseMaxes,
} from "@/services/maxes.service";

// ---------------------------------------------------------------------------
// Chainable Supabase mock
// ---------------------------------------------------------------------------

const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockGetUser = jest.fn();

// Each builder method returns `this`-style chained object that ends at a
// terminal mock (single, order, or the method itself when used as terminal).
const chain = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
};

// Wire every chainable method to return `chain` by default so callers can
// keep chaining; terminal overrides are set per-test.
beforeEach(() => {
  jest.clearAllMocks();

  mockSelect.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  mockDelete.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => chain,
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  },
}));

// toKg returns the value directly so weight assertions stay simple.
jest.mock("@/lib/units", () => ({
  toKg: (value: number) => value,
}));

// ---------------------------------------------------------------------------
// getCurrentMaxes
// ---------------------------------------------------------------------------

describe("getCurrentMaxes", () => {
  it("returns data when query succeeds", async () => {
    const rows = [
      {
        id: "m1",
        weight_kg: 100,
        exercises: { name: "Squat", category: "squat" },
      },
    ];
    mockOrder.mockResolvedValue({ data: rows, error: null });

    const result = await getCurrentMaxes();

    expect(result).toEqual(rows);
    expect(mockSelect).toHaveBeenCalledWith("*, exercises(name, category)");
    expect(mockOrder).toHaveBeenCalledWith("recorded_at", { ascending: false });
  });

  it("throws when Supabase returns an error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "db error" } });

    await expect(getCurrentMaxes()).rejects.toMatchObject({
      message: "db error",
    });
  });
});

// ---------------------------------------------------------------------------
// getMaxHistory
// ---------------------------------------------------------------------------

describe("getMaxHistory", () => {
  it("returns history ordered by recorded_at descending", async () => {
    const rows = [{ id: "m1", exercise_id: "ex-1", weight_kg: 90 }];
    mockOrder.mockResolvedValue({ data: rows, error: null });

    const result = await getMaxHistory("ex-1");

    expect(result).toEqual(rows);
    expect(mockEq).toHaveBeenCalledWith("exercise_id", "ex-1");
    expect(mockOrder).toHaveBeenCalledWith("recorded_at", { ascending: false });
  });

  it("throws on query error", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "not found" },
    });

    await expect(getMaxHistory("ex-missing")).rejects.toMatchObject({
      message: "not found",
    });
  });
});

// ---------------------------------------------------------------------------
// createMax
// ---------------------------------------------------------------------------

describe("createMax", () => {
  it("inserts a max with source 'manual' and returns the row", async () => {
    const user = { id: "user-1" };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    const row = {
      id: "m2",
      user_id: "user-1",
      exercise_id: "ex-1",
      weight_kg: 140,
      source: "manual",
    };
    mockSingle.mockResolvedValue({ data: row, error: null });

    const result = await createMax({
      exerciseId: "ex-1",
      weight: 140,
      unit: "kg",
    });

    expect(result).toEqual(row);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        exercise_id: "ex-1",
        weight_kg: 140,
        source: "manual",
      }),
    );
  });

  it("uses provided recordedAt instead of now()", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await createMax({
      exerciseId: "ex-1",
      weight: 100,
      unit: "kg",
      recordedAt: "2024-01-15T00:00:00Z",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ recorded_at: "2024-01-15T00:00:00Z" }),
    );
  });

  it("stores notes as null when not provided", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await createMax({ exerciseId: "ex-1", weight: 100, unit: "kg" });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });

  it("stores provided notes", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await createMax({
      exerciseId: "ex-1",
      weight: 100,
      unit: "kg",
      notes: "PR day",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "PR day" }),
    );
  });

  it("throws 'Not authenticated' when getUser returns an auth error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "session expired" },
    });

    await expect(
      createMax({ exerciseId: "ex-1", weight: 100, unit: "kg" }),
    ).rejects.toThrow("Not authenticated");
  });

  it("throws 'Not authenticated' when user is null (no session)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createMax({ exerciseId: "ex-1", weight: 100, unit: "kg" }),
    ).rejects.toThrow("Not authenticated");
  });

  it("throws when the insert itself fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    });

    await expect(
      createMax({ exerciseId: "ex-1", weight: 100, unit: "kg" }),
    ).rejects.toMatchObject({
      message: "insert failed",
    });
  });
});

// ---------------------------------------------------------------------------
// updateMax
// ---------------------------------------------------------------------------

describe("updateMax", () => {
  it("updates weight_kg when both weight and unit are provided", async () => {
    const updated = { id: "m3", weight_kg: 120 };
    mockSingle.mockResolvedValue({ data: updated, error: null });

    const result = await updateMax("m3", { weight: 120, unit: "kg" });

    expect(result).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ weight_kg: 120 }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "m3");
  });

  it("does not include weight_kg when weight is provided without unit", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateMax("m3", { weight: 120 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ weight_kg: expect.anything() }),
    );
  });

  it("updates only recordedAt when that is the only field", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateMax("m3", { recordedAt: "2024-06-01T00:00:00Z" });

    expect(mockUpdate).toHaveBeenCalledWith({
      recorded_at: "2024-06-01T00:00:00Z",
    });
  });

  it("updates only notes when that is the only field", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateMax("m3", { notes: "New PR" });

    expect(mockUpdate).toHaveBeenCalledWith({ notes: "New PR" });
  });

  it("updates multiple fields together", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateMax("m3", { weight: 150, unit: "kg", notes: "competition" });

    expect(mockUpdate).toHaveBeenCalledWith({
      weight_kg: 150,
      notes: "competition",
    });
  });

  it("throws on update error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "update failed" },
    });

    await expect(updateMax("m3", { notes: "x" })).rejects.toMatchObject({
      message: "update failed",
    });
  });

  it("sends an empty update object when no fields are provided", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateMax("m3", {});

    expect(mockUpdate).toHaveBeenCalledWith({});
  });
});

// ---------------------------------------------------------------------------
// deleteMax
// ---------------------------------------------------------------------------

describe("deleteMax", () => {
  it("resolves without error on successful delete", async () => {
    mockEq.mockResolvedValue({ error: null });

    await expect(deleteMax("m4")).resolves.toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith("id", "m4");
  });

  it("throws when delete returns an error", async () => {
    mockEq.mockResolvedValue({ error: { message: "delete failed" } });

    await expect(deleteMax("m4")).rejects.toMatchObject({
      message: "delete failed",
    });
  });
});

// ---------------------------------------------------------------------------
// getAthleteMaxes
// ---------------------------------------------------------------------------

describe("getAthleteMaxes", () => {
  it("returns maxes filtered by userId", async () => {
    const rows = [{ id: "m5", user_id: "athlete-1", weight_kg: 80 }];
    mockOrder.mockResolvedValue({ data: rows, error: null });

    const result = await getAthleteMaxes("athlete-1");

    expect(result).toEqual(rows);
    expect(mockSelect).toHaveBeenCalledWith("*, exercises(name, category)");
    expect(mockEq).toHaveBeenCalledWith("user_id", "athlete-1");
    expect(mockOrder).toHaveBeenCalledWith("recorded_at", { ascending: false });
  });

  it("throws on query error", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "forbidden" },
    });

    await expect(getAthleteMaxes("athlete-1")).rejects.toMatchObject({
      message: "forbidden",
    });
  });
});

// ---------------------------------------------------------------------------
// createAthleteMax
// ---------------------------------------------------------------------------

describe("createAthleteMax", () => {
  it("inserts with source 'coach' and the provided userId", async () => {
    const row = { id: "m6", user_id: "athlete-1", source: "coach" };
    mockSingle.mockResolvedValue({ data: row, error: null });

    const result = await createAthleteMax("athlete-1", {
      exerciseId: "ex-2",
      weight: 100,
      unit: "kg",
    });

    expect(result).toEqual(row);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "athlete-1", source: "coach" }),
    );
  });

  it("never sets source to 'manual' for coach-created maxes", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await createAthleteMax("athlete-1", {
      exerciseId: "ex-2",
      weight: 100,
      unit: "kg",
    });

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.source).toBe("coach");
    expect(insertArg.source).not.toBe("manual");
  });

  it("uses provided recordedAt", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await createAthleteMax("athlete-1", {
      exerciseId: "ex-2",
      weight: 100,
      unit: "kg",
      recordedAt: "2024-03-10T00:00:00Z",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ recorded_at: "2024-03-10T00:00:00Z" }),
    );
  });

  it("stores notes as null when not provided", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await createAthleteMax("athlete-1", {
      exerciseId: "ex-2",
      weight: 100,
      unit: "kg",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });

  it("throws when insert fails", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "rls violation" },
    });

    await expect(
      createAthleteMax("athlete-1", {
        exerciseId: "ex-2",
        weight: 100,
        unit: "kg",
      }),
    ).rejects.toMatchObject({ message: "rls violation" });
  });
});

// ---------------------------------------------------------------------------
// updateAthleteMax
// ---------------------------------------------------------------------------

describe("updateAthleteMax", () => {
  it("updates weight_kg when weight and unit are both present", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "m7", weight_kg: 200 },
      error: null,
    });

    const result = await updateAthleteMax("m7", { weight: 200, unit: "kg" });

    expect(result).toEqual({ id: "m7", weight_kg: 200 });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ weight_kg: 200 }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "m7");
  });

  it("updates only notes for a partial update", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateAthleteMax("m7", { notes: "coach note" });

    expect(mockUpdate).toHaveBeenCalledWith({ notes: "coach note" });
  });

  it("does not include weight_kg without a unit", async () => {
    mockSingle.mockResolvedValue({ data: {}, error: null });

    await updateAthleteMax("m7", { weight: 200 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ weight_kg: expect.anything() }),
    );
  });

  it("throws on update error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "coach update failed" },
    });

    await expect(updateAthleteMax("m7", { notes: "x" })).rejects.toMatchObject({
      message: "coach update failed",
    });
  });
});

// ---------------------------------------------------------------------------
// deleteExerciseMaxes
// ---------------------------------------------------------------------------

describe("deleteExerciseMaxes", () => {
  it("resolves without error on successful bulk delete", async () => {
    mockEq.mockResolvedValue({ error: null });

    await expect(deleteExerciseMaxes("ex-3")).resolves.toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith("exercise_id", "ex-3");
  });

  it("throws when delete returns an error", async () => {
    mockEq.mockResolvedValue({ error: { message: "bulk delete failed" } });

    await expect(deleteExerciseMaxes("ex-3")).rejects.toMatchObject({
      message: "bulk delete failed",
    });
  });
});
