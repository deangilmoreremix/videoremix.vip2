import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

export default function AuthCallback() {

  useEffect(() => {

    let redirected = false;

    const handle = async () => {

      // This allows Supabase to exchange the email token for a session
      await supabase.auth.getSession();

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {

          if (redirected) return;

          console.log("Auth Event:", event);

          // PASSWORD RESET EMAIL
          if (event === "PASSWORD_RECOVERY") {
            redirected = true;
            window.location.replace("/auth/reset-password");
            return;
          }

          // ANY OTHER SUCCESSFUL LOGIN (magic link, invite, confirm)
          if (event === "SIGNED_IN") {
            redirected = true;
            window.location.replace("/dashboard");
            return;
          }
        }
      );

      // Fallback — sometimes the session already exists
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && !redirected) {
          redirected = true;
          window.location.replace("/dashboard");
        }
      }, 1500);

      return () => {
        listener?.subscription?.unsubscribe();
      };
    };

    handle();

  }, []);

  return (
    <div style={{padding: 40, textAlign: "center"}}>
      <h2>Signing you in…</h2>
      <p>Please wait. This only takes a second.</p>
    </div>
  );
}