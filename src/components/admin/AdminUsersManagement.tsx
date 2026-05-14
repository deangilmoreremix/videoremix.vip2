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
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Package,
  Shield,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import {
  bundles,
  getBundleApps,
  getAllBundleIds,
  getBundleForApp,
  getTotalAppCount,
  bundleIcons,
} from "../../data/bundleData";
import type { Bundle } from "../../data/bundleData";

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

interface App {
  slug: string;
  name: string;
  category: string;
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

  // Direct app toggle states
  const [togglingApp, setTogglingApp] = useState<string | null>(null);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [loadingAllApps, setLoadingAllApps] = useState(false);

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

   // App toggle expansion states
   const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
   const [showBundleSection, setShowBundleSection] = useState<Set<string>>(new Set());
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
   const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
   const [showBulkConfirmModal, setShowBulkConfirmModal] = useState<{
     show: boolean;
     operation: 'activate' | 'deactivate' | 'grantAll' | 'grantBundle' | 'revokeAll' | null;
     bundleId?: string;
   }>({ show: false, operation: null });

    // Modal search state
    const [appSearchQuery, setAppSearchQuery] = useState('');

    // Computed values
    const totalAppsCount = allApps.length;
    const filteredAvailableApps = useMemo(() => {
     if (!appSearchQuery.trim()) return availableApps;
     const query = appSearchQuery.toLowerCase();
     return availableApps.filter(app =>
       app.name.toLowerCase().includes(query) ||
       app.category.toLowerCase().includes(query)
     );
   }, [availableApps, appSearchQuery]);

   const appsGroupedByCategory = useMemo(() => {
     return filteredAvailableApps.reduce((acc, app) => {
       if (!acc[app.category]) acc[app.category] = [];
       acc[app.category].push(app);
       return acc;
     }, {} as Record<string, typeof availableApps>);
    }, [filteredAvailableApps]);

  useEffect(() => {
    fetchUsers();
    fetchAllApps();
  }, []);

