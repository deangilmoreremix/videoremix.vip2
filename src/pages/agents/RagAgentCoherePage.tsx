import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Bot, User, Trash2, Send } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'rag-agent-cohere-messages';

const RagAgentCoherePage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-agent-cohere`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.result || '' }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleRetry = () => {
    if (input.trim()) {
      const form = document.createElement('form');
      form.submit();
    }
  };

  const examplePrompts = [
    "What documents can I upload?",
    "How does RAG work with Cohere?",
    "Help me summarize a PDF"
  ];

  const emptyStateTips = [
    "Upload documents for context-aware answers",
    "Ask questions about your uploaded files",
    "Get summaries and insights from your documents"
  ];

  return (
    <>
      <Helmet>
        <title>RagAgentCohere - VideoRemix.vip</title>
        <meta name="description" content="Use rag-agent-cohere to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Rag Agent Cohere</h1>
            <p className="text-gray-400">AI-powered rag agent cohere.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={Bot}
                  title="Start a conversation"
                  description="Ask questions about your documents and get AI-powered insights"
                  tips={emptyStateTips}
                >
                  <ExamplePrompt suggestions={examplePrompts} onSuggestionClick={setInput} />
                </EmptyState>
              )}

              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={"flex items-start space-x-2 max-w-[80%] " + (msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <Card className={"p-3 " + (msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-gray-700/50 border-gray-600')}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                </motion.div>
              ))}

              {loading && <LoadingIndicator />}

              {error && <ErrorMessage message={error} onRetry={handleRetry} />}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-900/50">
              <form onSubmit={handleSubmit} className="space-y-3">
                <SmartInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything... e.g., 'Explain quantum computing in simple terms'"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">You can ask about documents you upload, get summaries, and more.</p>
                <div className="flex space-x-2">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    disabled={!input.trim()}
                    icon={<Send className="h-4 w-4" />}
                  >
                    Send
                  </ActionButton>
                  <Button type="button" variant="ghost" size="icon" onClick={clearChat}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default RagAgentCoherePage;