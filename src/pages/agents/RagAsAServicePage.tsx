import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { Loader2, Sparkles } from "lucide-react";

const RagAsAServicePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ openai_api_key: "", enter_document_url: "", document_name_optional: "", upload_mode: "", enter_your_query: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-knowledgebase-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>RagAsAService - VideoRemix.vip</title>
        <meta name="description" content="Use business-knowledgebase-ai to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Rag As A Service</h1>
            <p className="text-xl text-gray-400">AI-powered rag as a service.</p>
          </motion.div>

          {error && <ErrorMessage title="Generation Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {loading && <LoadingIndicator message="Processing..." subtext="Running RAG service" />}

          {!loading && !result && (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Input</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="API Configuration" description="Enter your OpenAI API key">
                    <ApiKeyInput label="OpenAI API Key" name="openai_api_key" value={formData.openai_api_key} onChange={(v) => setFormData({ ...formData, openai_api_key: v })} required helperText="Get your API key from OpenAI Platform" />
                  </FormSection>

                  <FormSection title="Document" description="Provide document details">
                    <SmartInput label="Enter document URL" name="enter_document_url" value={formData.enter_document_url} onChange={(v) => setFormData({ ...formData, enter_document_url: v })} placeholder="" required />
                    <SmartInput label="Document name (optional)" name="document_name_optional" value={formData.document_name_optional} onChange={(v) => setFormData({ ...formData, document_name_optional: v })} placeholder="" />
                    <SmartInput label="Upload mode" name="upload_mode" value={formData.upload_mode} onChange={(v) => setFormData({ ...formData, upload_mode: v })} placeholder="" required />
                  </FormSection>

                  <FormSection title="Query" description="Enter your query">
                    <SmartTextarea label="Enter your query" name="enter_your_query" value={formData.enter_your_query} onChange={(v) => setFormData({ ...formData, enter_your_query: v })} placeholder="" required />
                  </FormSection>

                  <ActionButton type="submit" loading={loading} className="w-full">
                    Generate Results
                  </ActionButton>
                </form>
              </CardContent>
            </Card>
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultCard title="Results" variant="success">
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Transcript</Label>
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{result.result}</pre>
                  </div>
                </div>
              </ResultCard>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

 export default RagAsAServicePage;
