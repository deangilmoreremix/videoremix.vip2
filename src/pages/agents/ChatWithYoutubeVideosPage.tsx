import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { FileText, Sparkles, Video } from "lucide-react";

const STORAGE_KEY = 'chat-with-youtube-videos';

const ChatWithYoutubeVideosPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ openai_api_key: "", enter_youtube_video_url: "", ask_any_question_about_the_youtube_video: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.openai_api_key.trim()) {
      setError("OpenAI API key is required");
      return;
    }
    if (!formData.enter_youtube_video_url.trim()) {
      setError("YouTube video URL is required");
      return;
    }
    if (!formData.ask_any_question_about_the_youtube_video.trim()) {
      setError("Question is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-youtube-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>ChatWithYoutubeVideos - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard
                icon={<Video className="h-5 w-5" />}
                title="Video Analysis"
                description={result.result}
                variant="success"
              />
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFormData({ openai_api_key: "", enter_youtube_video_url: "", ask_any_question_about_the_youtube_video: "" }); }}>
                  <Sparkles className="h-4 w-4" />
                  Analyze Another Video
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Processing video..." subtext="Transcribing and analyzing the YouTube content" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>ChatWithYoutubeVideos - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-pink-500 rounded-3xl mb-6">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Chat With YouTube Videos</h1>
              <p className="text-xl text-gray-400">AI-powered chat with YouTube video content.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <SmartInput
                  label="OpenAI API Key"
                  name="openai_api_key"
                  value={formData.openai_api_key}
                  onChange={(value) => setFormData(prev => ({ ...prev, openai_api_key: value }))}
                  type="password"
                  placeholder="sk-..."
                  helperText="Your API key is stored locally and never sent to our servers"
                  required
                />

                <SmartInput
                  label="YouTube Video URL"
                  name="enter_youtube_video_url"
                  value={formData.enter_youtube_video_url}
                  onChange={(value) => setFormData(prev => ({ ...prev, enter_youtube_video_url: value }))}
                  placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  helperText="Paste the full URL of the YouTube video you want to analyze"
                  required
                />

                <SmartInput
                  label="Your Question"
                  name="ask_any_question_about_the_youtube_video"
                  value={formData.ask_any_question_about_the_youtube_video}
                  onChange={(value) => setFormData(prev => ({ ...prev, ask_any_question_about_the_youtube_video: value }))}
                  placeholder="e.g., 'What are the main topics discussed in this video?'"
                  helperText="Ask anything about the video content - summaries, key points, timestamps, etc."
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Analyze Video
              </ActionButton>
            </form>

            <EmptyState
              icon={<Video className="h-16 w-16 text-gray-600" />}
              title="Chat with YouTube Videos"
              description="Paste a YouTube URL and ask questions about the video content"
              tips={[
                "Make sure the video is public or unlisted",
                "Longer videos may take more time to process",
                "Ask about specific timestamps or sections for detailed analysis"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default ChatWithYoutubeVideosPage;
