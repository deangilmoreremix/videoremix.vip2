import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
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

const STORAGE_KEY = 'qwen-local-rag-messages';

const QwenLocalRagPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qwen-local-rag`, {
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
      setMessages([...newMessages, { role: 'assistant', content: data.response || data.result || '' }]);
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

  const examplePrompts = [
    "What are the latest AI developments?",
    "Explain how RAG improves AI responses",
    "What can I ask about my documents?"
  ];

  return (
    <>
      <Helmet>
        <title>QwenLocalRag - VideoRemix.vip</title>
        <meta name="description" content="Use qwen-local-rag to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Qwen Local Rag</h1>
            <p className="text-gray-400">AI-powered qwen local rag.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={Bot}
                  title="Start a conversation"
                  description="Ask me anything about your documents or general knowledge questions."
                  tips={[
                    "Ask questions about uploaded documents",
                    "Get summaries and key insights",
                    "Search for specific information"
                  ]}
                >
                  <ExamplePrompt suggestions={examplePrompts} onSuggestionClick={setInput} />
                </EmptyState>
              )}

              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
              </AnimatePresence>

              {loading && <LoadingIndicator />}

              {error && <ErrorMessage message={error} onRetry={handleSubmit} />}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-900/50">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
                <p className="text-xs text-gray-500 px-1">
                  Ask anything about your documents or general knowledge questions.
                </p>
                <div className="flex space-x-2">
                  <SmartInput
                    name="message"
                    label=""
                    value={input}
                    onChange={setInput}
                    placeholder="Ask anything... e.g., 'What are the latest AI developments?'"
                    disabled={loading}
                  />
                  <ActionButton
                    type="submit"
                    loading={loading}
                    disabled={!input.trim()}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default QwenLocalRagPage;