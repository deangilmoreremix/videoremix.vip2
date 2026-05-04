import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

const ChatWithTarotsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ _select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview: "", _please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/chat-with-tarots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>ChatWithTarots - VideoRemix.vip</title>
        <meta name="description" content="Use chat-with-tarots to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Chat With Tarots</h1>
            <p className="text-xl text-gray-400">AI-powered chat with tarots.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="_select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview">🃏 Select the number of cards for your spread (3 for a more focused answer, 7 for a more general overview).) *</Label>
                
                <select
                  id="_select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview"
                  value={formData._select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview}
                  onChange={(e) => setFormData({ ...formData, _select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="_please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language">✍️ Please enter your context or your question here. You can speak in natural language. *</Label>
                
                <Textarea
                  id="_please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language"
                  value={formData._please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language}
                  onChange={(e) => setFormData({ ...formData, _please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Generate Results'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Processing...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     
                     <div className="space-y-2">
                       <Label>Transcript</Label>
                       <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{result.result}</pre>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}
        </div>
      </main>
    </>
  );
};

export default ChatWithTarotsPage;
