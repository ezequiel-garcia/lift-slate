import { getGymByToken, getGymByTempCode } from "@/services/invite.service";

const mockRpc = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

beforeEach(() => {
  mockRpc.mockReset();
});

// ---------------------------------------------------------------------------
// getGymByToken
// ---------------------------------------------------------------------------

describe("getGymByToken", () => {
  it("returns gym preview on valid token", async () => {
    const preview = {
      id: "gym-1",
      name: "PowerHouse",
      description: null,
      member_count: 5,
    };
    mockRpc.mockResolvedValue({ data: [preview], error: null });

    await expect(getGymByToken("valid-uuid")).resolves.toEqual(preview);
    expect(mockRpc).toHaveBeenCalledWith("preview_gym_by_token", {
      p_token: "valid-uuid",
    });
  });

  it("throws 'Invalid invite link' when token not found (empty result)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await expect(getGymByToken("unknown-uuid")).rejects.toThrow(
      "Invalid invite link",
    );
  });

  it("throws 'Invalid invite link' when RPC returns an error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "some db error" },
    });

    await expect(getGymByToken("bad-uuid")).rejects.toThrow(
      "Invalid invite link",
    );
  });

  it("throws 'Invalid invite link' when data is null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(getGymByToken("null-uuid")).rejects.toThrow(
      "Invalid invite link",
    );
  });
});

// ---------------------------------------------------------------------------
// getGymByTempCode
// ---------------------------------------------------------------------------

describe("getGymByTempCode", () => {
  it("returns gym preview on valid, non-expired code", async () => {
    const preview = {
      id: "gym-2",
      name: "Iron Lab",
      description: "Strong gym",
      member_count: 12,
    };
    mockRpc.mockResolvedValue({ data: [preview], error: null });

    await expect(getGymByTempCode("ABCD1234")).resolves.toEqual(preview);
    expect(mockRpc).toHaveBeenCalledWith("preview_gym_by_temp_code", {
      p_code: "ABCD1234",
    });
  });

  it("throws 'Invalid or expired code' when code not found (empty result)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await expect(getGymByTempCode("XXXXXXXX")).rejects.toThrow(
      "Invalid or expired code",
    );
  });

  it("throws 'Invalid or expired code' when code is expired (RPC returns empty — expiry checked in DB)", async () => {
    // The RPC filters out expired codes via WHERE temp_code_expires > now(),
    // so an expired code returns an empty array just like an invalid one.
    mockRpc.mockResolvedValue({ data: [], error: null });

    await expect(getGymByTempCode("EXPIR123")).rejects.toThrow(
      "Invalid or expired code",
    );
  });

  it("throws the DB error message when RPC returns an error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Too many attempts. Please wait before trying again." },
    });

    await expect(getGymByTempCode("ERRCODE1")).rejects.toThrow(
      "Too many attempts. Please wait before trying again.",
    );
  });

  it("throws 'Invalid or expired code' when data is null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(getGymByTempCode("NULLCODE")).rejects.toThrow(
      "Invalid or expired code",
    );
  });
});
