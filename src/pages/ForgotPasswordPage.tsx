import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Video } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import MagicSparkles from "../components/MagicSparkles";
import SparkleEffect from "../components/SparkleEffect";
import { useAuth } from "../context/AuthContext";

const ForgotPasswordPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user is already signed in, redirect to profile
  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be signed in to change your password. Please sign in first.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
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

      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: {
          email: user.email,
          newPassword: password,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (error) {
        setError(error.message || 'Failed to update password');
      } else if (data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/profile");
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

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Change Password | VideoRemix.vip</title>
          <meta
            name="description"
            content="Change your VideoRemix.vip password. You must be signed in to change your password."
          />
        </Helmet>

        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
          <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]"></div>
          </div>

          <SparkleEffect
            count={30}
            colors={["#ffffff", "#c7d2fe", "#a5b4fc", "#818cf8"]}
            minSize={2}
            maxSize={5}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <Link
                  to="/signin"
                  className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to sign in
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                  <Mail className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Sign In Required
                </h3>
                <p className="text-gray-300 mb-6">
                  You need to be signed in to change your password.
                </p>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start mb-6"
                  >
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <Link
                  to="/signin"
                  className="inline-block bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-3 px-6 rounded-lg font-semibold transition-all"
                >
                  Sign In to Continue
                </Link>
              </motion.div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Authenticated user flow
  return (
    <>
      <Helmet>
        <title>Change Password | VideoRemix.vip</title>
        <meta
          name="description"
          content="Change your VideoRemix.vip password. Enter your new password to update your account."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]"></div>
        </div>

        <SparkleEffect
          count={30}
          colors={["#ffffff", "#c7d2fe", "#a5b4fc", "#818cf8"]}
          minSize={2}
          maxSize={5}
        />

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
                Back to Profile
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-8"
            >
              <Link
                to="/"
                className="inline-flex items-center justify-center space-x-2 group mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 5,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
                  ></motion.div>
                  <Video className="h-10 w-10 text-white relative z-10" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-white leading-none block">
                    VideoRemix.vip
                  </span>
                  <div className="text-xs text-primary-300">
                    Marketing Personalization Platform
                  </div>
                </div>
              </Link>

              <MagicSparkles minSparkles={3} maxSparkles={6}>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Change Password
                </h1>
              </MagicSparkles>
              <p className="text-gray-300 text-lg">
                Update your password for {user.email}
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
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-primary-800 disabled:to-primary-700 disabled:opacity-50 text-white py-4 px-6 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg shadow-primary-600/20 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        Change Password
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
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Password Changed!
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Your password has been successfully updated.
                  </p>
                  <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-300">
                      ✅ Password change confirmed. Your account is now secure with the new password.
                    </p>
                  </div>
                </motion.div>
              )}

              {!success && (
                <div className="mt-8 text-center">
                  <p className="text-gray-400">
                    Already signed in?{" "}
                    <Link
                      to="/profile"
                      className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                    >
                      Go to Profile
                    </Link>
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-primary-400 mr-2" />
                Password Requirements
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Password must be at least 8 characters long</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Use a combination of letters, numbers, and symbols</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Choose a unique password not used elsewhere</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Never share your password with anyone</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ForgotPasswordPage;