import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { Loader2, Bot, User, Trash2, Send, Search } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const HybridSearchRagPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hybrid-search-rag-messages');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('hybrid-search-rag-messages', JSON.stringify(messages));
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hybrid-search-rag`, {
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
      localStorage.removeItem('hybrid-search-rag-messages');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('hybrid-search-rag-messages');
  };

  const examplePrompts = [
    "How does hybrid search combine keyword and semantic search?",
    "Explain the benefits of vector + BM25 for retrieval",
    "When should I use hybrid search over pure vector search?",
  ];

  return (
    <>
      <Helmet>
        <title>Hybrid Search RAG - VideoRemix.vip</title>
        <meta name="description" content="RAG with hybrid search combining keyword and semantic retrieval for better results." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <Search className="h-8 w-8 text-violet-400" />
              Hybrid Search RAG
            </h1>
            <p className="text-gray-400">Combined keyword and semantic search for precise, relevant retrieval.</p>
          </motion.div>

          <Card className="flex-1 bg-gray-800/50 border-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <EmptyState
                  icon={<Bot className="h-16 w-16 text-gray-600" />}
                  title="Advanced hybrid retrieval"
                  description="Experience the power of combining keyword matching with semantic understanding for superior search results."
                  action={
                    <ExamplePrompt
                      examples={examplePrompts}
                      onSelect={setInput}
                    />
                  }
                  tips={[
                    "Ask about hybrid search implementation details",
                    "Learn when to combine vector and keyword search",
                    "Explore techniques for improving retrieval precision",
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
                  <span>Searching with hybrid approach...</span>
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
                  placeholder="Ask about hybrid search... (e.g., 'Compare BM25 vs vector search for product queries')"
                  helperText="Press Enter to send. Hybrid search combines the best of keyword and semantic matching."
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

export default HybridSearchRagPage;