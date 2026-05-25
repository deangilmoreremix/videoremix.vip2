import * as React from "react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, XCircle, FileText, AlertCircle, CheckCircle } from "lucide-react";

export interface FileUploadZoneProps {
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
  onFileSelect: (files: File | File[] | null) => void;
  selectedFile?: File | File[] | null;
  helperText?: string;
  error?: string;
}

export function FileUploadZone({
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  onFileSelect,
  selectedFile,
  helperText,
  error,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!accept.split(',').some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const [mainType] = type.split('/');
        return file.type.startsWith(mainType);
      }
      return file.type === type;
    })) {
      return `File type not allowed: ${file.type || file.name}`;
    }

    if (file.size > maxSize) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`;
    }

    return null;
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      onFileSelect(multiple ? [] : null);
      return;
    }

    const fileArray = Array.from(files);

    if (multiple) {
      const errors = fileArray.map(validateFile).filter(Boolean) as string[];
      if (errors.length > 0) {
        setRejectedReason(errors[0]);
        return;
      }
      onFileSelect(fileArray);
    } else {
      const error = validateFile(fileArray[0]);
      if (error) {
        setRejectedReason(error);
        return;
      }
      onFileSelect(fileArray[0]);
    }
    setRejectedReason(null);
  }, [onFileSelect, multiple, accept, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  }, [processFiles]);

  const clearSelection = useCallback(() => {
    onFileSelect(multiple ? [] : null);
    setRejectedReason(null);
  }, [onFileSelect, multiple]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-purple-400" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-8 w-8 text-blue-400" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-400" />;
    return <FileText className="h-8 w-8 text-gray-400" />;
  };

  // Single file preview
  if (selectedFile && !Array.isArray(selectedFile)) {
    return (
      <div className="space-y-2">
        <div className="relative group">
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getFileIcon(selectedFile)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="flex-shrink-0 p-2 hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Remove file"
              >
                <XCircle className="h-5 w-5 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview for images */}
        {selectedFile.type.startsWith('image/') && (
          <div className="mt-3">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="max-h-48 rounded-lg border border-gray-700"
              onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
            />
          </div>
        )}
      </div>
    );
  }

  // Multiple files preview
  if (multiple && Array.isArray(selectedFile) && selectedFile.length > 0) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedFile.map((file, idx) => (
            <motion.div
              key={`${file.name}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative p-3 bg-gray-900/50 border border-gray-700 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newFiles = selectedFile.filter((_, i) => i !== idx);
                    onFileSelect(newFiles);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-800 rounded"
                  aria-label={`Remove ${file.name}`}
                >
                  <XCircle className="h-4 w-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Dropzone
  return (
    <div className="space-y-2">
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-violet-500 bg-violet-500/10"
            : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/30",
          error && "border-red-500 hover:border-red-500"
        )}
        whileHover={{ scale: isDragging ? 1 : 1.002 }}
        whileTap={{ scale: 0.998 }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={`Upload ${multiple ? 'files' : 'file'}`}
        />

        <div className="flex flex-col items-center">
          <motion.div
            animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          </motion.div>

          <p className="text-sm font-medium text-gray-200 mb-1">
            {isDragging ? "Drop files here" : "Drop files here, or click to browse"}
          </p>

          <p className="text-xs text-gray-500">
            {accept === "*/*"
              ? "Any file type"
              : `Accepted: ${accept}`}
            {maxSize && ` • Max ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
            {multiple && " • Multiple files"}
          </p>
        </div>
      </motion.div>

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          {helperText}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Rejection reason */}
      {rejectedReason && !error && (
        <div className="flex items-center gap-1.5 text-sm text-yellow-400">
          <AlertCircle className="h-4 w-4" />
          {rejectedReason}
        </div>
      )}
    </div>
  );
}

// Helper icons
const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

export { FileUploadZone };
