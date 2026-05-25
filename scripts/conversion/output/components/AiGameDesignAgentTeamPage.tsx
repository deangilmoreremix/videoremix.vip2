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

const AiGameDesignAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ background_vibe: "", game_type: "", target_audience: "", player_perspective: "", multiplayer_support: "", game_goal: "", art_style: "", target_platforms: "", development_time_months: "", budget_usd: "", core_gameplay_mechanics: "", game_moodatmosphere: "", games_for_inspiration_commaseparated: "", unique_features_or_requirements: "", level_of_detail_in_response: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/ai-game-design-agent-team', {
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
        <title>AiGameDesignAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-game-design-agent-team to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Game Design Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered ai game design agent team.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="background_vibe">Background Vibe *</Label>
                
                <Input
                  id="background_vibe"
                  type="text"
                  value={formData.background_vibe}
                  onChange={(e) => setFormData({ ...formData, background_vibe: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="game_type">Game Type *</Label>
                
                <select
                  id="game_type"
                  value={formData.game_type}
                  onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience *</Label>
                
                <select
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="player_perspective">Player Perspective *</Label>
                
                <select
                  id="player_perspective"
                  value={formData.player_perspective}
                  onChange={(e) => setFormData({ ...formData, player_perspective: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="multiplayer_support">Multiplayer Support *</Label>
                
                <select
                  id="multiplayer_support"
                  value={formData.multiplayer_support}
                  onChange={(e) => setFormData({ ...formData, multiplayer_support: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="game_goal">Game Goal *</Label>
                
                <Input
                  id="game_goal"
                  type="text"
                  value={formData.game_goal}
                  onChange={(e) => setFormData({ ...formData, game_goal: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="art_style">Art Style *</Label>
                
                <select
                  id="art_style"
                  value={formData.art_style}
                  onChange={(e) => setFormData({ ...formData, art_style: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_platforms">Target Platforms *</Label>
                
                <Input
                  id="target_platforms"
                  type="multiselect"
                  value={formData.target_platforms}
                  onChange={(e) => setFormData({ ...formData, target_platforms: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="development_time_months">Development Time (months) *</Label>
                
                <Input
                  id="development_time_months"
                  type="range"
                  value={formData.development_time_months}
                  onChange={(e) => setFormData({ ...formData, development_time_months: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_usd">Budget (USD) *</Label>
                
                <Input
                  id="budget_usd"
                  type="number"
                  value={formData.budget_usd}
                  onChange={(e) => setFormData({ ...formData, budget_usd: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="core_gameplay_mechanics">Core Gameplay Mechanics *</Label>
                
                <Input
                  id="core_gameplay_mechanics"
                  type="multiselect"
                  value={formData.core_gameplay_mechanics}
                  onChange={(e) => setFormData({ ...formData, core_gameplay_mechanics: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="game_moodatmosphere">Game Mood/Atmosphere *</Label>
                
                <Input
                  id="game_moodatmosphere"
                  type="multiselect"
                  value={formData.game_moodatmosphere}
                  onChange={(e) => setFormData({ ...formData, game_moodatmosphere: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="games_for_inspiration_commaseparated">Games for Inspiration (comma-separated) *</Label>
                
                <Textarea
                  id="games_for_inspiration_commaseparated"
                  value={formData.games_for_inspiration_commaseparated}
                  onChange={(e) => setFormData({ ...formData, games_for_inspiration_commaseparated: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="unique_features_or_requirements">Unique Features or Requirements *</Label>
                
                <Textarea
                  id="unique_features_or_requirements"
                  value={formData.unique_features_or_requirements}
                  onChange={(e) => setFormData({ ...formData, unique_features_or_requirements: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="level_of_detail_in_response">Level of Detail in Response *</Label>
                
                <select
                  id="level_of_detail_in_response"
                  value={formData.level_of_detail_in_response}
                  onChange={(e) => setFormData({ ...formData, level_of_detail_in_response: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
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

export default AiGameDesignAgentTeamPage;
