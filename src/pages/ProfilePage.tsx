import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  purchaseService,
  PurchaseWithProduct,
} from "../services/purchaseService";

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.user_metadata?.first_name || "",
    last_name: user?.user_metadata?.last_name || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseWithProduct[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error } = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.user_metadata?.first_name || "",
      last_name: user?.user_metadata?.last_name || "",
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user?.id) {
        setPurchasesLoading(false);
        return;
      }

      try {
        setPurchasesLoading(true);
        setPurchasesError(null);
        const data = await purchaseService.getUserPurchasesWithProducts(
          user.id,
        );
        setPurchases(data);
      } catch (err) {
        console.error("Error fetching purchases:", err);
        setPurchasesError("Failed to load purchase history");
      } finally {
        setPurchasesLoading(false);
      }
    };

    fetchPurchases();
  }, [user?.id]);

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "stripe":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "paypal":
        return "bg-blue-600/20 text-blue-300 border-blue-600/30";
      case "paykickstart":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "zaxxa":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "refunded":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getProductTypeBadgeColor = (productType?: string) => {
    if (!productType) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    return productType === "subscription"
      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
      : "bg-teal-500/20 text-teal-400 border-teal-500/30";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Please sign in to view your profile.</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile | VideoRemix.vip</title>
        <meta
          name="description"
          content="Manage your VideoRemix.vip profile settings."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-900 py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-blue-500 mr-3" />
                <h1 className="text-3xl font-bold text-white">
                  Profile Settings
                </h1>
              </div>
              <p className="text-gray-400">
                Manage your account information and preferences
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              {/* Status Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center mb-6"
                >
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg flex items-center mb-6"
                >
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* Profile Information */}
              <div className="space-y-6">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-white">{user.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* First Name */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange("first_name")}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-white">
                        {user.user_metadata?.first_name || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange("last_name")}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-white">
                        {user.user_metadata?.last_name || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Account Created:</span>
                      <div className="text-white">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "Unknown"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Sign In:</span>
                      <div className="text-white">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : "Never"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-8">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Purchase History Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
                <div className="flex items-center mb-6">
                  <ShoppingBag className="h-6 w-6 text-blue-500 mr-3" />
                  <h3 className="text-2xl font-bold text-white">
                    Purchase History
                  </h3>
                </div>

                {purchasesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                    <span className="ml-3 text-gray-400">
                      Loading purchases...
                    </span>
                  </div>
                ) : purchasesError ? (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{purchasesError}</span>
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">
                      No purchases yet
                    </h4>
                    <p className="text-gray-400">
                      Your purchase history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <motion.div
                        key={purchase.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-700/50 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <Package className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-white mb-1">
                                  {purchase.product?.name ||
                                    purchase.product_name}
                                </h4>
                                {purchase.product?.description && (
                                  <p className="text-sm text-gray-400 mb-2">
                                    {purchase.product.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getPlatformBadgeColor(purchase.platform)}`}
                                  >
                                    {purchase.platform.charAt(0).toUpperCase() +
                                      purchase.platform.slice(1)}
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(purchase.status)}`}
                                  >
                                    {purchase.status.charAt(0).toUpperCase() +
                                      purchase.status.slice(1)}
                                  </span>
                                  {purchase.product?.product_type && (
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getProductTypeBadgeColor(purchase.product.product_type)}`}
                                    >
                                      {purchase.product.product_type ===
                                      "subscription"
                                        ? "Subscription"
                                        : "One-time"}
                                    </span>
                                  )}
                                  {purchase.is_subscription &&
                                    !purchase.product?.product_type && (
                                      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        Subscription
                                      </span>
                                    )}
                                </div>
                                {purchase.product?.apps_granted &&
                                  purchase.product.apps_granted.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-400 mb-1">
                                        Apps Granted:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {purchase.product.apps_granted.map(
                                          (app, index) => (
                                            <span
                                              key={index}
                                              className="px-2 py-1 bg-blue-500/10 text-blue-300 rounded text-xs border border-blue-500/20"
                                            >
                                              {app}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 min-w-[140px]">
                            <div className="flex items-center gap-2 text-green-400">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-xl font-bold">
                                {purchase.currency} {purchase.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(
                                  purchase.purchase_date,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-mono">
                                {purchase.platform_transaction_id.substring(
                                  0,
                                  16,
                                )}
                                ...
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {purchases.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Purchases:</span>
                      <span className="text-white font-semibold">
                        {purchases.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-400">Total Spent:</span>
                      <span className="text-green-400 font-semibold">
                        $
                        {purchases
                          .filter((p) => p.status === "completed")
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
