import React, { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "../../ui/button";

interface BasicFileUploadProps {
  label: string;
  accept?: string;
  onFileSelect: (file: File | null, content?: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export const BasicFileUpload: React.FC<BasicFileUploadProps> = ({
  label,
  accept = ".txt,.pdf,.csv,.md",
  onFileSelect,
  disabled = false,
  maxSizeMB = 5,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selected: File) => {
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large (max ${maxSizeMB}MB)`);
      return;
    }
    setError("");
    setFile(selected);

    // For text files, read content
    if (selected.type.startsWith("text/") || selected.name.match(/\.(txt|md|csv)$/i)) {
      const text = await selected.text();
      onFileSelect(selected, text.slice(0, 10000)); // cap content
    } else {
      onFileSelect(selected);
    }
  };

  const clear = () => {
    setFile(null);
    setError("");
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-black/50 py-8 hover:border-primary-600"
        >
          <Upload className="h-8 w-8 text-gray-500 mb-2" />
          <p className="text-sm text-gray-400">Click to upload or drag & drop</p>
          <p className="text-xs text-gray-500 mt-1">{accept} • up to {maxSizeMB}MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-black p-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary-400" />
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[240px]">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clear} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};
