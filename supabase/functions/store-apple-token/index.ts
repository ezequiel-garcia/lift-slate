import { createClient } from "jsr:@supabase/supabase-js@2";

const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const BUNDLE_ID = "com.iekekel.LiftSlate";

function base64url(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function generateAppleClientSecret(): Promise<string> {
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKeyPem = Deno.env.get("APPLE_PRIVATE_KEY");

  if (!teamId || !keyId || !privateKeyPem) {
    throw new Error("Missing Apple credentials in environment");
  }

  const pem = privateKeyPem.replace(/\\n/g, "\n");
  const pemContent = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const keyDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyDer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const payload = base64url(
    JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + 15552000, // 180 days (Apple max)
      aud: "https://appleid.apple.com",
      sub: BUNDLE_ID,
    }),
  );

  const sigInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(sigInput),
  );

  return `${sigInput}.${base64urlBytes(new Uint8Array(signature))}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const authorizationCode = body.authorization_code;
  if (!authorizationCode) {
    return new Response(
      JSON.stringify({ error: "authorization_code required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const clientSecret = await generateAppleClientSecret();

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: BUNDLE_ID,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error("Apple token exchange failed:", tokenData);
      return new Response(JSON.stringify({ error: "Token exchange failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { error: upsertError } = await adminClient
      .from("apple_auth_tokens")
      .upsert({
        user_id: user.id,
        refresh_token: tokenData.refresh_token,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("Failed to store Apple token:", upsertError);
      return new Response(JSON.stringify({ error: "Storage failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("store-apple-token error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
