import * as fs from 'fs';
import * as path from 'path';

const agentsDir = '/Users/deanellgilmore/Downloads/videoremixvip/videoremix.vip2/src/pages/agents';

const apps = [
  {
    id: 'ai_consultant_agent',
    title: 'AI Consultant Agent',
    description: 'Get expert consulting advice for your business challenges.',
    fields: [
      { name: 'business_challenge', label: 'Business Challenge', type: 'textarea', placeholder: 'Describe the business problem or opportunity you are facing...', required: true, rows: 4 },
      { name: 'industry', label: 'Industry', type: 'input', placeholder: 'e.g. SaaS, E-commerce, Healthcare...' },
      { name: 'goals', label: 'Goals', type: 'textarea', placeholder: 'What do you hope to achieve?', rows: 3 },
    ]
  },
  {
    id: 'ai_investment_agent',
    title: 'AI Investment Agent',
    description: 'Analyze investment opportunities and build your portfolio strategy.',
    fields: [
      { name: 'investment_amount', label: 'Investment Amount ($)', type: 'input', placeholder: 'e.g. 10000', required: true },
      { name: 'risk_tolerance', label: 'Risk Tolerance', type: 'textarea', placeholder: 'Describe your risk appetite: conservative, moderate, aggressive...', rows: 3 },
      { name: 'time_horizon', label: 'Time Horizon', type: 'input', placeholder: 'e.g. 5 years, 10 years' },
    ]
  },
  {
    id: 'ai_sales_intelligence_agent_team',
    title: 'AI Sales Intelligence Agent Team',
    description: 'Uncover sales insights and optimize your pipeline.',
    fields: [
      { name: 'company_name', label: 'Company Name', type: 'input', placeholder: 'Your company name', required: true },
      { name: 'target_market', label: 'Target Market', type: 'input', placeholder: 'e.g. Enterprise SaaS, Local Retail' },
      { name: 'sales_goals', label: 'Sales Goals', type: 'textarea', placeholder: 'What are your quarterly or annual sales targets?', rows: 3 },
    ]
  },
  {
    id: 'ai_vc_due_diligence_agent_team',
    title: 'AI VC Due Diligence Agent Team',
    description: 'Accelerate startup due diligence with AI-powered analysis.',
    fields: [
      { name: 'startup_name', label: 'Startup Name', type: 'input', placeholder: 'The startup you are evaluating', required: true },
      { name: 'funding_stage', label: 'Funding Stage', type: 'input', placeholder: 'e.g. Seed, Series A, Series B' },
      { name: 'focus_areas', label: 'Focus Areas', type: 'textarea', placeholder: 'Market size, team, traction, competition...', rows: 3 },
    ]
  },
  {
    id: 'email-drafter',
    title: 'Email Drafter',
    description: 'Draft professional emails in seconds with AI assistance.',
    fields: [
      { name: 'recipient', label: 'Recipient', type: 'input', placeholder: 'e.g. hiring manager, client, team member', required: true },
      { name: 'subject', label: 'Subject', type: 'input', placeholder: 'Email subject line', required: true },
      { name: 'key_points', label: 'Key Points', type: 'textarea', placeholder: 'Main points you want to communicate...', required: true, rows: 4 },
    ]
  },
  {
    id: 'strategy-advisor',
    title: 'Strategy Advisor',
    description: 'Develop winning business strategies with AI guidance.',
    fields: [
      { name: 'business_model', label: 'Business Model', type: 'input', placeholder: 'e.g. B2B SaaS, Marketplace, D2C' },
      { name: 'challenges', label: 'Challenges', type: 'textarea', placeholder: 'What strategic challenges are you facing?', rows: 4, required: true },
      { name: 'objectives', label: 'Objectives', type: 'textarea', placeholder: 'What are your key business objectives?', rows: 3 },
    ]
  },
  {
    id: 'project-planner',
    title: 'Project Planner',
    description: 'Plan and organize projects with intelligent AI assistance.',
    fields: [
      { name: 'project_name', label: 'Project Name', type: 'input', placeholder: 'Name of your project', required: true },
      { name: 'timeline', label: 'Timeline', type: 'input', placeholder: 'e.g. 2 weeks, 3 months' },
      { name: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: 'What are the key deliverables?', rows: 4 },
    ]
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Generate structured meeting notes and action items.',
    fields: [
      { name: 'transcript', label: 'Meeting Transcript', type: 'textarea', placeholder: 'Paste the meeting transcript or raw notes here...', required: true, rows: 6 },
      { name: 'attendees', label: 'Attendees', type: 'input', placeholder: 'Names of attendees (comma separated)' },
      { name: 'meeting_date', label: 'Meeting Date', type: 'input', placeholder: 'e.g. 2025-01-15' },
    ]
  },
  {
    id: 'decision-helper',
    title: 'Decision Helper',
    description: 'Make better decisions with AI-powered analysis.',
    fields: [
      { name: 'decision', label: 'Decision to Make', type: 'textarea', placeholder: 'Describe the decision you need to make...', required: true, rows: 4 },
      { name: 'options', label: 'Options', type: 'textarea', placeholder: 'List the available options (one per line)...', required: true, rows: 3 },
      { name: 'criteria', label: 'Criteria', type: 'textarea', placeholder: 'What factors matter most?', rows: 3 },
    ]
  },
  {
    id: 'fact-checker',
    title: 'Fact Checker',
    description: 'Verify claims and check facts with AI research.',
    fields: [
      { name: 'claim', label: 'Claim to Verify', type: 'textarea', placeholder: 'Enter the statement or claim you want to fact-check...', required: true, rows: 4 },
      { name: 'source', label: 'Source', type: 'input', placeholder: 'Where did you encounter this claim?' },
      { name: 'context', label: 'Context', type: 'textarea', placeholder: 'Any additional context that might help verification...', rows: 3 },
    ]
  },
  {
    id: 'ai_home_renovation_agent',
    title: 'AI Home Renovation Agent',
    description: 'Plan your home renovation with AI-powered design suggestions.',
    fields: [
      { name: 'room_type', label: 'Room Type', type: 'input', placeholder: 'e.g. Kitchen, Bathroom, Living Room', required: true },
      { name: 'budget', label: 'Budget', type: 'input', placeholder: 'e.g. $10,000 - $20,000' },
      { name: 'style_preferences', label: 'Style Preferences', type: 'textarea', placeholder: 'Describe your preferred style: modern, rustic, minimalist...', rows: 3 },
    ]
  },
  {
    id: 'ai_news_and_podcast_agents',
    title: 'AI News and Podcast Agents',
    description: 'Curate news and generate podcast content with AI.',
    fields: [
      { name: 'topic', label: 'Topic', type: 'input', placeholder: 'e.g. AI trends, Climate change, Tech startups', required: true },
      { name: 'tone', label: 'Tone', type: 'input', placeholder: 'e.g. Informative, Casual, Professional' },
      { name: 'length', label: 'Length', type: 'input', placeholder: 'e.g. 5 min, 30 min' },
    ]
  },
  {
    id: 'multimodal_uiux_feedback_agent_team',
    title: 'Multimodal UI/UX Feedback Agent Team',
    description: 'Get comprehensive UI/UX feedback from AI agents.',
    fields: [
      { name: 'app_description', label: 'App Description', type: 'textarea', placeholder: 'Describe your app and its main purpose...', required: true, rows: 4 },
      { name: 'screenshots', label: 'Screenshots', type: 'textarea', placeholder: 'Describe or provide links to screenshots...', rows: 3 },
      { name: 'user_flow', label: 'User Flow', type: 'textarea', placeholder: 'Describe the key user flow you want feedback on...', rows: 3 },
    ]
  },
  {
    id: 'content-creator',
    title: 'Content Creator',
    description: 'Create engaging content with AI assistance.',
    fields: [
      { name: 'topic', label: 'Topic', type: 'input', placeholder: 'What is the content about?', required: true },
      { name: 'format', label: 'Format', type: 'input', placeholder: 'e.g. Blog post, Social media, Video script' },
      { name: 'audience', label: 'Target Audience', type: 'input', placeholder: 'Who is this content for?' },
    ]
  },
  {
    id: 'editor',
    title: 'Editor',
    description: 'Polish and improve your writing with AI editing.',
    fields: [
      { name: 'text_content', label: 'Text Content', type: 'textarea', placeholder: 'Paste the text you want to edit...', required: true, rows: 6 },
      { name: 'tone', label: 'Tone', type: 'input', placeholder: 'e.g. Professional, Casual, Academic' },
      { name: 'style_notes', label: 'Style Notes', type: 'textarea', placeholder: 'Any specific style or formatting preferences...', rows: 3 },
    ]
  },
  {
    id: 'ux-designer',
    title: 'UX Designer',
    description: 'Design better user experiences with AI insights.',
    fields: [
      { name: 'product_description', label: 'Product Description', type: 'textarea', placeholder: 'Describe your product and its users...', required: true, rows: 4 },
      { name: 'user_personas', label: 'User Personas', type: 'textarea', placeholder: 'Describe your target users...', rows: 3 },
      { name: 'goals', label: 'Design Goals', type: 'textarea', placeholder: 'What do you want to improve?', rows: 3 },
    ]
  },
  {
    id: 'visualization-expert',
    title: 'Visualization Expert',
    description: 'Create stunning data visualizations with AI.',
    fields: [
      { name: 'data_description', label: 'Data Description', type: 'textarea', placeholder: 'Describe the data you want to visualize...', required: true, rows: 4 },
      { name: 'chart_type', label: 'Chart Type', type: 'input', placeholder: 'e.g. Bar chart, Line chart, Pie chart, Scatter plot' },
      { name: 'insights', label: 'Key Insights', type: 'textarea', placeholder: 'What insights do you want to highlight?', rows: 3 },
    ]
  },
  {
    id: 'ai_travel_planner_agent_team',
    title: 'AI Travel Planner Agent Team',
    description: 'Plan perfect trips with AI-powered recommendations.',
    fields: [
      { name: 'destination', label: 'Destination', type: 'input', placeholder: 'Where do you want to go?', required: true },
      { name: 'dates', label: 'Dates', type: 'input', placeholder: 'e.g. March 1-7, 2025' },
      { name: 'preferences', label: 'Preferences', type: 'textarea', placeholder: 'Interests, budget, accommodation style, activities...', rows: 4 },
    ]
  },
  {
    id: 'ai_self_evolving_agent',
    title: 'AI Self-Evolving Agent',
    description: 'Build agents that learn and improve autonomously.',
    fields: [
      { name: 'initial_task', label: 'Initial Task', type: 'textarea', placeholder: 'Describe the task the agent should start with...', required: true, rows: 4 },
      { name: 'learning_goals', label: 'Learning Goals', type: 'textarea', placeholder: 'What should the agent improve over time?', rows: 3 },
      { name: 'constraints', label: 'Constraints', type: 'textarea', placeholder: 'Any safety or performance constraints...', rows: 3 },
    ]
  },
  {
    id: 'notion_mcp_agent',
    title: 'Notion MCP Agent',
    description: 'Connect and automate Notion with AI agents.',
    fields: [
      { name: 'workspace', label: 'Workspace', type: 'input', placeholder: 'Your Notion workspace name', required: true },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what you want the agent to do in Notion...', required: true, rows: 4 },
      { name: 'database', label: 'Database', type: 'input', placeholder: 'Target database name (if applicable)' },
    ]
  },
  {
    id: 'rag_failure_diagnostics_clinic',
    title: 'RAG Failure Diagnostics Clinic',
    description: 'Diagnose and fix RAG pipeline failures with AI.',
    fields: [
      { name: 'pipeline_config', label: 'Pipeline Config', type: 'textarea', placeholder: 'Describe your RAG pipeline configuration...', required: true, rows: 4 },
      { name: 'error_description', label: 'Error Description', type: 'textarea', placeholder: 'What is failing or producing bad results?', required: true, rows: 4 },
      { name: 'logs', label: 'Logs', type: 'textarea', placeholder: 'Relevant logs or error messages...', rows: 4 },
    ]
  },
  {
    id: 'self-improving-agent-skills',
    title: 'Self-Improving Agent Skills',
    description: 'Automatically optimize agent skills with AI.',
    fields: [
      { name: 'current_skill', label: 'Current Skill', type: 'textarea', placeholder: 'Describe the agent skill you want to improve...', required: true, rows: 4 },
      { name: 'improvement_goal', label: 'Improvement Goal', type: 'textarea', placeholder: 'What should be improved? Accuracy, speed, reliability...', rows: 3 },
      { name: 'metrics', label: 'Metrics', type: 'input', placeholder: 'e.g. success rate, response time' },
    ]
  },
  {
    id: 'academic-researcher',
    title: 'Academic Researcher',
    description: 'Accelerate academic research with AI assistance.',
    fields: [
      { name: 'research_topic', label: 'Research Topic', type: 'input', placeholder: 'e.g. Quantum computing, Climate policy', required: true },
      { name: 'methodology', label: 'Methodology', type: 'input', placeholder: 'e.g. Literature review, Meta-analysis, Case study' },
      { name: 'sources', label: 'Sources', type: 'textarea', placeholder: 'Any specific papers, authors, or journals to focus on...', rows: 3 },
    ]
  },
  {
    id: 'code-reviewer',
    title: 'Code Reviewer',
    description: 'Get thorough code reviews and improvement suggestions.',
    fields: [
      { name: 'code_snippet', label: 'Code Snippet', type: 'textarea', placeholder: 'Paste the code you want reviewed...', required: true, rows: 8 },
      { name: 'language', label: 'Language', type: 'input', placeholder: 'e.g. Python, JavaScript, Rust', required: true },
      { name: 'review_focus', label: 'Review Focus', type: 'input', placeholder: 'e.g. Security, Performance, Readability' },
    ]
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description: 'Analyze data and generate insights with AI.',
    fields: [
      { name: 'data_source', label: 'Data Source', type: 'input', placeholder: 'e.g. CSV file, Database, API endpoint', required: true },
      { name: 'question', label: 'Question', type: 'textarea', placeholder: 'What do you want to know from this data?', required: true, rows: 4 },
      { name: 'format', label: 'Output Format', type: 'input', placeholder: 'e.g. Summary, Chart, SQL query' },
    ]
  },
];

function toPascalCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}

function toSlug(id: string): string {
  return id.replace(/_/g, '-');
}

apps.forEach(app => {
  const className = toPascalCase(app.id) + 'Page';
  const slug = toSlug(app.id);
  
  const formFields = app.fields.map(field => {
    if (field.type === 'input') {
      return `
                <SmartInput
                  label="${field.label}"
                  name="${field.name}"
                  value={formData.${field.name}}
                  onChange={(val) => updateField('${field.name}', val)}
                  placeholder="${field.placeholder}"
                  helperText="${field.label}"
                  type="text"
                  required={${field.required ? 'true' : 'false'}}
                />`;
    } else if (field.type === 'textarea') {
      return `
                <SmartTextarea
                  label="${field.label}"
                  name="${field.name}"
                  value={formData.${field.name}}
                  onChange={(val) => updateField('${field.name}', val)}
                  placeholder="${field.placeholder}"
                  helperText="${field.label}"
                  rows={${field.rows || 4}}
                  required={${field.required ? 'true' : 'false'}}
                />`;
    }
    return '';
  }).join('\n');

  const fileContent = `import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = '${slug}-state';

const ${className}: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    enter_your_openai_api_key: "",
    ${app.fields.map(f => `${f.name}: \"\"`).join(',\n    ')}
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.${app.fields[0].name}.trim()) {
      setError("Please fill in the required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(\`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${slug}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      enter_your_openai_api_key: "",
      ${app.fields.map(f => `${f.name}: \"\"`).join(',\n      ')}
    });
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Processing your request..." subtext="AI is working on your task" />
      </div>
    );
  }

  if (result) {
    return (
      <>
        <Helmet>
          <title>Results - ${app.title}</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">${app.title}</h1>
              <p className="text-xl text-gray-400">Results generated successfully</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Sparkles />}
                title="Status"
                value="Completed"
                variant="success"
              />
              <ResultCard
                icon={<Sparkles />}
                title="Agent"
                value="${app.title}"
                variant="info"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Result</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Try Again
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>${app.title} - VideoRemix.vip</title>
        <meta name="description" content="${app.description}" />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">${app.title}</h1>
            <p className="text-xl text-gray-400">${app.description}</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configure & Run</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your OpenAI API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    name="enter_your_openai_api_key"
                    value={formData.enter_your_openai_api_key}
                    onChange={(val) => updateField('enter_your_openai_api_key', val)}
                    placeholder="sk-..."
                    helperText="Get your API key from OpenAI Platform"
                    required
                  />
                </FormSection>

${app.fields.map(field => {
  if (field.type === 'input') {
    return `                <FormSection title="${field.label}" description="Provide ${field.label.toLowerCase()}">
                  <SmartInput
                    label="${field.label}"
                    name="${field.name}"
                    value={formData.${field.name}}
                    onChange={(val) => updateField('${field.name}', val)}
                    placeholder="${field.placeholder}"
                    helperText="${field.label}"
                    type="text"
                    required={${field.required ? 'true' : 'false'}}
                  />
                </FormSection>`;
  } else if (field.type === 'textarea') {
    return `                <FormSection title="${field.label}" description="Provide ${field.label.toLowerCase()}">
                  <SmartTextarea
                    label="${field.label}"
                    name="${field.name}"
                    value={formData.${field.name}}
                    onChange={(val) => updateField('${field.name}', val)}
                    placeholder="${field.placeholder}"
                    helperText="${field.label}"
                    rows={${field.rows || 4}}
                    required={${field.required ? 'true' : 'false'}}
                  />
                </FormSection>`;
  }
  return '';
}).join('\n')}

                {error && (
                  <ErrorMessage
                    title="Request Failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.${app.fields[0].name}.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Run Agent
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Sparkles className="h-16 w-16 text-gray-600" />}
            title="Ready to get started"
            description="${app.description}"
            tips={[
              "Enter your OpenAI API key to get started",
              "Provide clear inputs for best results",
              "Add any relevant context that might help the agent"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default ${className};
`;

  const fileName = `${className}.tsx`;
  const filePath = path.join(agentsDir, fileName);
  
  fs.writeFileSync(filePath, fileContent);
  console.log(`Created: ${fileName}`);
});

console.log(`\nGenerated ${apps.length} pages.`);
