import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { isAuthenticated, authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState === "authenticated" || isAuthenticated) {
      const timer = setTimeout(() => navigate("/dashboard", { replace: true }), 400);
      return () => clearTimeout(timer);
    }

    if (authState === "unauthenticated") {
      const timer = setTimeout(
        () => navigate("/signin?verified=1", { replace: true }),
        600,
      );
      return () => clearTimeout(timer);
    }
  }, [authState, isAuthenticated, navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Finishing account setup…</h2>
      <p>This only takes a second.</p>
    </div>
  );
}
