import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Bot, User, Trash2, Send } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = '62-ai-interaction-callbacks-messages';

const Agent62AiInteractionCallbacksPage: React.FC = () => {
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
      } catch (e) {
        console.warn('Failed to parse saved messages');
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-llm-interaction-callbacks`, {
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

  const handleExampleSelect = (example: string) => {
    setInput(example);
  };

  return (
    <>
      <Helmet>
        <title>62AiInteractionCallbacks - VideoRemix.vip</title>
        <meta name="description" content="Use 6-2-llm-interaction-callbacks to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">6 2 AI Interaction Callbacks</h1>
            <p className="text-gray-400">AI-powered 6 2 AI interaction callbacks.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={<Bot className="h-16 w-16 text-gray-600" />}
                  title="Start a conversation"
                  description="Ask questions about AI interaction callbacks, trace LLM interactions, or explore how to automate tasks with AI."
                  tips={[
                    "Try asking about tracing LLM interactions",
                    "Ask how to configure AI callbacks",
                    "Explore examples of AI-powered automation"
                  ]}
                />
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

              {loading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              {error && (
                <ErrorMessage
                  title="Failed to get response"
                  message={error}
                  onRetry={handleSubmit}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-900/50">
              {messages.length === 0 && (
                <div className="mb-4">
                  <ExamplePrompt
                    title="Start with one of these:"
                    examples={[
                      "What can you help me with?",
                      "Explain AI interaction callbacks",
                      "How do I trace LLM interactions?"
                    ]}
                    onSelect={handleExampleSelect}
                  />
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <SmartInput
                  name="message"
                  value={input}
                  onChange={setInput}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  helperText="Press Enter to send. Conversation history is saved locally."
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <ActionButton type="submit" disabled={loading || !input.trim()} loading={loading}>
                  <Send className="h-4 w-4" />
                </ActionButton>
                <ActionButton type="button" variant="ghost" onClick={clearChat} disabled={loading || messages.length === 0}>
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

 export default Agent62AiInteractionCallbacksPage;
