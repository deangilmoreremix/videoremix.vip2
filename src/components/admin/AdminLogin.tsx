import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";

// Animation constants
const ANIMATION_DURATIONS = {
  FAST: 0.3,
  NORMAL: 0.6,
} as const;

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (
  password: string,
): { isValid: boolean; strength: number; feedback: string[] } => {
  const feedback: string[] = [];
  let strength = 0;

  if (password.length >= 8) {
    strength++;
  } else {
    feedback.push("At least 8 characters");
  }

  if (/[a-z]/.test(password)) {
    strength++;
  } else {
    feedback.push("One lowercase letter");
  }

  if (/[A-Z]/.test(password)) {
    strength++;
  } else {
    feedback.push("One uppercase letter");
  }

  if (/\d/.test(password)) {
    strength++;
  } else {
    feedback.push("One number");
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    strength++;
  } else {
    feedback.push("One special character");
  }

  return {
    isValid: strength >= 3, // Require at least 3 criteria
    strength,
    feedback,
  };
};

const AdminLogin: React.FC = () => {
  const { login, isLoading } = useAdmin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [announcements, setAnnouncements] = useState<string>("");



  // Focus management
  useEffect(() => {
    const emailInput = document.getElementById("email");
    emailInput?.focus();
  }, []);

  // Clear errors when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [formData]);

  // Screen reader announcements
  useEffect(() => {
    if (error) {
      setAnnouncements(`Login failed: ${error}`);
    } else if (success) {
      setAnnouncements("Login successful");
    } else {
      setAnnouncements("");
    }
  }, [error, success]);

  const validateField = useCallback((field: string, value: string) => {
    const errors: Record<string, string> = {};

    switch (field) {
      case "email":
        if (!value.trim()) {
          errors.email = "Email is required";
        } else if (!validateEmail(value)) {
          errors.email = "Please enter a valid email address";
        }
        break;
      case "password":
        if (!value.trim()) {
          errors.password = "Password is required";
        }
        // Don't validate password strength on login - only check if it exists
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] || "" }));
    return Object.keys(errors).length === 0;
  }, []);

  const handleInputChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Validate on change if field has been touched
      if (touched[field]) {
        validateField(field, value);
      }
    },
    [touched, validateField],
  );

  const handleBlur = useCallback(
    (field: string) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, formData[field as keyof typeof formData]);
    },
    [formData, validateField],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Check rate limiting
    if (lockoutUntil && new Date() < lockoutUntil) {
      const remainingTime = Math.ceil(
        (lockoutUntil.getTime() - Date.now()) / 1000 / 60,
      );
      setError(
        `Too many login attempts. Please try again in ${remainingTime} minutes.`,
      );
      return;
    }

    // Mark all fields as touched for validation
    setTouched({ email: true, password: true });

    // Validate all fields
    const isEmailValid = validateField("email", formData.email);
    const isPasswordValid = validateField("password", formData.password);

    if (!isEmailValid || !isPasswordValid) {
      setError("Please correct the errors below");
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setSuccess("Login successful! Redirecting...");
        setLoginAttempts(0); // Reset attempts on success
        setTimeout(() => navigate("/admin"), 1000);
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Implement progressive lockout
        if (newAttempts >= 5) {
          const lockoutMinutes = Math.min(newAttempts - 4, 30); // Max 30 minutes
          setLockoutUntil(new Date(Date.now() + lockoutMinutes * 60 * 1000));
          setError(
            `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`,
          );
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (err) {
      setError("Network error occurred. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | VideoRemix.io</title>
        <meta
          name="description"
          content="Admin login for VideoRemix.io dashboard."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ANIMATION_DURATIONS.NORMAL }}
          className="max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-500 mr-3" />
              <h1 className="text-3xl font-bold text-white">Admin Login</h1>
            </div>
            <p className="text-gray-400">
              Access the VideoRemix.io admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Status Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-500/20 border border-blue-500/50 text-blue-400 p-4 rounded-lg flex items-center"
                  role="alert"
                >
                  <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg flex items-center"
                  role="status"
                >
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address <span className="text-blue-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  onBlur={handleBlur("email")}
                  className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    fieldErrors.email ? "border-blue-500" : "border-gray-600"
                  }`}
                  placeholder="admin@videoremix.vip"
                  disabled={isLoading}
                  required
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p
                    id="email-error"
                    className="text-blue-400 text-sm mt-1 flex items-center"
                    role="alert"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    onBlur={handleBlur("password")}
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      fieldErrors.password
                        ? "border-blue-500"
                        : "border-gray-600"
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    required
                    aria-describedby={
                      fieldErrors.password
                        ? "password-error password-strength"
                        : "password-strength"
                    }
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-700 rounded"
                    disabled={isLoading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div id="password-strength" className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            validatePassword(formData.password).strength <= 1
                              ? "bg-blue-500"
                              : validatePassword(formData.password).strength <=
                                  2
                                ? "bg-orange-500"
                                : validatePassword(formData.password)
                                      .strength <= 3
                                  ? "bg-yellow-500"
                                  : validatePassword(formData.password)
                                        .strength <= 4
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                          }`}
                          style={{
                            width: `${(validatePassword(formData.password).strength / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          validatePassword(formData.password).strength <= 1
                            ? "text-blue-400"
                            : validatePassword(formData.password).strength <= 2
                              ? "text-orange-400"
                              : validatePassword(formData.password).strength <=
                                  3
                                ? "text-yellow-400"
                                : validatePassword(formData.password)
                                      .strength <= 4
                                  ? "text-blue-400"
                                  : "text-green-400"
                        }`}
                      >
                        {validatePassword(formData.password).strength <= 1
                          ? "Weak"
                          : validatePassword(formData.password).strength <= 2
                            ? "Fair"
                            : validatePassword(formData.password).strength <= 3
                              ? "Good"
                              : validatePassword(formData.password).strength <=
                                  4
                                ? "Strong"
                                : "Very Strong"}
                      </span>
                    </div>
                    {validatePassword(formData.password).feedback.length >
                      0 && (
                      <ul className="text-xs text-gray-400 mt-1 space-y-1">
                        {validatePassword(formData.password).feedback.map(
                          (requirement, index) => (
                            <li key={index} className="flex items-center">
                              <XCircle className="h-3 w-3 mr-1 text-blue-400" />
                              {requirement}
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                  </div>
                )}

                {fieldErrors.password && (
                  <p
                    id="password-error"
                    className="text-blue-400 text-sm mt-1 flex items-center"
                    role="alert"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !!lockoutUntil}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed"
                aria-describedby={lockoutUntil ? "lockout-info" : undefined}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : lockoutUntil ? (
                  "Account Temporarily Locked"
                ) : (
                  "Sign In"
                )}
              </button>

              {lockoutUntil && (
                <p
                  id="lockout-info"
                  className="text-yellow-400 text-sm text-center mt-2"
                >
                  Account locked due to too many failed attempts
                </p>
              )}
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400 mb-2">
                This area is restricted to authorized administrators only.
              </p>
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/admin/signup")}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>


          {/* Screen Reader Announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {announcements}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLogin;