  const fetchAllApps = async () => {
    setLoadingAllApps(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.warn("Cannot fetch apps: No valid session");
        return;
      }
      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-apps`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch apps: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAllApps(data.data || []);
      } else {
        console.warn("Failed to fetch apps:", data.error);
        setAllApps([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error("Error fetching apps:", error);
      setAllApps([]); // Set empty array as fallback
    } finally {
      setLoadingAllApps(false);
    }
  };

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
     setAppSearchQuery(''); // Reset search
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

   // Direct app toggle for individual users with rate limiting and error recovery
   const toggleUserAppAccess = async (userId: string, appSlug: string, currentAccess: boolean) => {
     const toggleKey = `${userId}-${appSlug}`;

     // Prevent concurrent operations on same user
     if (togglingApp && togglingApp.startsWith(userId + '-')) {
       return; // Already processing an operation for this user
     }

     setTogglingApp(toggleKey);
     clearMessages();

     // Optimistic UI update
     const previousUsers = [...users];
     setUsers(prevUsers => prevUsers.map(user => {
       if (user.id === userId) {
         const currentAccessList = user.app_access || [];
         const updatedAccess = currentAccessList.includes(appSlug)
           ? currentAccessList.filter(slug => slug !== appSlug)
           : [...currentAccessList, appSlug];

         return {
           ...user,
           app_access: updatedAccess,
           app_count: updatedAccess.length
         };
       }
       return user;
     }));

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        // Revert optimistic update on auth error
        setUsers(previousUsers);
        setError("Authentication required. Please log in again.");
        return;
      }
      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${userId}/app-access`,
        {
          method: currentAccess ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ app_slugs: [appSlug] }),
        },
      );

      if (!response.ok) {
        // Revert optimistic update on API error
        setUsers(previousUsers);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuccess(`App ${currentAccess ? 'access removed' : 'access granted'} successfully`);
      } else {
        // Revert optimistic update on business logic error
        setUsers(previousUsers);
        throw new Error(data.error || `Failed to ${currentAccess ? 'remove' : 'grant'} app access`);
      }
    } catch (error: any) {
      // Revert optimistic update on any error
      setUsers(previousUsers);
      console.error("Error toggling app access:", error);
      setError(error.message || `Failed to ${currentAccess ? 'remove' : 'grant'} app access. Please try again.`);
    } finally {
      setTogglingApp(null);
    }
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

   const toggleUserExpansion = (userId: string) => {
     setExpandedUsers(prev => {
       const newSet = new Set(prev);
       if (newSet.has(userId)) {
         newSet.delete(userId);
       } else {
         newSet.add(userId);
       }
       return newSet;
     });
   };

   const toggleBundleSection = (userId: string) => {
     setShowBundleSection(prev => {
       const newSet = new Set(prev);
       if (newSet.has(userId)) {
         newSet.delete(userId);
       } else {
         newSet.add(userId);
       }
       return newSet;
     });
   };

   // Bulk selection helpers
   const toggleUserSelection = (userId: string) => {
     setSelectedUsers(prev => {
       const newSet = new Set(prev);
       if (newSet.has(userId)) {
         newSet.delete(userId);
       } else {
         newSet.add(userId);
       }
       return newSet;
     });
   };

   const toggleSelectAll = () => {
     if (selectedUsers.size === filteredUsers.length) {
       setSelectedUsers(new Set());
     } else {
       setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
     }
   };

   // Grant all apps to a user
   const grantAllAppsToUser = async (userId: string) => {
     const allAppSlugs = allApps.map(app => app.slug);
     return await updateUserAppAccess(userId, allAppSlugs, 'grant');
   };

   // Grant bundle to a user
   const grantBundleToUser = async (userId: string, bundleId: string) => {
     const bundleApps = getBundleApps(bundleId);
     return await updateUserAppAccess(userId, bundleApps, 'grant');
   };

   // Revoke all apps from a user
   const revokeAllAppsFromUser = async (userId: string) => {
     const user = users.find(u => u.id === userId);
     if (!user || !user.app_access || user.app_access.length === 0) return { success: false };
     return await updateUserAppAccess(userId, user.app_access, 'revoke');
   };

   // Generic app access update with optimistic UI
   const updateUserAppAccess = async (
     userId: string,
     appSlugs: string[],
     operation: 'grant' | 'revoke'
   ): Promise<boolean> => {
     const toggleKey = `${userId}-${operation}-${appSlugs.length}`;

     // Prevent concurrent operations on same user
     if (togglingApp && togglingApp.startsWith(userId + '-')) {
       return false;
     }

     setTogglingApp(toggleKey);
     clearMessages();

     // Get current user state for optimistic update
     const user = users.find(u => u.id === userId);
     if (!user) return false;

     const currentAccess = user.app_access || [];
     let newAccess: string[];

     if (operation === 'grant') {
       newAccess = Array.from(new Set([...currentAccess, ...appSlugs]));
     } else {
       newAccess = currentAccess.filter(slug => !appSlugs.includes(slug));
     }

     // Optimistic update
     setUsers(prevUsers =>
       prevUsers.map(u =>
         u.id === userId ? { ...u, app_access: newAccess, app_count: newAccess.length } : u
       )
     );

     try {
       const {
         data: { session },
         error: sessionError,
       } = await supabase.auth.getSession();

       if (sessionError || !session) {
         setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, app_access: currentAccess, app_count: currentAccess.length } : u));
         setError("Authentication required. Please log in again.");
         return false;
       }

       const token = session.access_token;
       const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${userId}/app-access`;

       const response = await fetch(url, {
         method: operation === 'grant' ? 'POST' : 'DELETE',
         headers: {
           Authorization: `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ app_slugs: appSlugs }),
       });

       if (!response.ok) {
         setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, app_access: currentAccess, app_count: currentAccess.length } : u));
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
       }

       const data = await response.json();
       if (data.success) {
         const opText = operation === 'grant' ? 'granted' : 'revoked';
         setSuccess(`${appSlugs.length} apps ${opText} successfully`);
         return true;
       } else {
         setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, app_access: currentAccess, app_count: currentAccess.length } : u));
         throw new Error(data.error || `Failed to ${operation} app access`);
       }
     } catch (error: any) {
       console.error(`Error ${operation} app access:`, error);
       setError(error.message || `Failed to ${operation} app access. Please try again.`);
       setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, app_access: currentAccess, app_count: currentAccess.length } : u));
       return false;
     } finally {
       setTogglingApp(null);
     }
   };

   // Bulk operations
   const executeBulkOperation = async (operation: 'activate' | 'deactivate' | 'grantAll' | 'grantBundle' | 'revokeAll', bundleId?: string) => {
     if (selectedUsers.size === 0) return;

     setBulkOperationInProgress(true);
     clearMessages();

     const userIds = Array.from(selectedUsers);
     let successCount = 0;
     let failCount = 0;

     // Process in batches of 50
     const batchSize = 50;
     const batches = [];
     for (let i = 0; i < userIds.length; i += batchSize) {
       batches.push(userIds.slice(i, i + batchSize));
     }

     for (const batch of batches) {
       for (const userId of batch) {
         try {
           let success = false;

           switch (operation) {
             case 'activate':
               success = await toggleUserActivation(userId, true);
               break;
             case 'deactivate':
               success = await toggleUserActivation(userId, false);
               break;
             case 'grantAll':
               success = await grantAllAppsToUser(userId);
               break;
             case 'grantBundle':
               if (bundleId) success = await grantBundleToUser(userId, bundleId);
               break;
             case 'revokeAll':
               success = await revokeAllAppsFromUser(userId);
               break;
           }

           if (success) successCount++;
           else failCount++;
         } catch (error) {
           console.error(`Bulk operation failed for user ${userId}:`, error);
           failCount++;
         }
       }
     }

     setSelectedUsers(new Set());
     setShowBulkConfirmModal({ show: false, operation: null });
     setBulkOperationInProgress(false);
     setSuccess(`Bulk operation complete: ${successCount} succeeded, ${failCount} failed`);
   };

   const toggleUserActivation = async (userId: string, activate: boolean): Promise<boolean> => {
     setToggling(userId);
     try {
       const {
         data: { session },
         error: sessionError,
       } = await supabase.auth.getSession();

       if (sessionError || !session) {
         setError("Authentication required. Please log in again.");
         return false;
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
             is_active: activate,
           }),
         },
       );

       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

       const data = await response.json();
       if (data.success) {
         setUsers(users.map(user => user.id === userId ? { ...user, is_active: activate } : user));
         return true;
       } else {
         setError(data.error || "Failed to toggle user status");
         return false;
       }
     } catch (error: any) {
       console.error("Error toggling user activation:", error);
       setError(error.message || "Failed to toggle user status");
       return false;
     } finally {
       setToggling(null);
     }
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
     let result = users || [];

     // Filter by role
     if (selectedRole !== "all") {
       result = result.filter((user) => user.role === selectedRole);
     }

     // Filter by search query
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase();
       result = result.filter((user) =>
         user.email.toLowerCase().includes(query) ||
         (user.first_name && user.first_name.toLowerCase().includes(query)) ||
         (user.last_name && user.last_name.toLowerCase().includes(query)) ||
         (user.name && user.name.toLowerCase().includes(query))
       );
     }

     return result;
   }, [users, selectedRole, searchQuery]);

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
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
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

       {/* Filters & Search Bar */}
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
         <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search users by email or name..."
             className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
           />
           {searchQuery && (
             <button
               onClick={() => setSearchQuery('')}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
             >
               <X className="h-4 w-4" />
             </button>
           )}
         </div>

         <div className="flex items-center gap-2 text-sm text-gray-400">
           <span>{filteredUsers.length} user(s)</span>
           {selectedUsers.size > 0 && (
             <span className="text-primary-400">
               ({selectedUsers.size} selected)
             </span>
           )}
         </div>
       </div>

       {/* Select All Bar */}
       {filteredUsers.length > 0 && (
         <div className="flex items-center mb-4 pb-2 border-b border-gray-700">
           <button
             onClick={toggleSelectAll}
             className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white"
           >
             {selectedUsers.size === filteredUsers.length ? (
               <CheckSquare className="h-4 w-4 text-primary-500" />
             ) : (
               <Square className="h-4 w-4 text-gray-400" />
             )}
             <span>
               {selectedUsers.size === filteredUsers.length
                 ? 'Deselect All'
                 : 'Select All'}
             </span>
           </button>
           {selectedUsers.size > 0 && (
             <span className="ml-4 text-xs text-gray-400">
               {selectedUsers.size} of {filteredUsers.length} selected
             </span>
           )}
         </div>
       )}

       {/* Users List */}
       <div className="space-y-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Left column with checkbox + user content */}
              <div className="flex-1 flex items-start space-x-4">
                {/* Checkbox for bulk selection */}
                <button
                  onClick={() => toggleUserSelection(user.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {selectedUsers.has(user.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary-500" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {/* User content column */}
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
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
                        Last Login: {new Date(user.last_login).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Grant All Apps Toggle */}
                  <div className="mt-4 flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div>
                      <div className="text-sm font-medium text-white">Grant All Apps</div>
                      <div className="text-xs text-gray-400">
                        {user.app_count || 0} of {totalAppsCount} apps
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const hasAll = (user.app_count || 0) === totalAppsCount;
                        if (hasAll) {
                          await updateUserAppAccess(user.id, user.app_access || [], 'revoke');
                        } else {
                          await grantAllAppsToUser(user.id);
                        }
                      }}
                      disabled={togglingApp !== null}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
                        (user.app_count || 0) === totalAppsCount ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-500"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (user.app_count || 0) === totalAppsCount ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                      {togglingApp !== null && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-3 h-3 border-t-2 border-white border-solid rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Bundle Access Section */}
                  <div className="mt-3">
                    <button
                      onClick={() => toggleBundleSection(user.id)}
                      className="flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      <span>Bundle Access ({bundles.length} bundles)</span>
                      <ChevronDown
                        className={`h-4 w-4 ml-2 transition-transform ${
                          showBundleSection.has(user.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showBundleSection.has(user.id) && (
                      <div className="mt-3 bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {bundles.map((bundle: Bundle) => {
                            const bundleApps = bundle.apps;
                            const userAccessSet = new Set(user.app_access || []);
                            const grantedCount = bundleApps.filter(app => userAccessSet.has(app)).length;
                            const isFull = grantedCount === bundleApps.length;
                            const isPartial = grantedCount > 0 && grantedCount < bundleApps.length;
                            const bundleKey = `${user.id}-${bundle.id}`;
                            const isToggling = togglingApp?.includes(bundleKey);

                            return (
                              <div
                                key={bundle.id}
                                className={`p-3 rounded-lg border transition-all ${
                                  isFull
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : isPartial
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{bundleIcons[bundle.category]?.icon || '📦'}</span>
                                      <div>
                                        <div className="text-sm font-medium text-white truncate">
                                          {bundle.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {grantedCount}/{bundleApps.length} apps
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (isFull || isPartial) {
                                        // Revoke bundle
                                        updateUserAppAccess(user.id, bundleApps, 'revoke');
                                      } else {
                                        // Grant bundle
                                        grantBundleToUser(user.id, bundle.id);
                                      }
                                    }}
                                    disabled={isToggling}
                                    className={`relative ml-2 inline-flex h-5 w-8 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 ${
                                      isFull ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-500"
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                        isFull ? "translate-x-4" : "translate-x-1"
                                      }`}
                                    />
                                    {isToggling && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-3 h-3 border-t-2 border-white border-solid rounded-full animate-spin" />
                                      </div>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Individual App Access Toggles */}
                  {!loadingAllApps && allApps.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleUserExpansion(user.id)}
                        className="flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-2"
                        disabled={!user.app_access && !Array.isArray(user.app_access)}
                      >
                        <span className="mr-2">
                          {expandedUsers.has(user.id) ? "Hide" : "Show"} Individual Apps
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedUsers.has(user.id) ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedUsers.has(user.id) && (
                        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {allApps.slice(0, 12).map((app) => {
                              const hasAccess = (user.app_access || []).includes(app.slug);
                              const toggleKey = `${user.id}-${app.slug}`;
                              const isToggling = togglingApp === toggleKey;

                              return (
                                <div
                                  key={app.slug}
                                  className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700"
                                >
                                  <span className="text-xs text-gray-300 truncate mr-2" title={app.name}>
                                    {app.name}
                                  </span>
                                  <button
                                    onClick={() => toggleUserAppAccess(user.id, app.slug, hasAccess)}
                                    disabled={isToggling}
                                    className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
                                      hasAccess ? "bg-primary-600 hover:bg-primary-700" : "bg-gray-600 hover:bg-gray-500"
                                    } ${isToggling ? "opacity-50" : ""}`}
                                    title={`${hasAccess ? "Remove" : "Grant"} access to ${app.name}`}
                                    aria-label={`${hasAccess ? "Remove" : "Grant"} access to ${app.name}`}
                                  >
                                    <span
                                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                        hasAccess ? "translate-x-4" : "translate-x-1"
                                      }`}
                                    />
                                    {isToggling && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                      </div>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          {allApps.length > 12 && (
                            <div className="mt-2 text-xs text-gray-400 text-center">
                              Showing 12 of {allApps.length} apps. Use "Manage Apps" button for full control.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading state for apps */}
                  {loadingAllApps && (
                    <div className="mt-4">
                      <div className="flex items-center text-sm text-gray-400 mb-2">
                        <div className="w-4 h-4 border border-gray-600 border-t-gray-400 rounded-full animate-spin mr-2"></div>
                        Loading apps...
                      </div>
                    </div>
                   )}
                 </div>

               </div>

               {/* Actions Column */}
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
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg flex items-center transition-colors"
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
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

       {/* Bulk Operations Bar */}
       {selectedUsers.size > 0 && (
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl p-4 z-40 min-w-[600px]">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <CheckSquare className="h-5 w-5 text-primary-500" />
                 <span className="text-white font-medium">
                   {selectedUsers.size} selected
                 </span>
               </div>

               <div className="h-6 w-px bg-gray-600" />

               <div className="flex flex-wrap gap-2">
                 <button
                   onClick={() => setShowBulkConfirmModal({ show: true, operation: 'activate' })}
                   disabled={bulkOperationInProgress}
                   className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 text-white text-sm rounded-lg transition-colors flex items-center"
                 >
                   <Shield className="h-4 w-4 mr-1" />
                   Activate
                 </button>
                 <button
                   onClick={() => setShowBulkConfirmModal({ show: true, operation: 'deactivate' })}
                   disabled={bulkOperationInProgress}
                   className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white text-sm rounded-lg transition-colors flex items-center"
                 >
                   <Shield className="h-4 w-4 mr-1" />
                   Deactivate
                 </button>
                 <button
                   onClick={() => setShowBulkConfirmModal({ show: true, operation: 'grantAll' })}
                   disabled={bulkOperationInProgress}
                   className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 text-white text-sm rounded-lg transition-colors flex items-center"
                 >
                   <Package className="h-4 w-4 mr-1" />
                   Grant All Apps
                 </button>

                 {/* Bundle Dropdown */}
                 <div className="relative group">
                   <button
                     disabled={bulkOperationInProgress}
                     className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 text-white text-sm rounded-lg transition-colors flex items-center"
                   >
                     <FolderOpen className="h-4 w-4 mr-1" />
                     Grant Bundle
                     <ChevronDown className="h-4 w-4 ml-1" />
                   </button>

                   {/* Dropdown menu */}
                   <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-80 overflow-y-auto">
                     {bundles.map((bundle) => (
                       <button
                         key={bundle.id}
                         onClick={() => setShowBulkConfirmModal({ show: true, operation: 'grantBundle', bundleId: bundle.id })}
                         className="w-full flex items-start p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                       >
                         <span className="text-lg mr-2">{bundleIcons[bundle.category]?.icon || '📦'}</span>
                         <div className="flex-1 min-w-0 text-left">
                           <div className="text-sm font-medium text-white truncate">
                             {bundle.name}
                           </div>
                           <div className="text-xs text-gray-400">
                             {bundle.apps.length} apps
                           </div>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>

                 <button
                   onClick={() => setShowBulkConfirmModal({ show: true, operation: 'revokeAll' })}
                   disabled={bulkOperationInProgress}
                   className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-900/50 text-white text-sm rounded-lg transition-colors flex items-center"
                 >
                   <Trash2 className="h-4 w-4 mr-1" />
                   Revoke All
                 </button>
               </div>
             </div>

             <button
               onClick={() => setSelectedUsers(new Set())}
               disabled={bulkOperationInProgress}
               className="text-gray-400 hover:text-white transition-colors"
             >
               <X className="h-5 w-5" />
             </button>
           </div>
         </div>
       )}

       {/* Bulk Confirmation Modal */}
       {showBulkConfirmModal.show && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
           <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
             <div className="flex items-center mb-4">
               <div className="flex-shrink-0">
                 <AlertTriangle className="h-6 w-6 text-yellow-500" />
               </div>
               <h3 className="text-lg font-medium text-white ml-3">
                 Confirm Bulk Operation
               </h3>
             </div>

             <p className="text-gray-300 mb-2">
               You are about to perform a bulk operation on <span className="font-semibold text-white">{selectedUsers.size} users</span>.
             </p>

             <div className="bg-gray-900/50 rounded-lg p-3 mb-6">
               <div className="text-sm text-gray-300">
                 Operation:{' '}
                 <span className="font-semibold text-white">
                   {showBulkConfirmModal.operation === 'activate' && 'Activate Users'}
                   {showBulkConfirmModal.operation === 'deactivate' && 'Deactivate Users'}
                   {showBulkConfirmModal.operation === 'grantAll' && 'Grant All Apps'}
                   {showBulkConfirmModal.operation === 'grantBundle' && bundles.find(b => b.id === showBulkConfirmModal.bundleId)?.name}
                   {showBulkConfirmModal.operation === 'revokeAll' && 'Revoke All Access'}
                 </span>
               </div>
               {showBulkConfirmModal.operation === 'grantBundle' && (
                 <div className="text-xs text-gray-400 mt-1">
                   Will grant {bundles.find(b => b.id === showBulkConfirmModal.bundleId)?.apps.length} apps from the selected bundle
                 </div>
               )}
             </div>

             <p className="text-sm text-gray-400 mb-6">
               This action cannot be undone. Are you sure you want to continue?
             </p>

             <div className="flex space-x-3">
               <button
                 onClick={() => setShowBulkConfirmModal({ show: false, operation: null })}
                 disabled={bulkOperationInProgress}
                 className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
               >
                 Cancel
               </button>
               <button
                 onClick={() => {
                   if (showBulkConfirmModal.operation) {
                     executeBulkOperation(showBulkConfirmModal.operation, showBulkConfirmModal.bundleId);
                   }
                 }}
                 disabled={bulkOperationInProgress}
                 className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
               >
                 {bulkOperationInProgress ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Processing...
                   </>
                 ) : (
                   'Confirm'
                 )}
               </button>
             </div>
           </div>
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
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
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
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-sm text-gray-300">
                       Select apps to grant access (<span className="font-semibold text-primary-400">{userAppAccess.length}</span> of {availableApps.length} apps)
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

                 {/* Search Bar */}
                 <div className="mb-4">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input
                       type="text"
                       value={appSearchQuery}
                       onChange={(e) => setAppSearchQuery(e.target.value)}
                       placeholder="Search apps by name or category..."
                       className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     />
                     {appSearchQuery && (
                       <button
                         onClick={() => setAppSearchQuery('')}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                       >
                         <X className="h-4 w-4" />
                       </button>
                     )}
                   </div>
                 </div>

                 {/* Apps grouped by category with "Grant All in Category" */}
                 <div>
                   {Object.entries(appsGroupedByCategory).map(([category, apps]) => {
                     const bundle = bundles.find(b => b.category === category);
                     const categoryAppSlugs = apps.map(app => app.slug);
                     const allSelected = categoryAppSlugs.every(slug => userAppAccess.includes(slug));
                     const someSelected = categoryAppSlugs.some(slug => userAppAccess.includes(slug));

                     return (
                       <div key={category} className="mb-6">
                         <div className="flex items-center justify-between pb-2 border-b border-gray-700 mb-3">
                           <div className="flex items-center gap-2">
                             {bundle && (
                               <span className="text-lg" title={bundle.name}>
                                 {bundleIcons[category]?.icon || '📦'}
                               </span>
                             )}
                             <h4 className="text-sm font-semibold text-gray-200 capitalize">
                               {category.replace(/-/g, " ")}
                             </h4>
                             {bundle && (
                               <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700 rounded-full">
                                 {bundle.apps.length} apps
                               </span>
                             )}
                           </div>
                           <button
                             onClick={() => {
                               if (allSelected) {
                                 setUserAppAccess(prev => prev.filter(slug => !categoryAppSlugs.includes(slug)));
                               } else {
                                 setUserAppAccess(prev => {
                                   const newSet = new Set(prev);
                                   categoryAppSlugs.forEach(slug => newSet.add(slug));
                                   return Array.from(newSet);
                                 });
                               }
                             }}
                             className={`text-xs px-3 py-1 rounded transition-colors flex items-center ${
                               allSelected
                                 ? 'bg-green-600 hover:bg-green-700 text-white'
                                 : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                             }`}
                           >
                             {allSelected ? (
                               <>
                                 <CheckSquare className="h-3 w-3 mr-1" />
                                 All Selected
                               </>
                             ) : (
                               <>
                                 <Square className="h-3 w-3 mr-1" />
                                 Select All
                               </>
                             )}
                           </button>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {apps.map((app) => {
                             const hasAccess = userAppAccess.includes(app.slug);
                             const bundleForApp = getBundleForApp(app.slug);
                             return (
                               <button
                                 key={app.slug}
                                 onClick={() => toggleAppAccess(app.slug)}
                                 className={`p-3 rounded-lg text-left transition-all border-2 ${
                                   hasAccess
                                     ? "bg-purple-600/20 border-purple-500 text-white"
                                     : "bg-gray-700 border-transparent text-gray-300 hover:bg-gray-600"
                                 }`}
                                 title={bundleForApp ? `Part of: ${bundleForApp.name}` : undefined}
                               >
                                 <div className="flex items-center justify-between">
                                   <div className="flex-1 min-w-0">
                                     <div className="text-sm font-medium truncate">
                                       {app.name}
                                     </div>
                                     <div className="text-xs text-gray-400 truncate mt-0.5">
                                       {app.category.replace(/-/g, ' ')}
                                     </div>
                                   </div>
                                   {hasAccess && (
                                     <CheckSquare className="h-4 w-4 text-purple-400 flex-shrink-0 ml-2" />
                                   )}
                                 </div>
                               </button>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })}
                 </div>

                 {filteredAvailableApps.length === 0 && (
                   <div className="text-center py-10 text-gray-400">
                     No apps found matching "{appSearchQuery}"
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
                        className="text-xs px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
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
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
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
