import React from "react";
import { BookOpen, Settings } from "lucide-react";

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  category: string;
}

export const coursesData: Course[] = [
  {
    id: "google-adk-crash-course",
    title: "Google ADK Crash Course",
    description: "Deep-dive tutorial on Google's Agent Development Kit. Covers starter agent, model-agnostic development, structured outputs with Pydantic, tools integration (built-in, function, third-party, MCP), memory management, callbacks, plugins, and multi-agent patterns.",
    icon: React.createElement(BookOpen),
    url: "https://www.theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps",
    category: "crash-course"
  },
  {
    id: "openai-agents-sdk-crash-course",
    title: "OpenAI Agents SDK Crash Course",
    description: "Comprehensive tutorial on OpenAI Agents SDK. Learn starter agent, function calling, structured outputs, tools integration, memory, callbacks, evaluation, multi-agent patterns, agent handoffs, Swarm orchestration, and routing logic.",
    icon: React.createElement(BookOpen),
    url: "https://www.theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps",
    category: "crash-course"
  },
  {
    id: "gemini-3-fine-tuning",
    title: "Gemma 3 Fine-tuning Tutorial",
    description: "End-to-end fine-tuning recipe for Gemma 3 model. Learn how to adapt pre-trained models for specific tasks with custom datasets.",
    icon: React.createElement(Settings),
    url: "https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_llm_apps/llm_finetuning_tutorials/gemma3_finetuning",
    category: "fine-tuning"
  },
  {
    id: "llama-3-2-fine-tuning",
    title: "Llama 3.2 Fine-tuning Tutorial",
    description: "Complete fine-tuning guide for Llama 3.2 model. Step-by-step instructions for parameter-efficient fine-tuning and deployment.",
    icon: React.createElement(Settings),
    url: "https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_llm_apps/llm_finetuning_tutorials/llama3.2_finetuning",
    category: "fine-tuning"
  }
];
