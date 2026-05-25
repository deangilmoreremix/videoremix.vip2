import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Users, Briefcase, Mail, Video, Upload, FileText, CheckCircle2, UserPlus } from "lucide-react";

const STORAGE_KEY = 'ai-recruitment-agent-team';

const AiRecruitmentAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    openaiApiKey: '',
    zoomAccountId: '',
    zoomClientId: '',
    zoomClientSecret: '',
    senderEmail: '',
    emailAppPassword: '',
    companyName: '',
    roleToFill: '',
    resumePdf: '',
    candidate: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || {});
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, hasFile: !!file }));
  }, [formData, file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('openai_api_key', formData.openaiApiKey);
      formDataToSend.append('zoom_account_id', formData.zoomAccountId);
      formDataToSend.append('zoom_client_id', formData.zoomClientId);
      formDataToSend.append('zoom_client_secret', formData.zoomClientSecret);
      formDataToSend.append('sender_email', formData.senderEmail);
      formDataToSend.append('email_app_password', formData.emailAppPassword);
      formDataToSend.append('company_name', formData.companyName);
      formDataToSend.append('select_the_role_you', formData.roleToFill);
      formDataToSend.append('upload_your_resume_pdf', formData.resumePdf);
      formDataToSend.append('candidate', formData.candidate);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recruitment-agent-team`, {
        method: 'POST',
        body: formDataToSend
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (result && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Recruitment Agent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Recruitment Task Complete</h1>
                <p className="text-gray-400">Your recruitment workflow has been processed</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
                <ResultCard
                  icon={<Briefcase className="h-5 w-5" />}
                  title="Role"
                  value={formData.roleToFill || 'Not specified'}
                />
              </ResultGrid>

              {result.candidates && (
                <ResultCard
                  icon={<UserPlus className="h-5 w-5" />}
                  title="Candidates Found"
                  description={result.candidates}
                  variant="info"
                />
              )}

              {result.result && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Full Results</h3>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800/50 p-4 rounded-lg overflow-x-auto">
                    {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFile(null); }}>
                  Process Another Candidate
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recruitment Agent Team - VideoRemix.vip</title>
        <meta name="description" content="AI-powered recruitment agent team for hiring automation." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Recruitment Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered recruitment automation with Zoom and email integration.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Job Description" description="Upload or enter the job details">
                  <div>
                    <p className="text-sm font-medium text-gray-200 mb-2">Job Description File *</p>
                    <FileUploadZone
                      accept=".pdf,.doc,.docx,.txt"
                      maxSize={10 * 1024 * 1024}
                      onFileSelect={setFile}
                      selectedFile={file}
                      helperText="Upload a job description PDF or document"
                    />
                  </div>
                </FormSection>

                <FormSection title="API Keys" description="Required credentials">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(v) => updateField('openaiApiKey', v)}
                    helperText="Required for AI-powered candidate screening"
                    required
                  />
                </FormSection>

                <FormSection title="Zoom Integration" description="Video interview scheduling">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Zoom Account ID"
                      name="zoomAccountId"
                      value={formData.zoomAccountId}
                      onChange={(v) => updateField('zoomAccountId', v)}
                      placeholder="Your Zoom account ID"
                      helperText="Found in Zoom admin settings"
                    />
                    <SmartInput
                      label="Zoom Client ID"
                      name="zoomClientId"
                      value={formData.zoomClientId}
                      onChange={(v) => updateField('zoomClientId', v)}
                      placeholder="Your Zoom client ID"
                      helperText="From Zoom app credentials"
                    />
                  </div>
                  <ApiKeyInput
                    label="Zoom Client Secret"
                    value={formData.zoomClientSecret}
                    onChange={(v) => updateField('zoomClientSecret', v)}
                    helperText="From Zoom app credentials"
                  />
                </FormSection>

                <FormSection title="Email Configuration" description="Candidate communication">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Sender Email"
                      name="senderEmail"
                      value={formData.senderEmail}
                      onChange={(v) => updateField('senderEmail', v)}
                      placeholder="recruitment@company.com"
                      helperText="Email address for sending"
                      required
                    />
                    <ApiKeyInput
                      label="Email App Password"
                      value={formData.emailAppPassword}
                      onChange={(v) => updateField('emailAppPassword', v)}
                      helperText="Gmail app-specific password"
                      required
                    />
                  </div>
                </FormSection>

                <FormSection title="Recruitment Details" description="About the role and candidate">
                  <SmartInput
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={(v) => updateField('companyName', v)}
                    placeholder="Acme Corp, TechStart Inc..."
                    helperText="Name of your company"
                    required
                  />
                  <SmartInput
                    label="Role to Fill"
                    name="roleToFill"
                    value={formData.roleToFill}
                    onChange={(v) => updateField('roleToFill', v)}
                    placeholder="Senior Software Engineer, Product Manager..."
                    helperText="The job title or position"
                    required
                  />
                  <SmartInput
                    label="Candidate Info"
                    name="candidate"
                    value={formData.candidate}
                    onChange={(v) => updateField('candidate', v)}
                    placeholder="Candidate name, email, or resume summary..."
                    helperText="Enter candidate details for screening"
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Recruitment task failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !file}
                  size="lg"
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Process Recruitment'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Processing recruitment task..."
              subtext="Screening candidates, scheduling interviews..."
            />
          )}

          {!file && !loading && (
            <EmptyState
              icon={<Briefcase className="h-16 w-16 text-gray-600" />}
              title="Start recruitment workflow"
              description="Upload a job description to begin AI-powered candidate screening"
              tips={[
                "Upload a clear job description for best results",
                "Ensure all API keys have proper permissions",
                "Configure Zoom and email for automated scheduling",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiRecruitmentAgentTeamPage;
