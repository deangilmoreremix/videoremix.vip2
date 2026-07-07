import React, { useState, useEffect } from "react";
import { Shield, Key, Users, Save, X } from "lucide-react";
import { supabase } from "../../utils/supabase";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count?: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: "read:apps", name: "Read Apps", description: "View and run AI apps", category: "Apps" },
  { id: "write:apps", name: "Write Apps", description: "Modify app configurations", category: "Apps" },
  { id: "manage:users", name: "Manage Users", description: "Create, delete, modify users", category: "Users" },
  { id: "manage:roles", name: "Manage Roles", description: "Create and modify roles", category: "Access" },
  { id: "view:billing", name: "View Billing", description: "View subscription and payment info", category: "Billing" },
  { id: "manage:billing", name: "Manage Billing", description: "Modify subscriptions and pricing", category: "Billing" },
  { id: "view:analytics", name: "View Analytics", description: "Access analytics dashboards", category: "Analytics" },
  { id: "manage:apps:access", name: "Manage App Access", description: "Grant/revoke app access", category: "Apps" },
];

const PREDEFINED_ROLES: Role[] = [
  {
    id: "user",
    name: "User",
    description: "Standard user with basic app access",
    permissions: ["read:apps"],
  },
  {
    id: "admin",
    name: "Admin",
    description: "Full access to manage users, apps, and settings",
    permissions: ["read:apps", "write:apps", "manage:users", "manage:apps:access", "view:billing", "view:analytics"],
  },
  {
    id: "super_admin",
    name: "Super Admin",
    description: "System administrator with all permissions",
    permissions: ["read:apps", "write:apps", "manage:users", "manage:roles", "manage:apps:access", "view:billing", "manage:billing", "view:analytics"],
  },
];

export const AdminRolesManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError("Authentication required");
        return;
      }

      const token = session.access_token;

      // For now, use the predefined roles and fetch user counts
      const rolesWithCounts = await Promise.all(
        PREDEFINED_ROLES.map(async (role) => {
          const { count, error } = await supabase
            .from("user_roles")
            .select("user_id", { count: "exact" })
            .eq("role", role.id);
          
          return {
            ...role,
            user_count: error ? 0 : count || 0,
          };
        })
      );

      setRoles(rolesWithCounts);
    } catch (err) {
      console.error("Error fetching roles:", err);
      // Fall back to predefined roles
      setRoles(PREDEFINED_ROLES.map(r => ({ ...r, user_count: 0 })));
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (!editingRole) return;
    
    const newPermissions = editingRole.permissions.includes(permissionId)
      ? editingRole.permissions.filter(p => p !== permissionId)
      : [...editingRole.permissions, permissionId];
    
    setEditingRole({ ...editingRole, permissions: newPermissions });
  };

  const handleSaveRole = async (role: Role) => {
    setSaving(role.id);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError("Authentication required");
        return;
      }

      const token = session.access_token;

      // For predefined roles, we update the user_roles table
      // This is a simplified approach - in production you'd have a roles table
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-roles`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_id: role.id,
            permissions: role.permissions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save role: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Role "${role.name}" updated successfully`);
        fetchRoles();
      } else {
        setError(data.error || "Failed to save role");
      }
    } catch (err: any) {
      console.error("Error saving role:", err);
      setError(err.message || "Failed to save role");
    } finally {
      setSaving(null);
    }
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Role-Based Access Control</h2>
        <p className="text-gray-400">
          Manage roles and their permissions. Changes affect all users with that role.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                    <p className="text-sm text-gray-400">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {role.user_count || 0} users
                  </span>
                  <button
                    onClick={() => setEditingRole(role)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Edit Permissions
                  </button>
                </div>
              </div>

              {/* Current Permissions Preview */}
              <div className="flex flex-wrap gap-1 mb-4">
                {role.permissions.slice(0, 6).map((perm) => {
                  const permission = AVAILABLE_PERMISSIONS.find(p => p.id === perm);
                  return (
                    <span
                      key={perm}
                      className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                      title={permission?.description || perm}
                    >
                      {permission?.name || perm}
                    </span>
                  );
                })}
                {role.permissions.length > 6 && (
                  <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                    +{role.permissions.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Edit Role: {editingRole.name}</h3>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-400 mb-6">
                Select the permissions this role should have. Users will immediately inherit these permissions.
              </p>

              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 capitalize">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {permissions.map((perm) => {
                        const isSelected = editingRole.permissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-primary-500 bg-primary-950/20"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handlePermissionToggle(perm.id)}
                              className="mt-0.5"
                            />
                            <div>
                              <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                                {perm.name}
                              </p>
                              <p className="text-xs text-gray-500">{perm.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setEditingRole(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveRole(editingRole)}
                  disabled={saving === editingRole.id}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving === editingRole.id ? (
                    <>
                      <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Role
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};