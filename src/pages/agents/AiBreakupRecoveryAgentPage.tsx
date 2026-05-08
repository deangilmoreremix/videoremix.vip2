import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { Loader2, Heart, Upload, FileText, X } from "lucide-react";

const AiBreakupRecoveryAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ 
    enter_your_gemini_api_key: "", 
    how_are_you_feeling_what_happened: "", 
    upload_screenshots_of_your_chats_optional: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-breakup-recovery-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-breakup-recovery-state', JSON.stringify({ ...formData }));
  }, [formData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a file');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('enter_your_gemini_api_key', formData.enter_your_gemini_api_key);
      formDataToSend.append('how_are_you_feeling_what_happened', formData.how_are_you_feeling_what_happened);
      formDataToSend.append('upload_screenshots_of_your_chats_optional', formData.upload_screenshots_of_your_chats_optional);
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-breakup-recovery-agent`, {
        method: 'POST',
        body: formDataToSend
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      localStorage.removeItem('ai-breakup-recovery-state');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiBreakupRecoveryAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-breakup-recovery-agent for emotional support during relationship changes." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Breakup Recovery Agent</h1>
            <p className="text-xl text-gray-400">AI-powered emotional support and guidance.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Share Your Story</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Upload" description="Upload a file to analyze">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      Upload File <span className="text-red-500">*</span>
                    </label>
                    {file ? (
                      <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button type="button" onClick={clearFile} className="text-gray-400 hover:text-white">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-gray-300">Click to select a file</p>
                        <p className="text-xs text-gray-500 mt-2">PDF, TXT, DOCX supported</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.docx" />
                  </div>
                </FormSection>

                <FormSection title="API Configuration" description="Enter your Gemini API key">
                  <ApiKeyInput
                    label="Gemini API Key"
                    name="enter_your_gemini_api_key"
                    value={formData.enter_your_gemini_api_key}
                    onChange={(val) => setFormData({ ...formData, enter_your_gemini_api_key: val })}
                    placeholder="AIza..."
                    helperText="Get your API key from Google AI Studio"
                    required
                  />
                </FormSection>

                <FormSection title="Your Experience" description="Share what happened so we can help">
                  <SmartTextarea
                    label="How are you feeling? What happened?"
                    name="how_are_you_feeling_what_happened"
                    value={formData.how_are_you_feeling_what_happened}
                    onChange={(val) => setFormData({ ...formData, how_are_you_feeling_what_happened: val })}
                    placeholder="I recently went through a breakup and I'm feeling lost. We were together for 2 years and I'm struggling to move on."
                    helperText="It's okay to share as much or as little as you'd like"
                    rows={4}
                    required
                  />

                  <SmartTextarea
                    label="Screenshots of chats (optional)"
                    name="upload_screenshots_of_your_chats_optional"
                    value={formData.upload_screenshots_of_your_chats_optional}
                    onChange={(val) => setFormData({ ...formData, upload_screenshots_of_your_chats_optional: val })}
                    placeholder="URLs to screenshots or describe the conversations..."
                    helperText="Optional context that might help provide better guidance"
                    rows={3}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading || !file} size="lg" className="w-full">
                  <Heart className="h-4 w-4" />
                  Get Support
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Processing..." 
              subtext="We're here for you"
            />
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<Heart className="h-5 w-5" />}
                title="Support Response"
                description={typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                variant="success"
              />

              <EmptyState
                icon={<Heart className="h-16 w-16 text-gray-600" />}
                title="Thank you for sharing"
                description="Remember, this is just one step in your journey. You're not alone."
                action={
                  <ActionButton onClick={() => { setResult(null); setFile(null); setFormData({ enter_your_gemini_api_key: "", how_are_you_feeling_what_happened: "", upload_screenshots_of_your_chats_optional: "" }); }}>
                    Share More
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Heart className="h-16 w-16 text-gray-600" />}
              title="We're Here For You"
              description="Share what you're going through and let AI provide supportive guidance."
              tips={[
                "Take your time - there's no rush",
                "Share as much context as you're comfortable with",
                "This is a safe space to express yourself",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiBreakupRecoveryAgentPage;