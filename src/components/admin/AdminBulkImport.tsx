import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Download, Eye } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface ParsedRow {
  NO: string;
  DATE: string;
  'PRODUCT NAME': string;
  AMOUNT: string;
  'PAYMENT TYPE': string;
  'PAYMENT STATUS': string;
  'BUYER COUNTRY': string;
  'CUSTOMER NAME': string;
  'TOTAL AMOUNT': string;
  'ZAXAA TXN ID': string;
  'PAYPAL TXN ID': string;
  CURRENCY: string;
  'PAYMENT PROCESSOR': string;
  'CUSTOMER EMAIL': string;
  'PAYPAL PREAPPROVAL KEY': string;
  'START FROM': string;
  'RECURRING PERIOD': string;
  [key: string]: string;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  usersCreated: number;
  usersExisting: number;
  accessGranted: number;
  errors: string[];
  details: Array<{
    row: string;
    email?: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
    error?: string;
    userId?: string;
    userCreated?: boolean;
    appsGranted?: number;
    productName?: string;
  }>;
}

interface AdminBulkImportProps {
  onComplete?: () => void;
}

const AdminBulkImport: React.FC<AdminBulkImportProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(file);
    setError(null);
    setResult(null);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          setError('CSV file appears to be empty');
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const rows: ParsedRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < headers.length) continue;

          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }

        setParsedData(rows);
        setShowPreview(true);
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
        console.error('CSV parse error:', err);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    if (!parsedData.length) {
      setError('No data to import');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('Authentication required. Please log in again.');
        return;
      }
      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-personalizer-purchases`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: parsedData }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const importResult = await response.json();
      setResult(importResult);
      setShowPreview(false);

      if (onComplete && importResult.successful > 0) {
        onComplete();
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setShowPreview(false);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = `NO,DATE,PRODUCT NAME,AMOUNT,PAYMENT TYPE,PAYMENT STATUS,BUYER COUNTRY,CUSTOMER NAME,VAT %,VAT AMOUNT,TOTAL AMOUNT,ZAXAA TXN ID,PAYPAL TXN ID,CURRENCY,PAYMENT PROCESSOR,CUSTOMER EMAIL,CUSTOMER PAYPAL EMAIL,CUSTOMER IP ADDRESS,AFFILIATE NAME,AFFILIATE EMAIL,AFFILIATE PAYPAL EMAIL,DISCOUNT,COUPON CODE,PAYMENT ID,PAYPAL PREAPPROVAL KEY,START FROM,TRIAL DURATION,TRIAL PRICE,RECURRING PERIOD,RECURRING TIMES,ZAXAA FEE,AFFILIATE COMMISSIONS,PARTNER #1 NAME,PARTNER #1 EMAIL,PARTNER #1 PAYPAL EMAIL,PARTNER #1 RECEIVED,PARTNER #2 NAME,PARTNER #2 EMAIL,PARTNER #2 PAYPAL EMAIL,PARTNER #2 RECEIVED,PARTNER #3 NAME,PARTNER #3 EMAIL,PARTNER #3 PAYPAL EMAIL,PARTNER #3 RECEIVED,CUSTOM INFO 1,CUSTOM INFO 2,CUSTOM INFO 3,CUSTOM INFO 4,CUSTOM INFO 5,FIRST NAME,LAST NAME,ADDRESS,COUNTRY,CITY,STATE/PROVINCE,ZIP CODE,PHONE NUMBER,GDPR COMPLIANCE ENABLED,GDPR CHECKBOX REQUIRED,GDPR CHECKBOX TICKED
1.,"Nov 15, 2024 17:25 PM ET","Personalizer AI Agency (Lifetime)",$499.00,"One Time","Completed ","United States","John Doe",0.00%,$0.00,$499.00,ABC123DEF456,1234567890ABCDEF,USD,stripe,john@example.com,john@example.com,192.168.1.1,-,-,-,0.00,-,AP-1234567890,-,-,0.00,-,0,0.00,0.00,-,-,-,0.00,-,-,-,0.00,-,-,-,0.00,-,-,-,-,-,-,-,-,-,-,-,-,-,Yes,No,No`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!result) return;

    const failedRows = result.details.filter(d => d.status === 'failed');
    const csvContent = [
      'Row,Email,Error',
      ...failedRows.map(row =>
        `${row.row},"${row.email || 'N/A'}","${row.error || row.reason || 'Unknown error'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
            Import Complete
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Rows</p>
              <p className="text-2xl font-bold text-white">{result.total}</p>
            </div>
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/30">
              <p className="text-sm text-green-400">Successful</p>
              <p className="text-2xl font-bold text-green-400">{result.successful}</p>
            </div>
            <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700/30">
              <p className="text-sm text-yellow-400">Skipped</p>
              <p className="text-2xl font-bold text-yellow-400">{result.skipped}</p>
            </div>
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/30">
              <p className="text-sm text-red-400">Failed</p>
              <p className="text-2xl font-bold text-red-400">{result.failed}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/30">
              <p className="text-sm text-blue-400">New Users Created</p>
              <p className="text-2xl font-bold text-blue-400">{result.usersCreated || 0}</p>
            </div>
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-700/30">
              <p className="text-sm text-purple-400">Existing Users</p>
              <p className="text-2xl font-bold text-purple-400">{result.usersExisting || 0}</p>
            </div>
            <div className="bg-cyan-900/30 p-4 rounded-lg border border-cyan-700/30">
              <p className="text-sm text-cyan-400">App Access Granted</p>
              <p className="text-2xl font-bold text-cyan-400">{result.accessGranted || 0}</p>
            </div>
          </div>

          {result.failed > 0 && (
            <div className="mb-4">
              <button
                onClick={downloadErrorReport}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </button>
            </div>
          )}

          <button
            onClick={reset}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Import Another File
          </button>
        </motion.div>
      )}

      {!result && !showPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Bulk Import</h3>
              <p className="text-gray-400">Upload a CSV file to import users and purchases</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 bg-gray-800/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
              id="file-upload"
            />

            {!file ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    Click to upload
                  </label>
                  <span className="text-gray-400"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500">CSV files up to 10MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-700 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPreview && parsedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-primary-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Preview Data</h3>
                <p className="text-sm text-gray-400">
                  {parsedData.length} rows found (showing first 10)
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={reset}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {parsedData.length} Rows
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {parsedData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-sm text-white">{row.NO}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{row['CUSTOMER EMAIL']}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{row['PRODUCT NAME']}</td>
                      <td className="px-4 py-3 text-sm text-green-400">{row.AMOUNT}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          row['PAYMENT STATUS'].toLowerCase().includes('completed')
                            ? 'bg-green-500/20 text-green-400'
                            : row['PAYMENT STATUS'].toLowerCase().includes('pending')
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {row['PAYMENT STATUS']}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{row.DATE}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminBulkImport;
