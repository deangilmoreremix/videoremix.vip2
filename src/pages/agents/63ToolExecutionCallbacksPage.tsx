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

const Agent63ToolExecutionCallbacksPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('63tool-execution-callbacks-messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved messages');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('63tool-execution-callbacks-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-tool-execution-callbacks`, {
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
    localStorage.removeItem('63tool-execution-callbacks-messages');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <Helmet>
        <title>63ToolExecutionCallbacks - VideoRemix.vip</title>
        <meta name="description" content="Use 6-3-tool-execution-callbacks to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">6 3 Tool Execution Callbacks</h1>
            <p className="text-gray-400">AI-powered 6 3 tool execution callbacks.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={<Bot className="h-16 w-16 text-gray-600" />}
                  title="Start a conversation"
                  description="Ask questions about tool execution callbacks, how to log AI tool usage, or how to automate tasks with callbacks."
                  tips={[
                    "Try asking about what tool execution callbacks are",
                    "Ask how to log tool usage in your applications",
                    "Learn about automating tasks with AI callbacks"
                  ]}
                />
              )}

              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={"flex items-start gap-3 max-w-[80%] " + (msg.role === 'user' ? 'flex-row-reverse' : '')}>
                    <div className={"flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center " + (msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <Card className={"p-3 " + (msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-gray-700/50 border-gray-600')}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Thinking...</span>
                </div>
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
                      "Explain tool execution callbacks",
                      "How do I log tool usage?"
                    ]}
                    onSelect={setInput}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <SmartInput
                  name="message"
                  value={input}
                  onChange={setInput}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  helperText="Press Enter to send. Conversation history is saved locally."
                  disabled={loading}
                />
                <div className="flex justify-end gap-2">
                  <ActionButton
                    type="submit"
                    disabled={loading || !input.trim()}
                    loading={loading}
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    onClick={clearChat}
                    disabled={loading || messages.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </ActionButton>
                </div>
              </form>

              {error && (
                <div className="mt-4">
                  <ErrorMessage
                    title="Failed to get response"
                    message={error}
                    onRetry={handleSubmit}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Agent63ToolExecutionCallbacksPage;