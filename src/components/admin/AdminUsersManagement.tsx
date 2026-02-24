import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
  ChevronDown,
  X,
  Key,
  Settings,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string; // Keep for backward compatibility
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  app_access?: string[];
  app_count?: number;
}

const AdminUsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    userId: string | null;
    userName: string;
  }>({ show: false, userId: null, userName: "" });
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "user",
  });
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    first_name?: string;
    last_name?: string;
  }>({});
  const [bulkUsers, setBulkUsers] = useState("");
  const [uploading, setUploading] = useState(false);

  // App access management states
  const [showAppAccessModal, setShowAppAccessModal] = useState(false);
  const [selectedUserForApps, setSelectedUserForApps] = useState<User | null>(
    null,
  );
  const [availableApps, setAvailableApps] = useState<
    Array<{ slug: string; name: string; category: string }>
  >([]);
  const [userAppAccess, setUserAppAccess] = useState<string[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [savingAppAccess, setSavingAppAccess] = useState(false);

  // Feature access management states
  const [showFeatureAccessModal, setShowFeatureAccessModal] = useState(false);
  const [selectedUserForFeatures, setSelectedUserForFeatures] =
    useState<User | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      app_name?: string;
      app_slug?: string;
    }>
  >([]);
  const [userFeatureAccess, setUserFeatureAccess] = useState<string[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [savingFeatureAccess, setSavingFeatureAccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const fetchUsers = async () => {
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
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
        setUsers(data.data || []);
      } else {
        setError(data.error || "Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(
        "Failed to load users. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (userId: string, currentStatus: boolean) => {
    setToggling(userId);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: userId,
            is_active: !currentStatus,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, is_active: !currentStatus } : user,
          ),
        );
        setSuccess(
          `User ${currentStatus ? "deactivated" : "activated"} successfully`,
        );
      } else {
        setError(data.error || "Failed to toggle user status");
      }
    } catch (error) {
      console.error("Error toggling user:", error);
      setError("Failed to toggle user status. Please try again.");
    } finally {
      setToggling(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeleting(userId);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers(users.filter((user) => user.id !== userId));
        setSuccess("User deleted successfully");
        setShowDeleteModal({ show: false, userId: null, userName: "" });
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const openDeleteModal = (userId: string, userName: string) => {
    setShowDeleteModal({ show: true, userId, userName });
  };

  const validateUserForm = () => {
    const errors: { email?: string; first_name?: string; last_name?: string } =
      {};

    if (!newUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (newUser.first_name && newUser.first_name.length > 50) {
      errors.first_name = "First name must be less than 50 characters";
    }

    if (newUser.last_name && newUser.last_name.length > 50) {
      errors.last_name = "Last name must be less than 50 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createUser = async () => {
    if (!validateUserForm()) return;

    setCreating(true);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers([data.data, ...users]);
        setNewUser({ email: "", first_name: "", last_name: "", role: "user" });
        setFormErrors({});
        setShowAddModal(false);
        setSuccess("User created successfully");
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const bulkCreateUsers = async () => {
    if (!bulkUsers.trim()) {
      setError("Please enter user data");
      return;
    }

    setUploading(true);
    clearMessages();
    try {
      // Parse CSV-like data (email,first_name,last_name,role format)
      const lines = bulkUsers.trim().split("\n");
      const usersToCreate = lines
        .map((line) => {
          const [email, first_name, last_name, role] = line
            .split(",")
            .map((s) => s.trim());
          return {
            email: email || "",
            first_name: first_name || "",
            last_name: last_name || "",
            role: role || "user",
          };
        })
        .filter(
          (user) => user.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email),
        );

      if (usersToCreate.length === 0) {
        setError(
          "No valid users found in the input. Please check the format: email,first_name,last_name,role",
        );
        return;
      }

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ users: usersToCreate }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers([...data.data, ...users]);
        setBulkUsers("");
        setShowBulkUploadModal(false);
        setSuccess(`Successfully created ${data.data.length} users`);
      } else {
        setError(data.error || "Failed to create users");
      }
    } catch (error) {
      console.error("Error bulk creating users:", error);
      setError("Failed to create users. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "email,first_name,last_name,role\nuser1@example.com,John,Doe,user\nuser2@example.com,Jane,Smith,admin";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openAppAccessModal = async (user: User) => {
    setSelectedUserForApps(user);
    setShowAppAccessModal(true);
    setLoadingApps(true);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${user.id}/app-access`,
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
        setAvailableApps(data.data.available_apps || []);
        setUserAppAccess(
          data.data.user_access.map((a: any) => a.app_slug) || [],
        );
      } else {
        setError(data.error || "Failed to load app access data");
      }
    } catch (error) {
      console.error("Error fetching app access:", error);
      setError("Failed to load app access data. Please try again.");
    } finally {
      setLoadingApps(false);
    }
  };

  const toggleAppAccess = (appSlug: string) => {
    setUserAppAccess((prev) => {
      if (prev.includes(appSlug)) {
        return prev.filter((slug) => slug !== appSlug);
      } else {
        return [...prev, appSlug];
      }
    });
  };

  const saveAppAccess = async () => {
    if (!selectedUserForApps) return;

    setSavingAppAccess(true);
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

      // Grant access to selected apps
      if (userAppAccess.length > 0) {
        const grantResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${selectedUserForApps.id}/app-access`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ app_slugs: userAppAccess }),
          },
        );

        if (!grantResponse.ok) {
          throw new Error(`HTTP error! status: ${grantResponse.status}`);
        }
      }

      // Revoke access to unselected apps
      const currentAccess = selectedUserForApps.app_access || [];
      const toRevoke = currentAccess.filter(
        (slug) => !userAppAccess.includes(slug),
      );

      if (toRevoke.length > 0) {
        const revokeResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${selectedUserForApps.id}/app-access`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ app_slugs: toRevoke }),
          },
        );

        if (!revokeResponse.ok) {
          throw new Error(`HTTP error! status: ${revokeResponse.status}`);
        }
      }

      setSuccess("App access updated successfully");
      setShowAppAccessModal(false);

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error saving app access:", error);
      setError("Failed to update app access. Please try again.");
    } finally {
      setSavingAppAccess(false);
    }
  };

  const openFeatureAccessModal = async (user: User) => {
    setSelectedUserForFeatures(user);
    setShowFeatureAccessModal(true);
    setLoadingFeatures(true);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-features/${user.id}`,
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
        setAvailableFeatures(data.data || []);
        setUserFeatureAccess(
          data.data.filter((f: any) => f.has_access).map((f: any) => f.slug) ||
            [],
        );
      } else {
        setError(data.error || "Failed to load feature access data");
      }
    } catch (error) {
      console.error("Error fetching feature access:", error);
      setError("Failed to load feature access data. Please try again.");
    } finally {
      setLoadingFeatures(false);
    }
  };

  const toggleFeatureAccess = (featureSlug: string) => {
    setUserFeatureAccess((prev) => {
      if (prev.includes(featureSlug)) {
        return prev.filter((slug) => slug !== featureSlug);
      } else {
        return [...prev, featureSlug];
      }
    });
  };

  const saveFeatureAccess = async () => {
    if (!selectedUserForFeatures) return;

    setSavingFeatureAccess(true);
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

      // Get current feature access
      const currentAccess = availableFeatures
        .filter((f) => f.has_access)
        .map((f) => f.slug);
      const toGrant = userFeatureAccess.filter(
        (slug) => !currentAccess.includes(slug),
      );
      const toRevoke = currentAccess.filter(
        (slug) => !userFeatureAccess.includes(slug),
      );

      // Grant access to selected features
      if (toGrant.length > 0) {
        const grantResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-features/${selectedUserForFeatures.id}/grant`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ feature_slug: toGrant[0] }), // For now, handle one at a time
          },
        );

        if (!grantResponse.ok) {
          throw new Error(`HTTP error! status: ${grantResponse.status}`);
        }
      }

      // Revoke access to unselected features
      if (toRevoke.length > 0) {
        const revokeResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-features/${selectedUserForFeatures.id}/revoke`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ feature_slug: toRevoke[0] }), // For now, handle one at a time
          },
        );

        if (!revokeResponse.ok) {
          throw new Error(`HTTP error! status: ${revokeResponse.status}`);
        }
      }

      setSuccess("Feature access updated successfully");
      setShowFeatureAccessModal(false);

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error saving feature access:", error);
      setError("Failed to update feature access. Please try again.");
    } finally {
      setSavingFeatureAccess(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return selectedRole === "all"
      ? users || []
      : (users || []).filter((user) => user.role === selectedRole);
  }, [users, selectedRole]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
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
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Users Management
          </h2>
          <p className="text-gray-400">
            Manage application users and their access
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Role Filter */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors border border-gray-600"
            >
              <span className="mr-2">
                {selectedRole === "all"
                  ? "All Roles"
                  : selectedRole.charAt(0).toUpperCase() +
                    selectedRole.slice(1)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setSelectedRole("all");
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                  >
                    All Roles
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole("user");
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                  >
                    User
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole("admin");
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={downloadTemplate}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </button>

          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.name || "Unnamed User"}
                    </h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                    {user.app_count || 0} Apps
                  </span>
                  <span className="text-xs text-gray-500">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  {user.last_login && (
                    <span className="text-xs text-gray-500">
                      Last Login:{" "}
                      {new Date(user.last_login).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 ml-6">
                <button
                  onClick={() => openAppAccessModal(user)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg flex items-center transition-colors"
                  title="Manage app access"
                >
                  <Key className="h-3 w-3 mr-1" />
                  Manage Apps
                </button>
                <button
                  onClick={() => openFeatureAccessModal(user)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg flex items-center transition-colors"
                  title="Manage feature access"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage Features
                </button>
                <button
                  onClick={() => {
                    setNewUser({
                      email: user.email,
                      first_name: user.first_name || "",
                      last_name: user.last_name || "",
                      role: user.role,
                    });
                    setShowAddModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    openDeleteModal(
                      user.id,
                      user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.email,
                    )
                  }
                  disabled={deleting === user.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === user.id ? (
                    <div className="w-4 h-4 border-t border-red-400 border-solid rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleUser(user.id, user.is_active)}
                  disabled={toggling === user.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    user.is_active ? "bg-green-600" : "bg-gray-600"
                  } ${toggling === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  {toggling === user.id && (
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-20">
          <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No users found
          </h3>
          <p className="text-gray-400">
            Get started by adding your first user.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Delete User</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {showDeleteModal.userName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setShowDeleteModal({
                    show: false,
                    userId: null,
                    userName: "",
                  })
                }
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showDeleteModal.userId && deleteUser(showDeleteModal.userId)
                }
                disabled={deleting === showDeleteModal.userId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting === showDeleteModal.userId
                  ? "Deleting..."
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                    formErrors.email ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="user@example.com"
                />
                {formErrors.email && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, first_name: e.target.value })
                    }
                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                      formErrors.first_name
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    placeholder="John"
                  />
                  {formErrors.first_name && (
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, last_name: e.target.value })
                    }
                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                      formErrors.last_name
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    placeholder="Doe"
                  />
                  {formErrors.last_name && (
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.last_name}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={creating}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Bulk Upload Users
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Enter user data in CSV format: email,first_name,last_name,role
              (one user per line)
            </p>
            <textarea
              value={bulkUsers}
              onChange={(e) => setBulkUsers(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-40 resize-none"
              placeholder={`user1@example.com,John,Doe,user
user2@example.com,Jane,Smith,admin
user3@example.com,Bob,Johnson,user`}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkCreateUsers}
                disabled={uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Users"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Access Modal */}
      {showAppAccessModal && selectedUserForApps && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Manage App Access
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedUserForApps.first_name &&
                  selectedUserForApps.last_name
                    ? `${selectedUserForApps.first_name} ${selectedUserForApps.last_name}`
                    : selectedUserForApps.email}
                </p>
              </div>
              <button
                onClick={() => setShowAppAccessModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingApps ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-300">
                      Select apps to grant access ({userAppAccess.length}{" "}
                      selected)
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setUserAppAccess(availableApps.map((app) => app.slug))
                        }
                        className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setUserAppAccess([])}
                        className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Group apps by category */}
                {Object.entries(
                  availableApps.reduce(
                    (acc, app) => {
                      if (!acc[app.category]) acc[app.category] = [];
                      acc[app.category].push(app);
                      return acc;
                    },
                    {} as Record<string, typeof availableApps>,
                  ),
                ).map(([category, apps]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 capitalize">
                      {category.replace(/-/g, " ")}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {apps.map((app) => (
                        <button
                          key={app.slug}
                          onClick={() => toggleAppAccess(app.slug)}
                          className={`p-3 rounded-lg text-left transition-all ${
                            userAppAccess.includes(app.slug)
                              ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                              : "bg-gray-700 border-2 border-transparent text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">{app.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {availableApps.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    No apps available
                  </div>
                )}

                <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowAppAccessModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAppAccess}
                    disabled={savingAppAccess}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingAppAccess ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Feature Access Modal */}
      {showFeatureAccessModal && selectedUserForFeatures && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Manage Feature Access
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedUserForFeatures.first_name &&
                  selectedUserForFeatures.last_name
                    ? `${selectedUserForFeatures.first_name} ${selectedUserForFeatures.last_name}`
                    : selectedUserForFeatures.email}
                </p>
              </div>
              <button
                onClick={() => setShowFeatureAccessModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingFeatures ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-300">
                      Select features to grant access (
                      {userFeatureAccess.length} selected)
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setUserFeatureAccess(
                            availableFeatures.map((feature) => feature.slug),
                          )
                        }
                        className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setUserFeatureAccess([])}
                        className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Group features by app */}
                {Object.entries(
                  availableFeatures.reduce(
                    (acc, feature) => {
                      const appKey = feature.app_name || "Standalone Features";
                      if (!acc[appKey]) acc[appKey] = [];
                      acc[appKey].push(feature);
                      return acc;
                    },
                    {} as Record<string, typeof availableFeatures>,
                  ),
                ).map(([appName, features]) => (
                  <div key={appName} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      {appName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {features.map((feature) => (
                        <button
                          key={feature.slug}
                          onClick={() => toggleFeatureAccess(feature.slug)}
                          className={`p-3 rounded-lg text-left transition-all ${
                            userFeatureAccess.includes(feature.slug)
                              ? "bg-blue-600/20 border-2 border-blue-500 text-white"
                              : "bg-gray-700 border-2 border-transparent text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {feature.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {feature.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {availableFeatures.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    No features available. User must have app access first.
                  </div>
                )}

                <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowFeatureAccessModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveFeatureAccess}
                    disabled={savingFeatureAccess}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingFeatureAccess ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagement;
