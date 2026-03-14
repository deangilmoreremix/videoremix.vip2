import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Eye,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface CSVPreviewData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  uniqueProducts: string[];
  uniqueCampaigns: string[];
}

interface ImportResult {
  success: boolean;
  importId?: string;
  message: string;
  stats?: {
    totalRows: number;
    newProducts: number;
    newUsers: number;
  };
}

const AdminCSVImport: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importName, setImportName] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): CSVPreviewData => {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());

    const rows = lines.slice(1, Math.min(101, lines.length)).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    const uniqueProducts = new Set<string>();
    const uniqueCampaigns = new Set<string>();

    rows.forEach((row) => {
      if (row["Product"]) uniqueProducts.add(row["Product"]);
      if (row["Campaign"]) uniqueCampaigns.add(row["Campaign"]);
    });

    return {
      headers,
      rows,
      totalRows: lines.length - 1,
      uniqueProducts: Array.from(uniqueProducts),
      uniqueCampaigns: Array.from(uniqueCampaigns),
    };
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileSelect(file);
    } else {
      setError("Please upload a CSV file");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setImportName(file.name.replace(".csv", ""));

    try {
      const text = await file.text();
      const preview = parseCSV(text);
      setPreviewData(preview);
    } catch (err) {
      setError("Failed to parse CSV file. Please check the format.");
      console.error("CSV parse error:", err);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData || !importName.trim()) {
      setError("Please provide an import name");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const text = await selectedFile.text();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-csv-import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            importName: importName.trim(),
            filename: selectedFile.name,
            fileSize: selectedFile.size,
            csvContent: text,
            headers: previewData.headers,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setImportResult({
          success: true,
          importId: result.data.importId,
          message: "CSV imported successfully!",
          stats: result.data.stats,
        });

        setSelectedFile(null);
        setPreviewData(null);
        setImportName("");
      } else {
        throw new Error(result.error || "Import failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to import CSV");
      setImportResult({
        success: false,
        message: err.message || "Import failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportName("");
    setError(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">CSV Import</h2>
          <p className="text-gray-400 mt-1">
            Upload CSV files containing user purchase data
          </p>
        </div>
      </div>

      {importResult && (
        <div
          className={`p-4 rounded-lg border ${
            importResult.success
              ? "bg-green-500/10 border-green-500/50 text-green-400"
              : "bg-red-500/10 border-red-500/50 text-red-400"
          }`}
        >
          <div className="flex items-start">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">{importResult.message}</p>
              {importResult.stats && (
                <div className="mt-2 text-sm space-y-1">
                  <p>Total Rows: {importResult.stats.totalRows}</p>
                  <p>New Products: {importResult.stats.newProducts}</p>
                  <p>New Users: {importResult.stats.newUsers}</p>
                </div>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="ml-3">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-3">
              <X className="h-5 w-5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {!previewData ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-primary-500 bg-primary-500/10"
              : "border-gray-600 hover:border-gray-500"
          }`}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Drop your CSV file here
          </h3>
          <p className="text-gray-400 mb-4">or</p>
          <label className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors">
            <FileText className="h-5 w-5 mr-2" />
            Browse Files
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 mt-4">
            CSV format: Customer Name, Customer Email, Campaign, Product
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-400" />
                Import Preview
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Import Name
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="e.g., PayKickstart October 2025"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Total Rows</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {previewData.totalRows.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Unique Products</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {previewData.uniqueProducts.length}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Unique Campaigns</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {previewData.uniqueCampaigns.length}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Preview (First 100 rows)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {previewData.headers.map((header, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left text-gray-300 font-medium"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 10).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30"
                        >
                          {previewData.headers.map((header, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-3 text-gray-400"
                            >
                              {row[header] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.rows.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Showing 10 of {previewData.rows.length} preview rows
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || !importName.trim()}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
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

export default AdminCSVImport;
