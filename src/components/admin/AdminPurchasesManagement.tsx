import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Download,
  Upload,
  Filter,
  ChevronDown,
  AlertTriangle,
  X,
  CheckCircle,
  Eye,
  RefreshCw,
  DollarSign,
  Cloud,
  Loader,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface Purchase {
  id: string;
  user_id: string | null;
  email: string;
  platform: string;
  platform_transaction_id: string;
  product_name: string;
  product_sku: string | null;
  amount: number;
  currency: string;
  status: string;
  is_subscription: boolean;
  purchase_date: string;
  processed: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
}

const AdminPurchasesManagement: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<{
    show: boolean;
    purchase: Purchase | null;
  }>({ show: false, purchase: null });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const filteredPurchases = useMemo(() => {
    let filtered = allPurchases;

    if (selectedPlatform !== "all") {
      filtered = filtered.filter((p) => p.platform === selectedPlatform);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    return filtered;
  }, [allPurchases, selectedPlatform, selectedStatus]);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, []);

  useEffect(() => {
    setPurchases(filteredPurchases);
  }, [filteredPurchases]);

  const fetchPurchases = async () => {
    try {
      clearMessages();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication required. Please log in again.");
        return;
      }
      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-purchases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAllPurchases(data.data || []);
      } else {
        setError(data.error || "Failed to load purchases");
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setError(
        "Failed to load purchases. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setError("Please enter purchase data");
      return;
    }

    setImporting(true);
    clearMessages();

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication required. Please log in again.");
        return;
      }
      const token = session.access_token;

      const lines = importData.trim().split("\n");
      const purchasesToImport = lines
        .map((line) => {
          const [email, productName, amount, platform, transactionId] = line
            .split(",")
            .map((s) => s.trim());
          return {
            email,
            productName,
            amount: parseFloat(amount) || 0,
            platform: platform || "manual",
            transactionId:
              transactionId || `manual-${Date.now()}-${Math.random()}`,
          };
        })
        .filter((p) => p.email && p.productName);

      if (purchasesToImport.length === 0) {
        setError(
          "No valid purchases found. Format: email,product_name,amount,platform,transaction_id",
        );
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-purchases/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ purchases: purchasesToImport }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully imported ${data.count} purchases`);
        setImportData("");
        setShowImportModal(false);
        await fetchPurchases();
      } else {
        setError(data.error || "Failed to import purchases");
      }
    } catch (error) {
      console.error("Error importing purchases:", error);
      setError("Failed to import purchases. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "email,product_name,amount,platform,transaction_id\nuser@example.com,AI Video Creator,99.00,stripe,txn_123456\nuser2@example.com,Landing Page Creator,49.00,paykickstart,pk_789012";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "purchases_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPurchases = () => {
    const csvContent = [
      "Email,Product Name,Amount,Currency,Platform,Status,Purchase Date",
      ...filteredPurchases.map((p) =>
        [
          p.email,
          p.product_name,
          p.amount,
          p.currency,
          p.platform,
          p.status,
          new Date(p.purchase_date).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchases_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "stripe":
        return "bg-blue-500/20 text-blue-400";
      case "paykickstart":
        return "bg-green-500/20 text-green-400";
      case "zaxxa":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "refunded":
        return "bg-red-500/20 text-red-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const startStripeSync = async () => {
    setSyncing(true);
    clearMessages();

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication required. Please log in again.");
        return;
      }
      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-sync?action=start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Stripe sync started! This may take several minutes...");
        setSyncStatus({ job_id: data.job_id, status: "running" });
        pollSyncStatus(data.job_id);
      } else {
        setError(data.error || "Failed to start Stripe sync");
      }
    } catch (error) {
      console.error("Error starting Stripe sync:", error);
      setError("Failed to start Stripe sync. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const pollSyncStatus = async (jobId: string) => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-sync?action=status&job_id=${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          clearInterval(interval);
          return;
        }

        const data = await response.json();
        if (data.success && data.job) {
          setSyncStatus(data.job);

          if (data.job.status === "completed") {
            clearInterval(interval);
            setSuccess(
              `Stripe sync completed! Imported ${data.job.successful_records} customers with ${data.job.failed_records} failures.`,
            );
            await fetchPurchases();
          } else if (data.job.status === "failed") {
            clearInterval(interval);
            setError("Stripe sync failed. Check the logs for details.");
          }
        }
      } catch (error) {
        console.error("Error polling sync status:", error);
        clearInterval(interval);
      }
    }, 3000);

    setTimeout(() => clearInterval(interval), 600000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = {
    total: allPurchases.length,
    revenue: allPurchases
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0),
    stripe: allPurchases.filter((p) => p.platform === "stripe").length,
    paykickstart: allPurchases.filter((p) => p.platform === "paykickstart")
      .length,
    zaxxa: allPurchases.filter((p) => p.platform === "zaxxa").length,
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Purchases</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">
                ${stats.revenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <p className="text-xs text-gray-400">Stripe</p>
              <p className="text-lg font-bold text-blue-400">{stats.stripe}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">PayKickstart</p>
              <p className="text-lg font-bold text-green-400">
                {stats.paykickstart}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Zaxxa</p>
              <p className="text-2xl font-bold text-purple-400">
                {stats.zaxxa}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Purchases Management
          </h2>
          <p className="text-gray-400">
            View and manage all purchases across platforms
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Platform Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors border border-gray-600"
            >
              <span className="mr-2">
                {selectedPlatform === "all"
                  ? "All Platforms"
                  : selectedPlatform}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showPlatformDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {["all", "stripe", "paykickstart", "zaxxa"].map(
                    (platform) => (
                      <button
                        key={platform}
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setShowPlatformDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                      >
                        {platform === "all"
                          ? "All Platforms"
                          : platform.charAt(0).toUpperCase() +
                            platform.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors border border-gray-600"
            >
              <span className="mr-2">
                {selectedStatus === "all" ? "All Status" : selectedStatus}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {["all", "completed", "pending", "refunded", "failed"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                      >
                        {status === "all"
                          ? "All Status"
                          : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportPurchases}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          <button
            onClick={downloadTemplate}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>

          <button
            onClick={startStripeSync}
            disabled={syncing}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            {syncing ? "Syncing..." : "Sync Stripe"}
          </button>

          <button
            onClick={fetchPurchases}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && syncStatus.status === "running" && (
        <div className="bg-purple-500/20 border border-purple-500/50 text-purple-400 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            <div>
              <p className="font-semibold">Stripe Sync in Progress</p>
              <p className="text-sm">
                Processed: {syncStatus.processed_records || 0} /{" "}
                {syncStatus.total_records || "?"} customers (Success:{" "}
                {syncStatus.successful_records || 0}, Failed:{" "}
                {syncStatus.failed_records || 0})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Purchases List */}
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <motion.div
            key={purchase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <ShoppingCart className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {purchase.product_name}
                    </h3>
                    <p className="text-sm text-gray-400">{purchase.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformBadgeColor(purchase.platform)}`}
                  >
                    {purchase.platform.charAt(0).toUpperCase() +
                      purchase.platform.slice(1)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(purchase.status)}`}
                  >
                    {purchase.status.charAt(0).toUpperCase() +
                      purchase.status.slice(1)}
                  </span>
                  {purchase.is_subscription && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                      Subscription
                    </span>
                  )}
                  <span className="text-lg font-bold text-green-400">
                    {purchase.currency} {purchase.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </span>
                  {purchase.product_sku && (
                    <span className="text-xs text-gray-500">
                      SKU: {purchase.product_sku}
                    </span>
                  )}
                  {purchase.processed && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal({ show: true, purchase })}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {purchases.length === 0 && (
        <div className="text-center py-20">
          <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No purchases found
          </h3>
          <p className="text-gray-400">
            {selectedPlatform !== "all" || selectedStatus !== "all"
              ? "Try adjusting your filters"
              : "Purchases will appear here when customers make purchases"}
          </p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Import Purchases
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Enter purchase data in CSV format:
              email,product_name,amount,platform,transaction_id (one per line)
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-40 resize-none"
              placeholder={`user@example.com,AI Video Creator,99.00,stripe,txn_123456
