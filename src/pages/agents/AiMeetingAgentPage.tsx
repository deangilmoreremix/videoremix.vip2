import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Calendar, Users, Clock, Target, CheckCircle2, FileText } from "lucide-react";

const STORAGE_KEY = 'ai-meeting-agent';

const AiMeetingAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    meetingObjective: '',
    attendees: '',
    duration: '',
    focusAreas: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-meeting-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_the_company_name: formData.companyName,
          enter_the_meeting_objective: formData.meetingObjective,
          enter_the_attendees_and_their_roles_one_per_line: formData.attendees,
          enter_the_meeting_duration_in_minutes: formData.duration,
          enter_any_specific_areas_of_focus_or_concerns: formData.focusAreas,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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

  if (result && result.status === 'completed' && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Meeting Agent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Meeting Plan Generated</h1>
                <p className="text-gray-400">Your AI-powered meeting plan is ready</p>
              </div>

              <ResultGrid columns={3}>
                <ResultCard
                  icon={<Calendar className="h-5 w-5" />}
                  title="Duration"
                  value={`${formData.duration} min`}
                />
                <ResultCard
                  icon={<Users className="h-5 w-5" />}
                  title="Attendees"
                  value={formData.attendees.split('\n').length}
                  subtext="participants"
                />
                <ResultCard
                  icon={<Target className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              {result.agenda && (
                <ResultCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Generated Agenda"
                  description={result.agenda}
                  variant="info"
                />
              )}

              {result.result && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Meeting Plan</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.result}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Create Another Meeting Plan
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
        <title>Meeting Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered meeting planning agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Meeting Agent</h1>
            <p className="text-xl text-gray-400">AI-powered meeting planning and agenda generation.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Meeting Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Company Information" description="Basic details about your organization">
                  <SmartInput
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={(v) => updateField('companyName', v)}
                    placeholder="Acme Corporation, TechStart Inc..."
                    helperText="Enter the company or organization name"
                    required
                  />
                </FormSection>

                <FormSection title="Meeting Objective" description="What do you want to achieve?">
                  <SmartInput
                    label="Meeting Objective"
                    name="meetingObjective"
                    value={formData.meetingObjective}
                    onChange={(v) => updateField('meetingObjective', v)}
                    placeholder="Quarterly review, product launch planning, budget approval..."
                    helperText="Describe the primary goal or outcome you want from this meeting"
                    required
                  />
                </FormSection>

                <FormSection title="Participants" description="Who will be attending">
                  <SmartTextarea
                    label="Attendees and Roles"
                    name="attendees"
                    value={formData.attendees}
                    onChange={(v) => updateField('attendees', v)}
                    placeholder="John Smith - Project Manager&#10;Sarah Johnson - Lead Developer&#10;Mike Chen - Designer"
                    helperText="List each attendee on a new line with their name and role"
                    example={"John Smith - Project Manager\nSarah Johnson - Lead Developer\nMike Chen - Designer"}
                    rows={4}
                    required
                  />
                </FormSection>

                <FormSection title="Logistics" description="Time and duration">
                  <SmartInput
                    label="Meeting Duration (minutes)"
                    name="duration"
                    value={formData.duration}
                    onChange={(v) => updateField('duration', v)}
                    placeholder="30, 45, 60, 90..."
                    helperText="Estimated meeting duration in minutes"
                    required
                  />
                </FormSection>

                <FormSection title="Focus Areas" description="Topics to prioritize">
                  <SmartTextarea
                    label="Specific Focus Areas or Concerns"
                    name="focusAreas"
                    value={formData.focusAreas}
                    onChange={(v) => updateField('focusAreas', v)}
                    placeholder="Key discussion points, decisions needed, potential blockers..."
                    helperText="List any specific topics that need attention or areas of concern"
                    rows={3}
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Failed to generate meeting plan"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.companyName.trim() || !formData.meetingObjective.trim()}
                  size="lg"
                  className="w-full"
                >
                  Generate Meeting Plan
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Generating meeting plan..."
              subtext="Creating an optimized agenda based on your inputs"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Calendar className="h-16 w-16 text-gray-600" />}
              title="Plan your next meeting"
              description="Enter your meeting details and let AI create an optimized agenda"
              tips={[
                "Be specific about your meeting objective for better results",
                "List all attendees with their roles for accurate time allocation",
                "Include any critical topics that must be covered",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiMeetingAgentPage;
