import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
} from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  platform: string;
  platform_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  user_email?: string;
  user_name?: string;
  app_access_count?: number;
}

export const AdminSubscriptionsManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [runningCheck, setRunningCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [filterStatus]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("subscription_status")
        .select(
          `
          *,
          purchases!inner(user_id, email),
          user_app_access(app_slug)
        `,
        )
        .order("current_period_end", { ascending: true });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const enrichedData =
        data?.map((sub: any) => ({
          ...sub,
          user_email: sub.purchases?.email,
          app_access_count: sub.user_app_access?.length || 0,
        })) || [];

      setSubscriptions(enrichedData);
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runExpirationCheck = async () => {
    try {
      setRunningCheck(true);
      setCheckResult(null);

      const { data, error: checkError } = await supabase.rpc(
        "check_and_revoke_expired_subscriptions",
      );

      if (checkError) throw checkError;

      setCheckResult(data?.[0] || null);
      await fetchSubscriptions();
    } catch (err: any) {
      console.error("Error running expiration check:", err);
      setError(err.message);
    } finally {
      setRunningCheck(false);
    }
  };

  const restoreAccess = async (userId: string, appSlug: string) => {
    try {
      const { error: restoreError } = await supabase.rpc(
        "restore_subscription_access",
        {
          p_user_id: userId,
          p_app_slug: appSlug,
        },
      );

      if (restoreError) throw restoreError;

      alert("Access restored successfully");
      await fetchSubscriptions();
    } catch (err: any) {
      console.error("Error restoring access:", err);
      alert(`Failed to restore access: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "payment_failed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
      case "expired":
        return <XCircle className="w-4 h-4" />;
      case "payment_failed":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    searchEmail
      ? sub.user_email?.toLowerCase().includes(searchEmail.toLowerCase())
      : true,
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Subscription Management
        </h2>
        <button
          onClick={runExpirationCheck}
          disabled={runningCheck}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${runningCheck ? "animate-spin" : ""}`}
          />
          {runningCheck ? "Checking..." : "Run Expiration Check"}
        </button>
      </div>

      {checkResult && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Check Results
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-800">Revoked: </span>
              <span className="font-semibold text-blue-900">
                {checkResult.revoked_count}
              </span>
            </div>
            <div>
              <span className="text-blue-800">In Grace Period: </span>
              <span className="font-semibold text-blue-900">
                {checkResult.grace_period_count}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((sub) => {
                const isExpiringSoon =
                  new Date(sub.current_period_end) <
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sub.user_email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sub.user_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {sub.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          sub.status,
                        )}`}
                      >
                        {getStatusIcon(sub.status)}
                        <span className="ml-1 capitalize">{sub.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span
                          className={`text-sm ${isExpiringSoon ? "text-red-600 font-medium" : "text-gray-900"}`}
                        >
                          {formatDate(sub.current_period_end)}
                        </span>
                      </div>
                      {sub.cancel_at_period_end && (
                        <span className="text-xs text-gray-500">
                          Will cancel
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {sub.app_access_count} apps
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sub.status === "payment_failed" && (
                        <button
                          onClick={() => restoreAccess(sub.user_id, "all")}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No subscriptions found</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">
          Grace Period Information
        </h3>
        <p className="text-sm text-yellow-800">
          Failed payments have a 3-day grace period before access is
          automatically revoked. The automated check runs daily at 2 AM UTC, or
          you can run it manually using the button above.
        </p>
      </div>
    </div>
  );
};

export default AdminSubscriptionsManagement;
