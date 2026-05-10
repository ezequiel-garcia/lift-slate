import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // getSession() returns cached session immediately for fast initial render,
        // then getUser() validates it server-side to catch revoked tokens.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        if (session) {
          const { error } = await supabase.auth.getUser();
          if (!mounted) return;
          // Clear on 4xx (invalid/revoked token). Keep on network/5xx errors.
          if (error?.status && error.status >= 400 && error.status < 500)
            setSession(null);
        }
      } catch {
        // network/storage failure — don't hang on loading
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
