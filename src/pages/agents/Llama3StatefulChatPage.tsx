import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { Loader2, Bot, User, Trash2, Send, MessageSquare } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Llama3StatefulChatPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('llama3-stateful-chat-messages');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('llama3-stateful-chat-messages', JSON.stringify(messages));
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama3-stateful-chat`, {
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
      localStorage.removeItem('llama3-stateful-chat-messages');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('llama3-stateful-chat-messages');
  };

  const examplePrompts = [
    "Explain quantum computing in simple terms",
    "Help me write a Python function to parse JSON",
    "What are the best practices for REST API design?",
  ];

  return (
    <>
      <Helmet>
        <title>Llama3 Stateful Chat - VideoRemix.vip</title>
        <meta name="description" content="Stateful conversations with Meta's Llama 3, maintaining context across multiple turns." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <MessageSquare className="h-8 w-8 text-orange-400" />
              Llama3 Stateful Chat
            </h1>
            <p className="text-gray-400">Conversational AI powered by Meta's Llama 3 with full conversation memory.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={<Bot className="h-16 w-16 text-gray-600" />}
                  title="Start a stateful conversation"
                  description="Chat with Llama 3 and maintain context throughout your entire conversation for coherent, contextual responses."
                  action={
                    <ExamplePrompt
                      examples={examplePrompts}
                      onSelect={setInput}
                    />
                  }
                  tips={[
                    "Ask follow-up questions that build on previous responses",
                    "Request code or technical explanations",
                    "Explore complex topics with deep conversation threads",
                  ]}
                />
              )}

              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={"flex items-start space-x-2 max-w-[80%] " + (msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (msg.role === 'user' ? 'bg-blue-600' : 'bg-orange-600')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <Card className={"p-3 " + (msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-gray-700/50 border-gray-600')}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-orange-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Llama 3 is thinking...</span>
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
                  placeholder="Type your message... (e.g., 'Continue explaining the previous topic')"
                  helperText="Press Enter to send. Llama 3 maintains conversation context."
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

export default Llama3StatefulChatPage;