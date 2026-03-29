import { getMemberRole, updateMemberRole } from "@/services/roles.service";

// ---------------------------------------------------------------------------
// Chainable mock builder
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown; error: unknown };

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "single"];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: (v: ChainResult) => void) => resolve(result);
  return chain;
}

const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
});

// ---------------------------------------------------------------------------
// getMemberRole
// ---------------------------------------------------------------------------

describe("getMemberRole", () => {
  it("returns the role when the membership row exists", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { role: "coach" }, error: null }),
    );

    await expect(getMemberRole("gym-1")).resolves.toBe("coach");
    expect(mockFrom).toHaveBeenCalledWith("gym_memberships");
  });

  it("returns null when no row is found (PGRST116)", async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: null,
        error: { code: "PGRST116", message: "no rows" },
      }),
    );

    await expect(getMemberRole("gym-missing")).resolves.toBeNull();
  });

  it("throws the error object for non-PGRST116 errors", async () => {
    const dbError = { code: "42501", message: "permission denied" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(getMemberRole("gym-1")).rejects.toEqual(dbError);
  });

  it("returns 'admin' role correctly", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { role: "admin" }, error: null }),
    );

    await expect(getMemberRole("gym-admin")).resolves.toBe("admin");
  });

  it("returns 'athlete' role correctly", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { role: "athlete" }, error: null }),
    );

    await expect(getMemberRole("gym-2")).resolves.toBe("athlete");
  });
});

// ---------------------------------------------------------------------------
// updateMemberRole
// ---------------------------------------------------------------------------

describe("updateMemberRole", () => {
  it("resolves without a value on success", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(
      updateMemberRole("membership-1", "coach"),
    ).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith("update_member_role", {
      p_membership_id: "membership-1",
      p_new_role: "coach",
    });
  });

  it("passes the correct RPC arguments for each role value", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await updateMemberRole("membership-2", "admin");

    expect(mockRpc).toHaveBeenCalledWith("update_member_role", {
      p_membership_id: "membership-2",
      p_new_role: "admin",
    });
  });

  it("throws an Error with the Supabase error message on failure", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "only admins can update roles" },
    });

    await expect(updateMemberRole("membership-1", "athlete")).rejects.toThrow(
      "only admins can update roles",
    );
  });

  it("wraps the error in an Error instance (not the raw object)", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "coach limit reached" },
    });

    await expect(
      updateMemberRole("membership-1", "coach"),
    ).rejects.toBeInstanceOf(Error);
  });
});
