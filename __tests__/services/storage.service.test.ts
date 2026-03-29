import { uploadGymLogo } from "@/services/storage.service";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
    },
  },
}));

jest.mock("base64-arraybuffer", () => ({
  decode: (b64: string) => b64 + "_decoded",
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_BASE64 = "abc123";
const VALID_FILE_NAME = "logo.jpg";
const PUBLIC_URL = "https://cdn.example.com/gym-logos/logo.jpg";

function mockSuccess() {
  mockUpload.mockResolvedValue({ error: null });
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: PUBLIC_URL } });
}

// ---------------------------------------------------------------------------
// MIME type validation
// ---------------------------------------------------------------------------

describe("uploadGymLogo — MIME type validation", () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockSuccess();
  });

  it.each(["image/jpeg", "image/png", "image/webp", "image/gif"])(
    "accepts valid MIME type: %s",
    async (mimeType) => {
      await expect(
        uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, mimeType),
      ).resolves.toBe(PUBLIC_URL);
    },
  );

  it.each([
    "application/pdf",
    "text/plain",
    "video/mp4",
    "image/svg+xml",
    "application/octet-stream",
    "",
  ])("rejects invalid MIME type: %s", async (mimeType) => {
    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, mimeType),
    ).rejects.toThrow("Only image files are allowed (JPEG, PNG, WebP, GIF).");
  });

  it("does not call supabase.storage.upload when MIME type is invalid", async () => {
    await uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "application/pdf").catch(
      () => {},
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// File size validation
// ---------------------------------------------------------------------------

describe("uploadGymLogo — file size validation", () => {
  const FIVE_MB = 5 * 1024 * 1024;

  beforeEach(() => {
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockSuccess();
  });

  it("rejects files over 5 MB", async () => {
    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg", FIVE_MB + 1),
    ).rejects.toThrow("Image must be smaller than 5 MB.");
  });

  it("rejects files exactly at 5 MB + 1 byte boundary", async () => {
    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg", FIVE_MB + 1),
    ).rejects.toThrow("Image must be smaller than 5 MB.");
  });

  it("accepts files exactly at 5 MB", async () => {
    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg", FIVE_MB),
    ).resolves.toBe(PUBLIC_URL);
  });

  it("accepts files under 5 MB", async () => {
    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg", 1024),
    ).resolves.toBe(PUBLIC_URL);
  });

  it("skips size check when fileSize is undefined", async () => {
    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg", undefined),
    ).resolves.toBe(PUBLIC_URL);
  });

  it("does not call supabase.storage.upload when file is too large", async () => {
    await uploadGymLogo(
      VALID_BASE64,
      VALID_FILE_NAME,
      "image/jpeg",
      FIVE_MB + 1,
    ).catch(() => {});
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// File name sanitization
// ---------------------------------------------------------------------------

describe("uploadGymLogo — fileName sanitization", () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockSuccess();
  });

  it("passes sanitized fileName (special chars replaced with _) to upload", async () => {
    await uploadGymLogo(VALID_BASE64, "my gym logo!@#.jpg", "image/jpeg");

    const [[uploadedPath]] = mockUpload.mock.calls;
    // The path is `${Date.now()}_${safeName}` — grab the part after the first underscore
    const safePart = (uploadedPath as string).replace(/^\d+_/, "");
    expect(safePart).toBe("my_gym_logo___.jpg");
  });

  it("preserves alphanumeric characters, dots, dashes, and underscores", async () => {
    await uploadGymLogo(VALID_BASE64, "logo_v2-final.png", "image/png");

    const [[uploadedPath]] = mockUpload.mock.calls;
    const safePart = (uploadedPath as string).replace(/^\d+_/, "");
    expect(safePart).toBe("logo_v2-final.png");
  });

  it("prefixes the path with a numeric timestamp", async () => {
    const before = Date.now();
    await uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg");
    const after = Date.now();

    const [[uploadedPath]] = mockUpload.mock.calls;
    const ts = parseInt((uploadedPath as string).split("_")[0], 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// Supabase integration — upload & public URL
// ---------------------------------------------------------------------------

describe("uploadGymLogo — supabase upload", () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
  });

  it("returns the public URL on success", async () => {
    mockSuccess();
    const url = await uploadGymLogo(
      VALID_BASE64,
      VALID_FILE_NAME,
      "image/png",
      1024,
    );
    expect(url).toBe(PUBLIC_URL);
  });

  it("calls upload with decoded base64, correct contentType, and upsert: false", async () => {
    mockSuccess();
    await uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/webp");

    const [[, decodedData, options]] = mockUpload.mock.calls;
    expect(decodedData).toBe(VALID_BASE64 + "_decoded");
    expect(options).toEqual({ contentType: "image/webp", upsert: false });
  });

  it("throws the supabase error when upload fails", async () => {
    const storageError = new Error("Bucket not found");
    mockUpload.mockResolvedValue({ error: storageError });

    await expect(
      uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg"),
    ).rejects.toThrow("Bucket not found");
  });

  it("does not call getPublicUrl when upload fails", async () => {
    mockUpload.mockResolvedValue({ error: new Error("upload failed") });

    await uploadGymLogo(VALID_BASE64, VALID_FILE_NAME, "image/jpeg").catch(
      () => {},
    );
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
  });
});
