import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
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

const STORAGE_KEY = '52-persistent-conversation-messages';

const Agent52PersistentConversationAgentPage: React.FC = () => {
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
        console.warn('Failed to parse saved messages');
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-persistent-conversation-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.result || '' }]);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (messages.length === 0) {
    return (
      <>
        <Helmet>
          <title>52PersistentConversationAgent - VideoRemix.vip</title>
          <meta name="description" content="Use 5-2-persistent-conversation-agent to automate tasks with AI." />
        </Helmet>

        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">52 Persistent Conversation Agent</h1>
              <p className="text-gray-400">AI-powered persistent conversation agent with memory.</p>
            </motion.div>

            <div className="max-w-2xl mx-auto w-full">
              <EmptyState
                icon={<Bot className="h-16 w-16 text-violet-500" />}
                title="Start a conversation"
                description="Begin chatting with the AI agent. Your conversation history is saved locally and will persist across sessions."
                tips={[
                  "Type your message and press Enter to send",
                  "Shift+Enter adds a new line in your message",
                  "Click example prompts below to get started quickly"
                ]}
              />

              <div className="mt-6">
                <ExamplePrompt
                  title="Try one of these:"
                  examples={[
                    "What can you help me with?",
                    "Explain quantum computing simply",
                    "Write a Python function to sort a list"
                  ]}
                  onSelect={setInput}
                />
              </div>

              <div className="mt-6">
                <SmartInput
                  name="message"
                  value={input}
                  onChange={setInput}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  helperText="Press Enter to send. Conversation history is saved locally."
                  onKeyDown={handleKeyPress}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <ActionButton onClick={handleSubmit} disabled={!input.trim() || loading} loading={loading}>
                    <Send className="h-4 w-4" />
                    Send
                  </ActionButton>
                </div>
              </div>

              {error && (
                <ErrorMessage
                  title="Failed to send message"
                  message={error}
                  onRetry={handleSubmit}
                />
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>52PersistentConversationAgent - VideoRemix.vip</title>
        <meta name="description" content="Use 5-2-persistent-conversation-agent to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">52 Persistent Conversation Agent</h1>
            <p className="text-gray-400">AI-powered persistent conversation agent with memory.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={"flex items-start gap-3 max-w-[80%] " + (msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " + (msg.role === 'user' ? 'bg-violet-600' : 'bg-violet-600')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <Card className={"p-3 " + (msg.role === 'user' ? 'bg-violet-600/20 border-violet-500/30' : 'bg-gray-700/50 border-gray-600')}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-900/50">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartInput
                    name="message"
                    value={input}
                    onChange={setInput}
                    placeholder="Type your message..."
                    onKeyDown={handleKeyPress}
                  />
                </div>
                <ActionButton onClick={handleSubmit} disabled={!input.trim() || loading} loading={loading}>
                  <Send className="h-4 w-4" />
                </ActionButton>
                <ActionButton variant="ghost" onClick={clearChat}>
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Press Enter to send • Shift+Enter for new line • Conversation history saved locally
              </p>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

 export default Agent52PersistentConversationAgentPage;