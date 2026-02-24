import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

export default function MagicLinkPage() {

  useEffect(() => {

    let redirected = false;

    const handle = async () => {

      // This allows Supabase to exchange the email token for a session
      await supabase.auth.getSession();

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event: string, session: unknown) => {

          if (redirected) return;

          console.log("Auth Event:", event);

          // PASSWORD RESET EMAIL
          if (event === "PASSWORD_RECOVERY") {
            redirected = true;
            window.location.replace("/auth/reset-password");
            return;
          }

          // MAGIC LINK LOGIN - Redirect to dashboard
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
        listener?.subscription.unsubscribe();
      };
    };

    handle();

  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "400px"
      }}>
        <h2 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#111",
          marginBottom: "16px"
        }}>
          Signing you in...
        </h2>
        <p style={{
          fontSize: "15px",
          color: "#666",
          lineHeight: "1.6"
        }}>
          Please wait while we verify your magic link and sign you in.
        </p>
      </div>
    </div>
  );
}