-- Stores Apple refresh tokens for Sign in with Apple revocation on account deletion.
-- Only accessible via service role (edge functions). No user-facing RLS policies.
CREATE TABLE public.apple_auth_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.apple_auth_tokens ENABLE ROW LEVEL SECURITY;
-- No policies — only edge functions with service role key can read/write this table.
REVOKE ALL ON public.apple_auth_tokens FROM authenticated, anon;
