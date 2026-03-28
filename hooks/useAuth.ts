import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // getSession() returns the cached session immediately for fast initial render,
    // then getUser() validates it server-side to catch revoked tokens.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase.auth.getUser().then(({ error }) => {
          // Clear on 4xx (invalid/revoked token, bad session).
          // Keep on network errors (no status) or 5xx (Supabase down).
          if (error?.status && error.status >= 400 && error.status < 500)
            setSession(null);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}
