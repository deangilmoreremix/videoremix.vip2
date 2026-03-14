import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface CSVImport {
  id: string;
  import_name: string;
  filename: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  unique_products_found: number;
  new_products_added: number;
  new_users_created: number;
  existing_users_updated: number;
  error_log: any[];
  import_summary: any;
  created_at: string;
  completed_at: string;
}

const AdminImportHistory: React.FC = () => {
  const [imports, setImports] = useState<CSVImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<CSVImport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("csv_imports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setImports(data);
    } catch (error) {
      console.error("Error loading imports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />;
      case "processing":
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: "bg-green-500/20 text-green-400",
      failed: "bg-red-500/20 text-red-400",
      processing: "bg-primary-500/20 text-primary-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      cancelled: "bg-gray-500/20 text-gray-400",
    };

    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return "-";
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const seconds = Math.floor((end - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleViewDetails = (importRecord: CSVImport) => {
    setSelectedImport(importRecord);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Import History</h2>
          <p className="text-gray-400 mt-1">
            View and manage all CSV import records
          </p>
        </div>
        <button
          onClick={loadImports}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Total Imports</p>
          <p className="text-2xl font-bold text-white mt-1">{imports.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {imports.filter((i) => i.status === "completed").length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {imports.filter((i) => i.status === "failed").length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Processing</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {imports.filter((i) => i.status === "processing").length}
          </p>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Import Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Rows
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Users
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {imports.map((importRecord) => (
                <tr
                  key={importRecord.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {importRecord.import_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {importRecord.filename}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        importRecord.status,
                      )}`}
                    >
                      {getStatusIcon(importRecord.status)}
                      <span className="ml-1.5 capitalize">
                        {importRecord.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-white">{importRecord.total_rows}</p>
                      {importRecord.status === "completed" && (
                        <p className="text-xs text-gray-400">
                          {importRecord.successful_rows} success,{" "}
                          {importRecord.failed_rows} failed
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-white">
                        {importRecord.unique_products_found}
                      </p>
                      <p className="text-xs text-green-400">
                        +{importRecord.new_products_added} new
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-green-400">
                        +{importRecord.new_users_created} new
                      </p>
                      <p className="text-xs text-blue-400">
                        {importRecord.existing_users_updated} updated
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {calculateDuration(
                      importRecord.created_at,
                      importRecord.completed_at,
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDate(importRecord.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(importRecord)}
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && selectedImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Import Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Import Name</p>
                    <p className="text-sm text-white mt-1">
                      {selectedImport.import_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Filename</p>
                    <p className="text-sm text-white mt-1">
                      {selectedImport.filename}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm text-white mt-1 capitalize">
                      {selectedImport.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Created At</p>
                    <p className="text-sm text-white mt-1">
                      {formatDate(selectedImport.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Import Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Total Rows</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {selectedImport.total_rows}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Successful Rows</p>
                    <p className="text-xl font-bold text-green-400 mt-1">
                      {selectedImport.successful_rows}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Failed Rows</p>
                    <p className="text-xl font-bold text-red-400 mt-1">
                      {selectedImport.failed_rows}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">New Products</p>
                    <p className="text-xl font-bold text-blue-400 mt-1">
                      {selectedImport.new_products_added}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">New Users</p>
                    <p className="text-xl font-bold text-green-400 mt-1">
                      {selectedImport.new_users_created}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Updated Users</p>
                    <p className="text-xl font-bold text-blue-400 mt-1">
                      {selectedImport.existing_users_updated}
                    </p>
                  </div>
                </div>
              </div>

              {selectedImport.error_log &&
                selectedImport.error_log.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Error Log ({selectedImport.error_log.length} errors)
                    </h4>
                    <div className="bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {selectedImport.error_log
                          .slice(0, 10)
                          .map((error: any, index: number) => (
                            <div
                              key={index}
                              className="text-xs bg-red-500/10 border border-red-500/30 rounded p-2"
                            >
                              <p className="text-red-400">
                                {error.message || JSON.stringify(error)}
                              </p>
                            </div>
                          ))}
                        {selectedImport.error_log.length > 10 && (
                          <p className="text-xs text-gray-400 text-center pt-2">
                            ... and {selectedImport.error_log.length - 10} more
                            errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImportHistory;
