import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Video, Loader, ArrowLeft } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import MagicSparkles from "../components/MagicSparkles";
import SparkleEffect from "../components/SparkleEffect";

const ChangeEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    const accessToken = searchParams.get("access_token");

    if ((token || accessToken) && type === "email_change") {
      handleConfirmEmailChange(accessToken);
    }
  }, [searchParams]);

  const handleConfirmEmailChange = async (accessToken: string | null) => {
    setConfirming(true);
    try {
      if (accessToken) {
        const { error: sessionError } = await supabase.auth.refreshSession();
        if (sessionError) throw sessionError;
      }
      const { data: { user: confirmedUser } } = await supabase.auth.getUser();
      if (confirmedUser) {
        setConfirmStatus("success");
        setTimeout(() => navigate("/profile"), 3000);
      } else {
        throw new Error("Unable to confirm email change");
      }
    } catch (err: unknown) {
      setConfirmStatus("error");
      setError(err instanceof Error ? err.message : "Failed to confirm email change");
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!user) {
        setError("You must be signed in to change your email");
        return;
      }
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error: updateError } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${siteUrl}/auth/change-email` }
      );
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (confirming || confirmStatus !== "idle") {
    return (
      <>
        <Helmet><title>Confirm Email Change | VideoRemix.vip</title></Helmet>
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
          <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
          </div>
          <SparkleEffect count={20} colors={["#ffffff", "#bfdbfe", "#93c5fd", "#60a5fa"]} minSize={2} maxSize={5} />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl text-center"
              >
                {confirming && (
                  <div className="py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                      <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Confirming Email Change</h3>
                    <p className="text-gray-300">Please wait...</p>
                  </div>
                )}
                {confirmStatus === "success" && (
                  <div className="py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Email Changed Successfully!</h3>
                    <p className="text-gray-300 mb-6">Your email address has been updated. Redirecting to your profile...</p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-all"
                    >
                      Go to Profile
                    </Link>
                  </div>
                )}
                {confirmStatus === "error" && (
                  <div className="py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Confirmation Failed</h3>
                    <p className="text-gray-300 mb-6">{error || "Unable to confirm email change."}</p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-all"
                    >
                      Back to Profile
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Helmet><title>Change Email | VideoRemix.vip</title></Helmet>
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
                <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Sign In Required</h3>
                <p className="text-gray-300 mb-6">You must be signed in to change your email address.</p>
                <Link
                  to="/signin"
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-6 rounded-lg font-semibold transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Change Email Address | VideoRemix.vip</title>
        <meta name="description" content="Update your VideoRemix.vip email address." />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        </div>

        <SparkleEffect count={30} colors={["#ffffff", "#bfdbfe", "#93c5fd", "#60a5fa"]} minSize={2} maxSize={5} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Link
                to="/profile"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to profile
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-8"
            >
              <Link to="/" className="inline-flex items-center justify-center space-x-2 group mb-6">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
                  />
                  <Video className="h-10 w-10 text-white relative z-10" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-white leading-none block">VideoRemix.vip</span>
                  <div className="text-xs text-blue-300">Marketing Personalization Platform</div>
                </div>
              </Link>

              <MagicSparkles minSparkles={3} maxSparkles={6}>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Change Email Address</h1>
              </MagicSparkles>
              <p className="text-gray-300">
                Current email:{" "}
                <span className="font-medium text-white">{user.email}</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl"
            >
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start"
                    >
                      <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <div>
                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-300 mb-2">
                      New Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 pl-11 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="new@email.com"
                        autoComplete="email"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                    <p className="text-sm text-gray-400 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      Confirmation emails will be sent to both your current and new address. Your email won't change until you confirm from both.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending Confirmation...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Change Email
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Check Your Email</h3>
                  <p className="text-gray-300 mb-6">
                    We've sent a confirmation email to{" "}
                    <span className="font-medium text-white">{newEmail}</span>.
                    Click the link in that email to confirm your new address.
                  </p>
                  <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-gray-400 mb-2">Important:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Check both old and new email inboxes</li>
                      <li>• Confirm from both email addresses</li>
                      <li>• Your email won't change until confirmed</li>
                      <li>• Links expire after 24 hours</li>
                    </ul>
                  </div>
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Back to Profile
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ChangeEmailPage;
