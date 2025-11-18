import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Sparkles, Video, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MagicSparkles from '../components/MagicSparkles';
import SparkleEffect from '../components/SparkleEffect';

const SignUpPage: React.FC = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error, user } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      if (error) {
        setError(error.message);
      } else {
        if (user && user.identities && user.identities.length === 0) {
          setEmailConfirmRequired(true);
          setSuccess('Account created! Please check your email to confirm your address.');
        } else if (user && !user.email_confirmed_at) {
          setEmailConfirmRequired(true);
          setSuccess('Account created! Please check your email to confirm your address.');
        } else {
          setSuccess('Account created successfully! Redirecting to your dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <Helmet>
        <title>Sign Up | VideoRemix.vip</title>
        <meta
          name="description"
          content="Create your VideoRemix.vip account and start building personalized marketing campaigns that drive results."
        />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center py-20">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]"></div>
        </div>

        <SparkleEffect
          count={30}
          colors={['#ffffff', '#c7d2fe', '#a5b4fc', '#818cf8']}
          minSize={2}
          maxSize={5}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-md mx-auto">
            {/* Back to home link */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Link
                to="/"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to home
              </Link>
            </motion.div>

            {/* Logo section */}
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
                    className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
                  ></motion.div>
                  <Video className="h-10 w-10 text-white relative z-10" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-white leading-none block">VideoRemix.vip</span>
                  <div className="text-xs text-primary-300">Marketing Personalization Platform</div>
                </div>
              </Link>

              <MagicSparkles minSparkles={3} maxSparkles={6}>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Start Your Journey
                </h1>
              </MagicSparkles>
              <p className="text-gray-300 text-lg">
                Join thousands using personalized marketing to scale their business
              </p>
            </motion.div>

            {/* Sign-up form card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg"
                  >
                    <div className="flex items-start mb-3">
                      <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                    {emailConfirmRequired && (
                      <div className="ml-8 text-sm text-green-300 space-y-1">
                        <p>We've sent a confirmation link to <span className="font-semibold">{formData.email}</span></p>
                        <p className="text-xs text-green-400">Check your spam folder if you don't see it within a few minutes.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Create a password (min. 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-400 pt-2">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                    Privacy Policy
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-primary-800 disabled:to-primary-700 disabled:opacity-50 text-white py-4 px-6 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg shadow-primary-600/20 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Sparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/signin"
                    className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>

            {/* Benefits section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Sparkles className="h-5 w-5 text-primary-400 mr-2" />
                Start your free account today
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>No credit card required to start</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Access to 37+ marketing tools immediately</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Create personalized campaigns in minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span>Join thousands of successful marketers</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignUpPage;
