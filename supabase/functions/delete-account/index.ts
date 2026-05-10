import { createClient } from "jsr:@supabase/supabase-js@2";

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

  // Use anon client to verify the JWT and get the user
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

  // Use admin client for privileged operations
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Block deletion if user owns a gym (gyms.owner_id ON DELETE RESTRICT would fail anyway)
  const { data: ownedGyms } = await adminClient
    .from("gyms")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1);

  if (ownedGyms && ownedGyms.length > 0) {
    return new Response(
      JSON.stringify({
        error:
          "You must delete or transfer your gym before deleting your account.",
        code: "GYM_OWNER",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