user2@example.com,Landing Page Creator,49.00,paykickstart,pk_789012`}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import Purchases"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal.show && showDetailModal.purchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Purchase Details</h3>
              <button
                onClick={() =>
                  setShowDetailModal({ show: false, purchase: null })
                }
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Product</p>
                <p className="text-white font-semibold">
                  {showDetailModal.purchase.product_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Customer Email</p>
                <p className="text-white">{showDetailModal.purchase.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-white font-semibold">
                    {showDetailModal.purchase.currency}{" "}
                    {showDetailModal.purchase.amount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Platform</p>
                  <p className="text-white">
                    {showDetailModal.purchase.platform}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-white">
                    {showDetailModal.purchase.status}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Type</p>
                  <p className="text-white">
                    {showDetailModal.purchase.is_subscription
                      ? "Subscription"
                      : "One-time"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400">Transaction ID</p>
                <p className="text-white font-mono text-sm">
                  {showDetailModal.purchase.platform_transaction_id}
                </p>
              </div>

              {showDetailModal.purchase.product_sku && (
                <div>
                  <p className="text-sm text-gray-400">Product SKU</p>
                  <p className="text-white">
                    {showDetailModal.purchase.product_sku}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400">Purchase Date</p>
                <p className="text-white">
                  {new Date(
                    showDetailModal.purchase.purchase_date,
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Processed</p>
                <p className="text-white">
                  {showDetailModal.purchase.processed ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPurchasesManagement;
