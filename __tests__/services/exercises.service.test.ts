import {
  getExercises,
  getExercisesByNames,
  createExercise,
  updateExercise,
  deleteExercise,
} from "@/services/exercises.service";

// ---------------------------------------------------------------------------
// Chainable mock builder
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown; error: unknown };

/**
 * Returns a jest.fn() whose return value is a proxy that lets every chained
 * method call (select, insert, update, delete, eq, in, order, single) pass
 * through until the caller awaits the chain.  The resolved value comes from
 * the `resolve` property on the builder.
 */
function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "order",
    "single",
  ];
  // Make every method return the same chain so calls can be arbitrarily deep.
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  // Awaiting the chain resolves with result.
  chain.then = (resolve: (v: ChainResult) => void) => resolve(result);
  return chain;
}

const mockFrom = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

beforeEach(() => {
  mockFrom.mockReset();
  mockGetUser.mockReset();
});

// ---------------------------------------------------------------------------
// getExercises
// ---------------------------------------------------------------------------

describe("getExercises", () => {
  it("returns exercises ordered by category then name", async () => {
    const rows = [
      { id: "1", name: "Bench Press", category: "press" },
      { id: "2", name: "Squat", category: "barbell" },
    ];
    mockFrom.mockReturnValue(makeChain({ data: rows, error: null }));

    await expect(getExercises()).resolves.toEqual(rows);
    expect(mockFrom).toHaveBeenCalledWith("exercises");
  });

  it("throws when Supabase returns an error", async () => {
    const dbError = { message: "connection refused" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(getExercises()).rejects.toEqual(dbError);
  });

  it("returns an empty array when no exercises exist", async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    await expect(getExercises()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getExercisesByNames
// ---------------------------------------------------------------------------

describe("getExercisesByNames", () => {
  it("returns matching id/name pairs for the given names", async () => {
    const rows = [{ id: "1", name: "Squat" }];
    mockFrom.mockReturnValue(makeChain({ data: rows, error: null }));

    await expect(getExercisesByNames(["Squat"])).resolves.toEqual(rows);
    expect(mockFrom).toHaveBeenCalledWith("exercises");
  });

  it("returns empty array when no names match", async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    await expect(getExercisesByNames(["Unknown"])).resolves.toEqual([]);
  });

  it("handles an empty names array without error", async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    await expect(getExercisesByNames([])).resolves.toEqual([]);
  });

  it("throws when Supabase returns an error", async () => {
    const dbError = { message: "query failed" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(getExercisesByNames(["Squat"])).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// createExercise
// ---------------------------------------------------------------------------

describe("createExercise", () => {
  const user = { id: "user-abc" };
  const newExercise = {
    id: "ex-1",
    name: "Romanian Deadlift",
    category: "barbell",
    created_by: user.id,
    is_default: false,
  };

  it("creates and returns the new exercise when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockFrom.mockReturnValue(makeChain({ data: newExercise, error: null }));

    await expect(
      createExercise("Romanian Deadlift", "barbell"),
    ).resolves.toEqual(newExercise);
    expect(mockFrom).toHaveBeenCalledWith("exercises");
  });

  it("creates exercise without an equipment_type (optional param)", async () => {
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockFrom.mockReturnValue(
      makeChain({
        data: { ...newExercise, equipment_type: undefined },
        error: null,
      }),
    );

    await expect(createExercise("Romanian Deadlift")).resolves.toBeDefined();
  });

  it("throws 'Not authenticated' when auth returns an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "jwt expired" },
    });

    await expect(createExercise("Squat")).rejects.toThrow("Not authenticated");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws 'Not authenticated' when user is null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(createExercise("Squat")).rejects.toThrow("Not authenticated");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws when the insert query returns a DB error", async () => {
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    const dbError = { message: "duplicate key" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(createExercise("Squat", "barbell")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// updateExercise
// ---------------------------------------------------------------------------

describe("updateExercise", () => {
  const updated = {
    id: "ex-1",
    name: "High Bar Squat",
    category: "barbell",
  };

  it("returns the updated exercise row", async () => {
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));

    await expect(
      updateExercise("ex-1", { name: "High Bar Squat" }),
    ).resolves.toEqual(updated);
    expect(mockFrom).toHaveBeenCalledWith("exercises");
  });

  it("accepts equipmentType-only updates", async () => {
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));

    await expect(
      updateExercise("ex-1", { equipmentType: "barbell" }),
    ).resolves.toEqual(updated);
  });

  it("accepts both name and equipmentType updates", async () => {
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));

    await expect(
      updateExercise("ex-1", {
        name: "High Bar Squat",
        equipmentType: "barbell",
      }),
    ).resolves.toEqual(updated);
  });

  it("throws when Supabase returns an error", async () => {
    const dbError = { message: "row not found" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(updateExercise("bad-id", { name: "X" })).rejects.toEqual(
      dbError,
    );
  });
});

// ---------------------------------------------------------------------------
// deleteExercise
// ---------------------------------------------------------------------------

describe("deleteExercise", () => {
  it("resolves without a value on success", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await expect(deleteExercise("ex-1")).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("exercises");
  });

  it("throws when Supabase returns an error", async () => {
    const dbError = { message: "foreign key violation" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(deleteExercise("ex-1")).rejects.toEqual(dbError);
  });
});
