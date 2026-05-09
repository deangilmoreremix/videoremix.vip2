import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Video, Loader } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import MagicSparkles from "../components/MagicSparkles";
import SparkleEffect from "../components/SparkleEffect";

const EmailConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      if (!token && !accessToken) {
        setStatus("error");
        setError("Missing verification token. Please check your email link.");
        return;
      }

      if (type !== "signup" && type !== "email" && !accessToken) {
        setStatus("error");
        setError(
          "Invalid verification type. Please request a new confirmation email.",
        );
        return;
      }

      try {
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && user.email_confirmed_at) {
          setStatus("success");
        } else if (user) {
          setStatus("success");
        } else {
          throw new Error("Unable to verify email. Please try again.");
        }
      } catch (err: any) {
        setStatus("error");
        setError(
          err.message ||
            "An unexpected error occurred during email verification.",
        );
      }
    };

    confirmEmail();
  }, [searchParams]);

  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (status === "success" && countdown === 0) {
      navigate("/dashboard");
    }
  }, [status, countdown, navigate]);

  return (
    <>
      <Helmet>
        <title>Email Confirmation | VideoRemix.vip</title>
        <meta
          name="description"
          content="Confirm your email address to activate your VideoRemix.vip account."
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
                  {status === "loading" && "Confirming Your Email"}
                  {status === "success" && "Email Confirmed!"}
                  {status === "error" && "Verification Failed"}
                </h1>
              </MagicSparkles>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl text-center"
            >
              {status === "loading" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
                    <Loader className="h-8 w-8 text-primary-400 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Verifying Your Email
                  </h3>
                  <p className="text-gray-300">
                    Please wait while we confirm your email address...
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Email Confirmed Successfully!
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Your account is now active. Redirecting to your dashboard in{" "}
                    {countdown} second{countdown !== 1 ? "s" : ""}...
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-3 px-6 rounded-lg font-medium transition-all"
                  >
                    Go to Dashboard Now
                  </Link>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Verification Failed
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {error ||
                      "Unable to verify your email address. The link may have expired or is invalid."}
                  </p>
                  <div className="space-y-3">
                    <Link
                      to="/signin"
                      className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-3 px-6 rounded-lg font-medium transition-all"
                    >
                      Go to Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                    >
                      Create New Account
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  What's Next?
                </h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">✓</span>
                    <span>Access 37+ marketing personalization tools</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">✓</span>
                    <span>Create your first personalized campaign</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">✓</span>
                    <span>Explore AI-powered marketing features</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">✓</span>
                    <span>Connect with your audience at scale</span>
                  </li>
                </ul>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                  Need Help?
                </h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Email verification links expire after 24 hours</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>
                      Try signing in if you've already verified your email
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Create a new account if the link has expired</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Contact support if you continue to have issues</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default EmailConfirmPage;
