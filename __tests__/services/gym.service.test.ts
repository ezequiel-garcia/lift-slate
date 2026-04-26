import {
  createGym,
  getMyGym,
  getGymById,
  removeMember,
  updateGym,
  deleteGym,
  getGymMembers,
  leaveGym,
  regenerateInviteToken,
} from "@/services/gym.service";

// ---------------------------------------------------------------------------
// Chainable mock builder
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown; error: unknown };

/**
 * Builds a proxy where every chained method returns the same chain object.
 * Awaiting the chain resolves with `result`.
 */
function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "order",
    "single",
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: (v: ChainResult) => void) => resolve(result);
  return chain;
}

/**
 * Builds a simple thenable for RPC calls that resolve immediately.
 */
function makeRpcResult(result: ChainResult) {
  return { then: (resolve: (v: ChainResult) => void) => resolve(result) };
}

const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

const USER_ID = "user-abc";
const authenticatedUser = { data: { user: { id: USER_ID } }, error: null };
const unauthenticatedError = {
  data: { user: null },
  error: { message: "jwt expired" },
};
const nullUser = { data: { user: null }, error: null };

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockGetUser.mockReset();
});

// ---------------------------------------------------------------------------
// createGym
// ---------------------------------------------------------------------------

describe("createGym", () => {
  it("inserts a gym without error", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await expect(
      createGym("Iron Lab", "Heavy lifting", "123 Main St"),
    ).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("gyms");
  });

  it("throws 'Not authenticated' when auth returns an error", async () => {
    mockGetUser.mockResolvedValue(unauthenticatedError);

    await expect(createGym("Iron Lab")).rejects.toThrow("Not authenticated");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws 'Not authenticated' when user is null", async () => {
    mockGetUser.mockResolvedValue(nullUser);

    await expect(createGym("Iron Lab")).rejects.toThrow("Not authenticated");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws the DB error when the insert fails", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    const dbError = { message: "unique_violation" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(createGym("Iron Lab")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getMyGym
// ---------------------------------------------------------------------------

describe("getMyGym", () => {
  const membershipRow = {
    id: "membership-1",
    role: "admin",
    gyms: {
      id: "gym-1",
      name: "Iron Lab",
      description: "Heavy lifting",
      address: "123 Main St",
      logo_url: null,
    },
  };

  it("returns gym with mapped role and membershipId when membership exists", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    mockFrom.mockReturnValue(makeChain({ data: membershipRow, error: null }));

    const result = await getMyGym();

    expect(result).toEqual({
      id: "gym-1",
      name: "Iron Lab",
      description: "Heavy lifting",
      address: "123 Main St",
      logo_url: null,
      myRole: "admin",
      membershipId: "membership-1",
    });
    expect(mockFrom).toHaveBeenCalledWith("gym_memberships");
  });

  it("returns null when no membership found (PGRST116)", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    mockFrom.mockReturnValue(
      makeChain({
        data: null,
        error: { code: "PGRST116", message: "no rows" },
      }),
    );

    await expect(getMyGym()).resolves.toBeNull();
  });

  it("returns null when membership row has no gyms property", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    mockFrom.mockReturnValue(
      makeChain({
        data: { id: "membership-1", role: "athlete", gyms: null },
        error: null,
      }),
    );

    await expect(getMyGym()).resolves.toBeNull();
  });

  it("throws for non-PGRST116 DB errors", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    const dbError = { code: "42501", message: "permission denied" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(getMyGym()).rejects.toEqual(dbError);
  });

  it("throws 'Not authenticated' when user is not logged in", async () => {
    mockGetUser.mockResolvedValue(nullUser);

    await expect(getMyGym()).rejects.toThrow("Not authenticated");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("maps the 'coach' role correctly", async () => {
    mockGetUser.mockResolvedValue(authenticatedUser);
    mockFrom.mockReturnValue(
      makeChain({
        data: { ...membershipRow, role: "coach" },
        error: null,
      }),
    );

    const result = await getMyGym();
    expect(result?.myRole).toBe("coach");
  });
});

// ---------------------------------------------------------------------------
// getGymById
// ---------------------------------------------------------------------------

describe("getGymById", () => {
  const gymRow = {
    id: "gym-1",
    name: "Iron Lab",
    description: null,
    address: null,
    logo_url: null,
    owner_id: USER_ID,
    invite_token: "token-uuid",
    temp_invite_code: null,
    temp_code_expires: null,
  };

  it("returns gym data for a valid ID", async () => {
    mockFrom.mockReturnValue(makeChain({ data: gymRow, error: null }));

    await expect(getGymById("gym-1")).resolves.toEqual(gymRow);
    expect(mockFrom).toHaveBeenCalledWith("gyms");
  });

  it("throws the DB error when the gym is not found", async () => {
    const dbError = { code: "PGRST116", message: "no rows found" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(getGymById("nonexistent")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// removeMember
// ---------------------------------------------------------------------------

describe("removeMember", () => {
  it("resolves without a value on success", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await expect(removeMember("membership-1")).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("gym_memberships");
  });

  it("throws the DB error on failure", async () => {
    const dbError = { message: "row not found" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(removeMember("bad-id")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// updateGym
// ---------------------------------------------------------------------------

describe("updateGym", () => {
  const updatedGym = {
    id: "gym-1",
    name: "New Name",
    description: null,
    address: null,
    logo_url: null,
  };

  it("returns the updated gym row", async () => {
    mockFrom.mockReturnValue(makeChain({ data: updatedGym, error: null }));

    await expect(updateGym("gym-1", { name: "New Name" })).resolves.toEqual(
      updatedGym,
    );
    expect(mockFrom).toHaveBeenCalledWith("gyms");
  });

  it("accepts partial updates (description only)", async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { ...updatedGym, description: "Updated desc" },
        error: null,
      }),
    );

    const result = await updateGym("gym-1", { description: "Updated desc" });
    expect(result).toBeDefined();
  });

  it("throws the DB error on failure", async () => {
    const dbError = { message: "gym not found" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(updateGym("bad-id", { name: "X" })).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deleteGym
// ---------------------------------------------------------------------------

describe("deleteGym", () => {
  it("resolves without a value on success", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await expect(deleteGym("gym-1")).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("gyms");
  });

  it("throws the DB error on failure", async () => {
    const dbError = { message: "foreign key violation" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(deleteGym("gym-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getGymMembers
// ---------------------------------------------------------------------------

describe("getGymMembers", () => {
  const members = [
    {
      id: "membership-1",
      gym_id: "gym-1",
      user_id: "user-1",
      role: "athlete",
      joined_at: "2024-01-01T00:00:00Z",
      users: {
        id: "user-1",
        display_name: "Alice",
        email: "alice@example.com",
        avatar_url: null,
        allow_coach_edit: true,
        unit_preference: "kg",
      },
    },
  ];

  it("returns an array of members with joined user data", async () => {
    mockFrom.mockReturnValue(makeChain({ data: members, error: null }));

    await expect(getGymMembers("gym-1")).resolves.toEqual(members);
    expect(mockFrom).toHaveBeenCalledWith("gym_memberships");
  });

  it("returns an empty array when there are no members", async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    await expect(getGymMembers("gym-1")).resolves.toEqual([]);
  });

  it("throws the DB error on failure", async () => {
    const dbError = { message: "permission denied" };
    mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));

    await expect(getGymMembers("gym-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// leaveGym
// ---------------------------------------------------------------------------

describe("leaveGym", () => {
  it("resolves without a value on success", async () => {
    mockRpc.mockReturnValue(makeRpcResult({ data: null, error: null }));

    await expect(leaveGym("membership-1")).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith("leave_gym", {
      p_membership_id: "membership-1",
    });
  });

  it("throws the raw DB error object on failure", async () => {
    const dbError = { message: "cannot leave as last admin" };
    mockRpc.mockReturnValue(makeRpcResult({ data: null, error: dbError }));

    await expect(leaveGym("membership-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// regenerateInviteToken
// ---------------------------------------------------------------------------

describe("regenerateInviteToken", () => {
  it("returns the new invite token string on success", async () => {
    mockRpc.mockReturnValue(
      makeRpcResult({ data: "new-invite-uuid-1234", error: null }),
    );

    await expect(regenerateInviteToken("gym-1")).resolves.toBe(
      "new-invite-uuid-1234",
    );
    expect(mockRpc).toHaveBeenCalledWith("regenerate_invite_token", {
      p_gym_id: "gym-1",
    });
  });

  it("throws the raw DB error object on failure", async () => {
    const dbError = { message: "only the owner can regenerate the token" };
    mockRpc.mockReturnValue(makeRpcResult({ data: null, error: dbError }));

    await expect(regenerateInviteToken("gym-1")).rejects.toEqual(dbError);
  });
});
