import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle,
  X,
  CheckCircle,
  ExternalLink,
  Copy,
  Globe,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import { appConfig } from "../../config/appConfig";

interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon_url: string;
  netlify_url: string | null;
  custom_domain: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminAppsManagement: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [showAppDropdown, setShowAppDropdown] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = appConfig.UI.ITEMS_PER_PAGE; // Show apps per page (4x3 grid)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Enhanced state for UX
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error";
      message: string;
    }>
  >([]);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    app: App | null;
  }>({ show: false, app: null });
  const [operationLoading, setOperationLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Utility functions
  const addNotification = useCallback(
    (type: "success" | "error", message: string) => {
      const id = Date.now().toString();
      setNotifications((prev) => [...prev, { id, type, message }]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Memoized filtering for better performance
  const filteredApps = useMemo(() => {
    return selectedApp === "all"
      ? allApps
      : allApps.filter((app) => app.slug === selectedApp);
  }, [allApps, selectedApp]);

  useEffect(() => {
    fetchApps();
  }, []);

  // Update apps when filtered results change
  useEffect(() => {
    setApps(filteredApps);
  }, [filteredApps]);

  const fetchApps = useCallback(
    async (page = currentPage) => {
      try {
        clearMessages();

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          const devToken = localStorage.getItem("admin_token");
          if (devToken === "dev_bypass_token") {
            setError(
              "Dev mode: Using real admin login instead of bypass for API calls",
            );
          } else {
            setError("Authentication required. Please log in again.");
          }
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-apps?page=${page}&limit=${itemsPerPage}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setAllApps(data.data || []);
          setPagination(data.pagination || null);
        } else {
          setError(data.error || "Failed to load applications");
        }
      } catch (error) {
        console.error("Error fetching apps:", error);
        setError(
          "Failed to load applications. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, currentPage, itemsPerPage],
  );

  const toggleApp = useCallback(
    async (appId: string, currentStatus: boolean) => {
      setToggling(appId);
      clearMessages();
      setOperationLoading((prev) => ({ ...prev, [appId]: true }));

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError("Authentication required. Please log in again.");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-apps/${appId}/toggle`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setAllApps((prevApps) =>
            prevApps.map((app) =>
              app.id === appId ? { ...app, is_active: !currentStatus } : app,
            ),
          );
          addNotification(
            "success",
            `App ${currentStatus ? "deactivated" : "activated"} successfully`,
          );
        } else {
          setError(data.error || "Failed to toggle app status");
        }
      } catch (error) {
        console.error("Error toggling app:", error);
        setError("Failed to toggle app status. Please try again.");
      } finally {
        setToggling(null);
        setOperationLoading((prev) => ({ ...prev, [appId]: false }));
      }
    },
    [clearMessages, addNotification],
  );

  const togglePublicVisibility = useCallback(
    async (appId: string, currentStatus: boolean) => {
      setOperationLoading((prev) => ({ ...prev, [appId]: true }));

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError("Authentication required. Please log in again.");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-apps/${appId}/toggle-public`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setAllApps((prevApps) =>
            prevApps.map((app) =>
              app.id === appId ? { ...app, is_public: !currentStatus } : app,
            ),
          );
          addNotification(
            "success",
            `App ${currentStatus ? "made private" : "made public"} successfully`,
          );
        } else {
          setError(data.error || "Failed to toggle public visibility");
        }
      } catch (error) {
        console.error("Error toggling public visibility:", error);
        setError("Failed to toggle public visibility. Please try again.");
      } finally {
        setOperationLoading((prev) => ({ ...prev, [appId]: false }));
      }
    },
    [addNotification],
  );

  const deleteApp = useCallback(
    async (appId: string) => {
      clearMessages();
      setOperationLoading((prev) => ({ ...prev, [appId]: true }));

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError("Authentication required. Please log in again.");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-apps/${appId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setAllApps((prevApps) => prevApps.filter((app) => app.id !== appId));
          addNotification("success", "App deleted successfully");
          setShowDeleteModal({ show: false, app: null });
        } else {
          setError(data.error || "Failed to delete app");
        }
      } catch (error) {
        console.error("Error deleting app:", error);
        setError("Failed to delete app. Please try again.");
      } finally {
        setOperationLoading((prev) => ({ ...prev, [appId]: false }));
      }
    },
    [clearMessages, addNotification],
  );

  const openDeleteModal = useCallback((app: App) => {
    setShowDeleteModal({ show: true, app });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-lg flex items-center justify-between ${
            notification.type === "success"
              ? "bg-green-500/20 border border-green-500/50 text-green-400"
              : "bg-red-500/20 border border-red-500/50 text-red-400"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <X className="h-5 w-5 mr-2" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() =>
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id),
              )
            }
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ))}

      {/* Error Message */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Applications Management
          </h2>
          <p className="text-gray-400">
            Manage and configure your deployed applications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* App Selector */}
          <div className="relative">
            <button
              onClick={() => setShowAppDropdown(!showAppDropdown)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors border border-gray-600"
            >
              <span className="mr-2">
                {selectedApp === "all"
                  ? "All Apps"
                  : allApps.find((app) => app.slug === selectedApp)?.name ||
                    "Select App"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showAppDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setSelectedApp("all");
                      setShowAppDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                  >
                    All Apps
                  </button>
                  {allApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app.slug);
                        setShowAppDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>{app.name}</span>
                        {app.is_active ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add App
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {/* App Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-8 h-8 rounded"
                    />
                  ) : (
                    <Settings className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {app.name}
                  </h3>
                  <p className="text-sm text-gray-400">{app.category}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.is_active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {app.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {app.description || "No description available"}
            </p>

            {/* Deployment URLs */}
            <div className="mb-4 space-y-2">
              {app.netlify_url && (
                <div className="flex items-center text-xs bg-gray-700/50 rounded px-2 py-1.5">
                  <Globe className="h-3 w-3 text-blue-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-300 truncate flex-1">
                    {app.netlify_url}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(app.netlify_url!);
                      addNotification("success", "Netlify URL copied!");
                    }}
                    className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors"
                    title="Copy Netlify URL"
                  >
                    <Copy className="h-3 w-3 text-gray-400" />
                  </button>
                  <a
                    href={app.netlify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 p-1 hover:bg-gray-600 rounded transition-colors"
                    title="Open Netlify URL"
                  >
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                </div>
              )}
              {app.custom_domain && (
                <div className="flex items-center text-xs bg-gray-700/50 rounded px-2 py-1.5">
                  <Globe className="h-3 w-3 text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-300 truncate flex-1">
                    {app.custom_domain}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(app.custom_domain!);
                      addNotification("success", "Custom domain copied!");
                    }}
                    className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors"
                    title="Copy custom domain"
                  >
                    <Copy className="h-3 w-3 text-gray-400" />
                  </button>
                  <a
                    href={app.custom_domain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 p-1 hover:bg-gray-600 rounded transition-colors"
                    title="Open custom domain"
                  >
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                </div>
              )}
              {!app.netlify_url && !app.custom_domain && (
                <div className="text-xs text-gray-500 italic">
                  No deployment URLs configured
                </div>
              )}
            </div>

            {/* Features */}
            <div className="flex items-center space-x-2 mb-4">
              {app.is_featured && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  Featured
                </span>
              )}
              {app.is_public && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Public
                </span>
              )}
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                Order: {app.sort_order}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(app)}
                  disabled={operationLoading[app.id]}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {operationLoading[app.id] ? (
                    <div className="w-4 h-4 border-t border-red-400 border-solid rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* Public Visibility Toggle */}
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() =>
                      togglePublicVisibility(app.id, app.is_public)
                    }
                    disabled={operationLoading[app.id]}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      app.is_public ? "bg-blue-600" : "bg-gray-600"
                    } ${operationLoading[app.id] ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={app.is_public ? "Make private" : "Make public"}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        app.is_public ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Active Status Toggle */}
                <button
                  onClick={() => toggleApp(app.id, app.is_active)}
                  disabled={toggling === app.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    app.is_active ? "bg-green-600" : "bg-gray-600"
                  } ${toggling === app.id ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={app.is_active ? "Deactivate app" : "Activate app"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      app.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  {toggling === app.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border-t border-white border-solid rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {apps.length === 0 && !loading && (
        <div className="text-center py-20">
          <Settings className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No applications found
          </h3>
          <p className="text-gray-400">
            Get started by adding your first application.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} apps
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                fetchApps(newPage);
              }}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-gray-600"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum =
                    Math.max(
                      1,
                      Math.min(pagination.totalPages - 4, currentPage - 2),
                    ) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        fetchApps(pageNum);
                      }}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg transition-colors border ${
                        currentPage === pageNum
                          ? "bg-primary-600 border-primary-500 text-white"
                          : "bg-gray-800 hover:bg-gray-700 border-gray-600 text-white disabled:cursor-not-allowed"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() => {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                fetchApps(newPage);
              }}
              disabled={currentPage === pagination.totalPages || loading}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && showDeleteModal.app && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">
                Delete Application
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <strong>{showDeleteModal.app.name}</strong>? This action cannot be
              undone and will remove all associated data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal({ show: false, app: null })}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showDeleteModal.app && deleteApp(showDeleteModal.app.id)
                }
                disabled={operationLoading[showDeleteModal.app.id]}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {operationLoading[showDeleteModal.app.id]
                  ? "Deleting..."
                  : "Delete App"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminAppsManagement;
