import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: {
          email: email,
          newPassword: password,
        },
      });

      if (error) {
        setError(error.message || 'Failed to update password');
        return;
      }

      if (data?.success) {
        setSuccess(true);
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
           <h2
             style={{
               fontSize: "28px",
               fontWeight: "700",
               color: "#ffffff",
               marginBottom: "8px",
             }}
           >
             Change Password
           </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              Enter your email and new password below
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
               Email Address
             </label>
             <input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
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
               placeholder="Enter your email address"
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
               Confirm Password
             </label>
             <input
               type="password"
               value={confirm}
               onChange={(e) => setConfirm(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          Your password must be at least 8 characters and match the
          confirmation. Make sure to use a strong, unique password.
        </p>
      </div>
    </div>
  );
}
