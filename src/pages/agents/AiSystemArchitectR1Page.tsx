import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { Loader2, Bot, User, Trash2, Send, Building2 } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AiSystemArchitectR1Page: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-system-architect-messages');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-system-architect-messages', JSON.stringify(messages));
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-system-architect-r1`, {
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
      localStorage.removeItem('ai-system-architect-messages');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('ai-system-architect-messages');
  };

  const examplePrompts = [
    "Design a scalable microservices architecture for an e-commerce platform",
    "Explain the architecture patterns for handling millions of requests",
    "Create a system design for a real-time chat application",
  ];

  return (
    <>
      <Helmet>
        <title>AI System Architect R1 - VideoRemix.vip</title>
        <meta name="description" content="Advanced system architecture agent for designing scalable, enterprise-grade systems." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <Building2 className="h-8 w-8 text-violet-400" />
              AI System Architect R1
            </h1>
            <p className="text-gray-400">Enterprise-grade system design and architecture planning with AI.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={<Bot className="h-16 w-16 text-gray-600" />}
                  title="Design your system architecture"
                  description="Get expert guidance on scalable system designs, architecture patterns, and technical decisions."
                  action={
                    <ExamplePrompt
                      examples={examplePrompts}
                      onSelect={setInput}
                    />
                  }
                  tips={[
                    "Describe the scale and requirements of your system",
                    "Ask about specific architecture patterns (microservices, event-driven, etc.)",
                    "Request trade-off analysis for different approaches",
                  ]}
                />
              )}

              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={"flex items-start space-x-2 max-w-[80%] " + (msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (msg.role === 'user' ? 'bg-blue-600' : 'bg-violet-600')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <Card className={"p-3 " + (msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-gray-700/50 border-gray-600')}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-violet-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Designing architecture...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-900/50">
              <form onSubmit={handleSubmit} className="space-y-3">
                <SmartInput
                  label=""
                  name="message"
                  value={input}
                  onChange={setInput}
                  placeholder="Describe your system requirements... (e.g., 'Design a system handling 1M daily active users')"
                  helperText="Press Enter to send. Include scale, tech stack, and specific requirements."
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <ActionButton type="submit" loading={loading} disabled={!input.trim() || loading}>
                    <Send className="h-4 w-4" />
                    Send
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={clearChat} disabled={messages.length === 0}>
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </ActionButton>
                </div>
              </form>
              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AiSystemArchitectR1Page;