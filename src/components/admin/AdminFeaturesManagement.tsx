import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit,
  Trash2,
  Settings,
  ChevronDown,
  AlertTriangle,
  X,
  CheckCircle,
  Shield,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import { useAdmin } from "../../context/AdminContext";

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_enabled: boolean;
  app_slug?: string;
  app_name?: string;
  parent_app_id?: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const AdminFeaturesManagement: React.FC = () => {
  const { user } = useAdmin();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [showAppDropdown, setShowAppDropdown] = useState(false);

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
    feature: Feature | null;
  }>({ show: false, feature: null });
  const [operationLoading, setOperationLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{
    show: boolean;
    feature: Feature | null;
  }>({ show: false, feature: null });
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent_app_id: "",
    is_enabled: true,
    config: "{}",
  });

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
  const filteredFeatures = useMemo(() => {
    if (selectedApp === "all") {
      return allFeatures;
    }
    // Find the app ID for the selected app slug
    const selectedAppData = apps.find((app) => app.slug === selectedApp);
    return selectedAppData
      ? allFeatures.filter(
          (feature) => feature.parent_app_id === selectedAppData.id,
        )
      : allFeatures;
  }, [allFeatures, selectedApp, apps]);

  useEffect(() => {
    fetchFeatures();
    fetchApps();
  }, []);

  // Update features when filtered results change
  useEffect(() => {
    setFeatures(filteredFeatures);
  }, [filteredFeatures]);

  const fetchFeatures = useCallback(async () => {
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-features`,
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
        setAllFeatures(data.data || []);
      } else {
        setError(data.error || "Failed to load features");
      }
    } catch (error) {
      console.error("Error fetching features:", error);
      setError(
        "Failed to load features. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  const fetchApps = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-apps`,
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
        setApps(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching apps:", error);
    }
  }, []);

  const openAddModal = useCallback(() => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      parent_app_id: "",
      is_enabled: true,
      config: "{}",
    });
    setShowAddModal(true);
  }, []);

  const openEditModal = useCallback((feature: Feature) => {
    setFormData({
      name: feature.name,
      slug: feature.slug,
      description: feature.description,
      parent_app_id: feature.parent_app_id || "",
      is_enabled: feature.is_enabled,
      config: JSON.stringify(feature.config, null, 2),
    });
    setShowEditModal({ show: true, feature });
  }, []);

  const createFeature = useCallback(async () => {
    clearMessages();
    setOperationLoading((prev) => ({ ...prev, create: true }));

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

      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(formData.config);
      } catch (e) {
        setError("Invalid JSON in config field");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-features`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            parent_app_id: formData.parent_app_id || null,
            is_enabled: formData.is_enabled,
            config: parsedConfig,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAllFeatures((prevFeatures) => [data.data, ...prevFeatures]);
        addNotification("success", "Feature created successfully");
        setShowAddModal(false);
      } else {
        setError(data.error || "Failed to create feature");
      }
    } catch (error) {
      console.error("Error creating feature:", error);
      setError("Failed to create feature. Please try again.");
    } finally {
      setOperationLoading((prev) => ({ ...prev, create: false }));
    }
  }, [formData, clearMessages, addNotification]);

  const updateFeature = useCallback(async () => {
    if (!showEditModal.feature) return;

    clearMessages();
    setOperationLoading((prev) => ({
      ...prev,
      [showEditModal.feature!.id]: true,
    }));

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

      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(formData.config);
      } catch (e) {
        setError("Invalid JSON in config field");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-features/${showEditModal.feature.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            parent_app_id: formData.parent_app_id || null,
            is_enabled: formData.is_enabled,
            config: parsedConfig,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAllFeatures((prevFeatures) =>
          prevFeatures.map((f) =>
            f.id === showEditModal.feature!.id ? data.data : f,
          ),
        );
        addNotification("success", "Feature updated successfully");
        setShowEditModal({ show: false, feature: null });
      } else {
        setError(data.error || "Failed to update feature");
      }
    } catch (error) {
      console.error("Error updating feature:", error);
      setError("Failed to update feature. Please try again.");
    } finally {
      setOperationLoading((prev) => ({
        ...prev,
        [showEditModal.feature!.id]: false,
      }));
    }
  }, [formData, showEditModal, clearMessages, addNotification]);

  const toggleFeature = useCallback(
    async (featureId: string, currentStatus: boolean) => {
      setToggling(featureId);
      clearMessages();
      setOperationLoading((prev) => ({ ...prev, [featureId]: true }));

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
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-features/${featureId}/toggle`,
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
          setAllFeatures((prevFeatures) =>
            prevFeatures.map((feature) =>
              feature.id === featureId
                ? { ...feature, is_enabled: data.data.is_enabled }
                : feature,
            ),
          );
          addNotification(
            "success",
            `Feature ${currentStatus ? "disabled" : "enabled"} successfully`,
          );
        } else {
          setError(data.error || "Failed to toggle feature status");
        }
      } catch (error) {
        console.error("Error toggling feature:", error);
        setError("Failed to toggle feature status. Please try again.");
      } finally {
        setToggling(null);
        setOperationLoading((prev) => ({ ...prev, [featureId]: false }));
      }
    },
    [clearMessages, addNotification],
  );

  const deleteFeature = useCallback(
    async (featureId: string) => {
      clearMessages();
      setOperationLoading((prev) => ({ ...prev, [featureId]: true }));

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
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-features`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: featureId }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setAllFeatures((prevFeatures) =>
            prevFeatures.filter((feature) => feature.id !== featureId),
          );
          addNotification("success", "Feature deleted successfully");
          setShowDeleteModal({ show: false, feature: null });
        } else {
          setError(data.error || "Failed to delete feature");
        }
      } catch (error) {
        console.error("Error deleting feature:", error);
        setError("Failed to delete feature. Please try again.");
      } finally {
        setOperationLoading((prev) => ({ ...prev, [featureId]: false }));
      }
    },
    [clearMessages, addNotification],
  );

  const openDeleteModal = useCallback((feature: Feature) => {
    setShowDeleteModal({ show: true, feature });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if user is super admin for feature toggling
  if (user?.role !== "super_admin") {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 mr-3" />
            <h3 className="text-lg font-semibold">
              Super Admin Access Required
            </h3>
          </div>
          <p className="text-sm">
            Feature toggling is restricted to super administrators only. You can
            view features but cannot modify their enabled/disabled status.
          </p>
        </div>

        {/* Show features in read-only mode */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Settings className="h-6 w-6 mr-3 text-blue-500" />
              Features Management
            </h2>
          </div>

          {features.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No features found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.id} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-white font-medium">
                          {feature.name}
                        </span>
                        <span
                          className={`ml-3 px-2 py-1 text-xs rounded ${
                            feature.is_enabled
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {feature.is_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="text-gray-400 text-sm mt-1">
                          {feature.description}
                        </p>
                      )}
                      {feature.app_name && (
                        <p className="text-blue-400 text-xs mt-1">
                          App: {feature.app_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            Features Management
          </h2>
          <p className="text-gray-400">
            Control which features are available for each app
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
                  ? "All Features"
                  : apps.find((app) => app.slug === selectedApp)?.name ||
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
                    All Features
                  </button>
                  {apps.map((app) => (
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

          <button
            onClick={openAddModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </button>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-4">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              {/* Feature Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-gray-400">{feature.slug}</p>
                  </div>
                </div>

                {feature.description && (
                  <p className="text-gray-300 text-sm mb-3">
                    {feature.description}
                  </p>
                )}

                {/* Config Preview */}
                {feature.config && Object.keys(feature.config).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Configuration:</p>
                    <div className="bg-gray-900/50 rounded p-2 text-xs text-gray-400 font-mono">
                      {JSON.stringify(feature.config, null, 2).slice(0, 100)}
                      {JSON.stringify(feature.config).length > 100 && "..."}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feature.is_enabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {feature.is_enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(feature.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 ml-6">
                <button
                  onClick={() => openEditModal(feature)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(feature)}
                  disabled={operationLoading[feature.id]}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {operationLoading[feature.id] ? (
                    <div className="w-4 h-4 border-t border-red-400 border-solid rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleFeature(feature.id, feature.is_enabled)}
                  disabled={toggling === feature.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    feature.is_enabled ? "bg-green-600" : "bg-gray-600"
                  } ${toggling === feature.id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      feature.is_enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  {toggling === feature.id && (
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

      {features.length === 0 && (
        <div className="text-center py-20">
          <ToggleLeft className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No features found
          </h3>
          <p className="text-gray-400">
            Get started by adding your first feature.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && showDeleteModal.feature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">
                Delete Feature
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <strong>{showDeleteModal.feature.name}</strong>? This action
              cannot be undone and will affect all associated applications.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setShowDeleteModal({ show: false, feature: null })
                }
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showDeleteModal.feature &&
                  deleteFeature(showDeleteModal.feature.id)
                }
                disabled={operationLoading[showDeleteModal.feature.id]}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {operationLoading[showDeleteModal.feature.id]
                  ? "Deleting..."
                  : "Delete Feature"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Feature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Add New Feature
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="AI Video Generator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="ai-video-generator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24"
                  placeholder="Feature description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Parent App *
                </label>
                <select
                  value={formData.parent_app_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_app_id: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select Parent App</option>
                  {apps
                    .filter((app) => app.item_type === "app")
                    .map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name} ({app.slug})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Features must belong to a parent application
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Configuration (JSON)
                </label>
                <textarea
                  value={formData.config}
                  onChange={(e) =>
                    setFormData({ ...formData, config: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm h-32"
                  placeholder='{"key": "value"}'
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.is_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, is_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="enabled" className="ml-2 text-sm text-gray-300">
                  Enable this feature
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFeature}
                disabled={
                  operationLoading.create ||
                  !formData.name ||
                  !formData.slug ||
                  !formData.parent_app_id
                }
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {operationLoading.create ? "Creating..." : "Create Feature"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Feature Modal */}
      {showEditModal.show && showEditModal.feature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Feature</h3>
              <button
                onClick={() => setShowEditModal({ show: false, feature: null })}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Parent App *
                </label>
                <select
                  value={formData.parent_app_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_app_id: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select Parent App</option>
                  {apps
                    .filter((app) => app.item_type === "app")
                    .map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name} ({app.slug})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Features must belong to a parent application
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Configuration (JSON)
                </label>
                <textarea
                  value={formData.config}
                  onChange={(e) =>
                    setFormData({ ...formData, config: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm h-32"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled-edit"
                  checked={formData.is_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, is_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="enabled-edit"
                  className="ml-2 text-sm text-gray-300"
                >
                  Enable this feature
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal({ show: false, feature: null })}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateFeature}
                disabled={
                  operationLoading[showEditModal.feature.id] ||
                  !formData.name ||
                  !formData.slug ||
                  !formData.parent_app_id
                }
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {operationLoading[showEditModal.feature.id]
                  ? "Updating..."
                  : "Update Feature"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminFeaturesManagement;
