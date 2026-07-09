import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MagicLinkPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // This page was for Supabase magic link auth, which is no longer used.
    // Clerk handles all authentication now. Redirect to sign-in.
    navigate("/signin", { replace: true });
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#111",
            marginBottom: "16px",
          }}
        >
          Redirecting...
        </h2>
        <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.6" }}>
          Please use the sign-in page to access your account.
        </p>
      </div>
    </div>
  );
}
