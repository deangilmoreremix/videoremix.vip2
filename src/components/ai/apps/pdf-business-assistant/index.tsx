/**
 * PDF Business Assistant — Production UI with Full RAG Features
 * New VideoRemix Name: PDF Business Assistant
 * Upload PDFs, chat with documents, extract insights using OpenAI Responses API
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Play, Loader2, FileText, Upload, X, FileSearch, Sparkles } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

type AnalysisType = "summary" | "key-points" | "qa" | "full-analysis" | "compare" | "extract-data";
type OutputFormat = "text" | "json" | "table" | "markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function PDFBusinessAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  // Core state
  const [pdfText, setPdfText] = useState("");
  const [query, setQuery] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("summary");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("text");
  
  // File handling
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Chat history for conversational interface
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  
  // Options
  const [includeCitations, setIncludeCitations] = useState(true);
  const [pageRange, setPageRange] = useState<string>("all");
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { run, isRunning, output, error, reset, isStreaming, streamingContent } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const analysisTypes: { value: AnalysisType; label: string; description: string }[] = [
    { value: "summary", label: "Quick Summary", description: "Get a concise overview of the document" },
    { value: "key-points", label: "Key Points", description: "Extract the most important findings" },
    { value: "qa", label: "Q&A Mode", description: "Ask specific questions about the content" },
    { value: "full-analysis", label: "Deep Analysis", description: "Comprehensive analysis with insights" },
    { value: "compare", label: "Compare Sections", description: "Compare different parts of the document" },
    { value: "extract-data", label: "Extract Data", description: "Pull out structured data and facts" },
  ];

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setUploadProgress(10);

    try {
      // For now, we'll read text files directly
      // For PDFs, we need a PDF parsing library
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setPdfText(text);
        setUploadProgress(100);
      } else if (file.name.endsWith(".md")) {
        const text = await file.text();
        setPdfText(text);
        setUploadProgress(100);
      } else {
        // For actual PDFs, we'd need pdf-parse or similar
        // For now, show a prompt to convert PDF to text
        setPdfText(`[PDF upload detected: ${file.name}]\n\nPlease paste the extracted text from your PDF, or use a PDF-to-text converter first.`);
        setUploadProgress(50);
      }
    } catch (err) {
      console.error("File processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleRun = async () => {
    if (!pdfText.trim() && !query.trim()) return;

    // Add user message to chat
    if (showChat && query.trim()) {
      setMessages(prev => [...prev, { role: "user", content: query, timestamp: new Date() }]);
    }

    const inputs = {
      pdfContent: pdfText,
      query: query.trim(),
      analysisType,
      outputFormat,
      includeCitations,
      pageRange,
      chatHistory: showChat ? messages.map(m => `${m.role}: ${m.content}`).join("\n") : undefined,
      goal: `Perform ${analysisType} on the uploaded document`,
    };

    await run(inputs);

    // Add assistant response to chat
    if (showChat && output) {
      const responseText = typeof output === "string" 
        ? output 
        : JSON.stringify(output, null, 2);
      setMessages(prev => [...prev, { role: "assistant", content: responseText, timestamp: new Date() }]);
    }
  };

  const handleReset = () => {
    reset();
    setMessages([]);
    setPdfText("");
    setQuery("");
    setFileName(null);
  };

  const handleClearAll = () => {
    handleReset();
    setShowChat(false);
    setMessages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = () => {
    setFileName(null);
    setPdfText("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-600/20">
            <FileText className="h-7 w-7 text-primary-500" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{appName}</h2>
            <p className="text-sm text-gray-400">Upload PDF documents and get AI-powered insights</p>
          </div>
        </div>
        
        {/* Chat Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Chat Mode</span>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              showChat ? "bg-primary-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                showChat ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Upload & Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Area */}
          <div className="rounded-xl border-2 border-dashed border-gray-700 bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="font-medium">Upload Document</span>
              </div>
              
              {fileName && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-600/20 rounded-lg">
                  <FileText className="h-4 w-4 text-primary-400" />
                  <span className="text-sm text-primary-400">{fileName}</span>
                  <button onClick={removeFile} className="hover:text-red-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-8 border border-gray-700 rounded-lg hover:border-primary-500 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="text-gray-400">Processing document...</span>
                    <div className="w-48 h-1 bg-gray-800 rounded-full mt-2">
                      <div 
                        className="h-1 bg-primary-500 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <FileSearch className="h-8 w-8 text-gray-400" />
                    <span className="text-gray-400">Drop PDF here or click to upload</span>
                    <span className="text-xs text-gray-500">Supports PDF, TXT, MD files</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Document Content */}
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Document Content</Label>
              {pdfText && (
                <span className="text-xs text-gray-500">{pdfText.length.toLocaleString()} characters</span>
              )}
            </div>
            
            <textarea
              value={pdfText}
              onChange={(e) => setPdfText(e.target.value)}
              placeholder="Paste extracted PDF text here, or upload a .txt/.md file...&#10;&#10;For best results:&#10;• Copy text directly from your PDF&#10;• Use a PDF-to-text converter for better accuracy&#10;• Include page numbers if available"
              disabled={isRunning}
              className="w-full h-64 bg-black border border-gray-800 rounded-lg p-4 text-gray-200 placeholder-gray-600 resize-none focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Query Input - Chat Style or Standard */}
          {showChat ? (
            <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Chat about this document</Label>
                <span className="text-xs text-gray-500">{messages.length} messages</span>
              </div>
              
              {/* Chat Messages */}
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ask questions about the document</p>
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary-600 text-white"
                          : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isStreaming && streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm text-gray-400 whitespace-pre-wrap">{streamingContent}</p>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleRun()}
                  placeholder="Ask about the document..."
                  disabled={isRunning || !pdfText.trim()}
                  className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                />
                <Button
                  onClick={handleRun}
                  disabled={!query.trim() || isRunning || !pdfText.trim()}
                  className="bg-primary-600 hover:bg-primary-500"
                >
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
              <Label className="text-base font-medium mb-4 block">Your Query</Label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a specific question about the document, or describe what you want to extract..."
                disabled={isRunning}
                className="w-full h-24 bg-black border border-gray-800 rounded-lg p-4 text-gray-200 placeholder-gray-600 resize-none focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Analysis Type */}
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <h3 className="font-medium mb-4">Analysis Type</h3>
            <div className="space-y-2">
              {analysisTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    analysisType === type.value
                      ? "bg-primary-600/20 border border-primary-600"
                      : "hover:bg-gray-800/50 border border-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisType"
                    value={type.value}
                    checked={analysisType === type.value}
                    onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-gray-400">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Output Options */}
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <h3 className="font-medium mb-4">Output Options</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-400 mb-2 block">Output Format</Label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="text">Plain Text</option>
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="table">Table Format</option>
                </select>
              </div>

              <div>
                <Label className="text-sm text-gray-400 mb-2 block">Page Range</Label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g., 1-5, 10, all"
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCitations}
                  onChange={(e) => setIncludeCitations(e.target.checked)}
                  className="rounded border-gray-600"
                />
                <span className="text-sm">Include page citations</span>
              </label>
            </div>
          </div>

          {/* Run Button */}
          <Button
            onClick={handleRun}
            disabled={!pdfText.trim() || isRunning}
            className="w-full bg-primary-600 hover:bg-primary-500 py-6 text-lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Run PDF Analysis
              </>
            )}
          </Button>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="text-center text-sm text-primary-400">
              <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
              Streaming response...
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {output && !showChat && (
        <div className="space-y-6">
          <StructuredResult 
            result={output} 
            title="Analysis Results"
          />
          <ResultActions
            onNew={handleReset}
            newLabel="New Analysis"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}