import React from "react";
import {
  TrendingUp,
  Megaphone,
  Video,
  Database,
  Home,
  Users,
  DollarSign,
  Shield,
  Code,
  Palette,
  BookOpen,
  Brain,
} from "lucide-react";

export interface AppGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  offerAngle: string;
  description: string;
}

export const appGroups: AppGroup[] = [
  {
    id: "sales-lead-gen",
    label: "Sales & Lead Gen",
    icon: React.createElement(TrendingUp, { className: "w-4 h-4" }),
    offerAngle:
      "Turn any lead, website, meeting, or prospect into a personalized sales strategy, outreach message, follow-up campaign, and closing plan.",
    description:
      "AI-powered sales intelligence, lead generation, and prospecting tools for agencies, SaaS owners, and consultants.",
  },
  {
    id: "content-creation",
    label: "Content Creation",
    icon: React.createElement(Megaphone, { className: "w-4 h-4" }),
    offerAngle:
      "Turn videos, blogs, newsletters, and trends into emails, posts, scripts, podcasts, and campaigns.",
    description:
      "Content creation and marketing apps for bloggers, creators, coaches, and agencies.",
  },
  {
    id: "video-audio-voice",
    label: "Video, Audio & Voice",
    icon: React.createElement(Video, { className: "w-4 h-4" }),
    offerAngle:
      "Give your business an AI voice agent that can answer questions, collect information, summarize calls, or create audio content.",
    description:
      "AI video, audio, and voice business apps for creators, agencies, and local businesses.",
  },
  {
    id: "rag-knowledgebase",
    label: "RAG & Knowledgebase",
    icon: React.createElement(Database, { className: "w-4 h-4" }),
    offerAngle:
      "Upload your company documents and create a private AI assistant trained on your business.",
    description:
      "Document chat, RAG, and knowledgebase apps for businesses with PDFs, SOPs, and training docs.",
  },
  {
    id: "realestate-local",
    label: "Real Estate & Local",
    icon: React.createElement(Home, { className: "w-4 h-4" }),
    offerAngle:
      "Sell AI-powered previews, plans, scripts, and customer assistants to local businesses.",
    description:
      "Real estate, home services, and local business apps for realtors, contractors, and local marketers.",
  },
  {
    id: "hr-recruiting",
    label: "HR & Recruiting",
    icon: React.createElement(Users, { className: "w-4 h-4" }),
    offerAngle:
      "Upload resumes and job descriptions to get match scores, interview questions, outreach emails, and hiring summaries.",
    description:
      "HR, hiring, and recruiting apps for recruiters, HR teams, and small businesses.",
  },
  {
    id: "finance-business",
    label: "Finance & Business",
    icon: React.createElement(DollarSign, { className: "w-4 h-4" }),
    offerAngle:
      "Turn messy numbers, spreadsheets, and business ideas into financial summaries, forecasts, and decision reports.",
    description:
      "Finance, business planning, and investment apps for entrepreneurs, investors, and business owners.",
  },
  {
    id: "legal-compliance",
    label: "Legal & Compliance",
    icon: React.createElement(Shield, { className: "w-4 h-4" }),
    offerAngle:
      "Upload contracts, agreements, policies, or reports and get plain-English summaries, risk flags, obligations, and questions to ask a professional.",
    description:
      "Legal, compliance, and risk apps for small businesses, agencies, and freelancers.",
  },
  {
    id: "coding-developer",
    label: "Coding & Developer",
    icon: React.createElement(Code, { className: "w-4 h-4" }),
    offerAngle:
      "Paste your repo, error, or feature idea and get a build plan, bug fix plan, architecture, and coding instructions.",
    description:
      "Coding, developer, and SaaS builder apps for developers, founders, and vibe coders.",
  },
  {
    id: "design-uiux",
    label: "Design & UI/UX",
    icon: React.createElement(Palette, { className: "w-4 h-4" }),
    offerAngle:
      "Upload a landing page screenshot or app screen and get conversion feedback, design fixes, CTA improvements, and wireframe suggestions.",
    description:
      "Design, UI/UX, and landing page apps for agencies, SaaS builders, and marketers.",
  },
  {
    id: "research-education",
    label: "Research & Education",
    icon: React.createElement(BookOpen, { className: "w-4 h-4" }),
    offerAngle:
      "Research any topic, summarize the best information, create training, and turn it into useful content.",
    description:
      "Research, education, and training apps for course creators, consultants, and analysts.",
  },
  {
    id: "productivity-personal",
    label: "Productivity & Personal",
    icon: React.createElement(Brain, { className: "w-4 h-4" }),
    offerAngle:
      "Give every user a personal AI assistant that remembers their work, documents, preferences, and business context.",
    description:
      "Productivity, memory, and personal assistant apps for professionals, creators, and teams.",
  },
];

export default appGroups;
