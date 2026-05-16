import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in to change your password");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Get the access token from the current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setError("No active session found. Please sign in again.");
        return;
      }

      // Use the authenticated user's email (normalized by backend)
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: {
          email: user.email,
          newPassword: newPassword,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        setError(error.message || 'Failed to update password');
        return;
      }

      if (data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/profile", { replace: true });
        }, 3000);
      } else {
        setError(data?.error || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "400px",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "40px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: "12px",
            }}
          >
            Password Changed!
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: "1.6",
            }}
          >
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: "40px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-bold text-white mb-2"
          >
            Change Password
          </motion.h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Update your password for {user?.email}
          </p>
        </div>

        <form
          onSubmit={updatePassword}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                borderRadius: "8px",
                padding: "12px 16px",
                color: "#fca5a5",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "8px",
              }}
            >
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "8px",
              }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: loading
                ? "rgba(99, 102, 241, 0.5)"
                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
            lineHeight: "1.6",
          }}
        >
          Your password must be at least 8 characters. After changing your password, you will need to sign in again.
        </p>
      </div>
    </div>
  );
}
