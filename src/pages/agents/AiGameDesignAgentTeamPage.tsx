import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles, Gamepad2 } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { FormSection } from "@/components/agent-ui/FormSection";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";

const STORAGE_KEY = 'ai-game-design-agent-team-form';

const GAME_TYPE_OPTIONS = [
  { value: "action", label: "Action" },
  { value: "adventure", label: "Adventure" },
  { value: "rpg", label: "RPG (Role-Playing Game)" },
  { value: "strategy", label: "Strategy" },
  { value: "simulation", label: "Simulation" },
  { value: "puzzle", label: "Puzzle" },
  { value: "horror", label: "Horror" },
  { value: "shooter", label: "Shooter" },
  { value: "platformer", label: "Platformer" },
  { value: "fighting", label: "Fighting" },
  { value: "racing", label: "Racing" },
  { value: "sports", label: "Sports" },
  { value: "moba", label: "MOBA" },
  { value: "sandbox", label: "Sandbox" },
  { value: "card_game", label: "Card Game" },
];

const TARGET_AUDIENCE_OPTIONS = [
  { value: "casual", label: "Casual Gamers" },
  { value: "core", label: "Core Gamers" },
  { value: "hardcore", label: "Hardcore Gamers" },
  { value: "family", label: "Family-Friendly" },
  { value: "kids", label: "Kids (Under 13)" },
  { value: "teens", label: "Teens (13-17)" },
  { value: "adults", label: "Adults (18+)" },
  { value: "seniors", label: "Seniors (55+)" },
];

const PLAYER_PERSPECTIVE_OPTIONS = [
  { value: "first_person", label: "First Person" },
  { value: "third_person", label: "Third Person" },
  { value: "top_down", label: "Top-Down (Isometric)" },
  { value: "side_scrolling", label: "Side-Scrolling" },
  { value: "2d", label: "2D" },
  { value: "2.5d", label: "2.5D" },
  { value: "3d", label: "3D" },
  { value: "vr", label: "VR (Virtual Reality)" },
];

const MULTIPLAYER_OPTIONS = [
  { value: "none", label: "Single Player Only" },
  { value: "co-op", label: "Cooperative (Co-op)" },
  { value: "pvp", label: "Player vs Player (PvP)" },
  { value: "mixed", label: "Mixed (Co-op + PvP)" },
  { value: "mmO", label: "MMO (Massively Multiplayer)" },
  { value: "local_multiplayer", label: "Local Multiplayer" },
];

const ART_STYLE_OPTIONS = [
  { value: "realistic", label: "Realistic" },
  { value: "stylized", label: "Stylized" },
  { value: "pixel_art", label: "Pixel Art" },
  { value: "cartoon", label: "Cartoon/Anime" },
  { value: "low_poly", label: "Low Poly" },
  { value: "hand_drawn", label: "Hand-Drawn" },
  { value: "voxel", label: "Voxel" },
  { value: "minimalist", label: "Minimalist" },
  { value: "retro", label: "Retro" },
  { value: "noir", label: "Noir" },
];

const LEVEL_OF_DETAIL_OPTIONS = [
  { value: "concise", label: "Concise - Quick overview" },
  { value: "standard", label: "Standard - Balanced detail" },
  { value: "detailed", label: "Detailed - Comprehensive" },
  { value: "comprehensive", label: "Comprehensive - Full design document" },
];

const AiGameDesignAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    background_vibe: "",
    game_type: "",
    target_audience: "",
    player_perspective: "",
    multiplayer_support: "",
    game_goal: "",
    art_style: "",
    target_platforms: "",
    development_time_months: "12",
    budget_usd: "",
    core_gameplay_mechanics: "",
    game_moodatmosphere: "",
    games_for_inspiration_commaseparated: "",
    unique_features_or_requirements: "",
    level_of_detail_in_response: "standard"
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved form data');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRetryLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-game-design-agent-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Request failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRetryLoading(false);
    }
  };

  const handleRetry = () => {
    handleSubmit(new Event('submit') as any);
  };

  const backgroundVibeExamples = [
    "Sci-Fi space exploration with alien civilizations",
    "Dark fantasy kingdom with dragons and magic",
    "Cyberpunk neon city with hacker protagonists",
    "Post-apocalyptic survival world",
    "Cozy farming village life simulation",
  ];

  const gameGoalExamples = [
    "Survive and escape the haunted mansion",
    "Build and manage a thriving city",
    "Defeat all enemies and save the princess",
    "Explore unknown territories and discover secrets",
    "Achieve the highest score and dominate leaderboards",
  ];

  const platformsExamples = [
    "PC, PlayStation 5, Xbox Series X",
    "iOS, Android, Nintendo Switch",
    "PC, Mac, Linux, VR headsets",
    "All major platforms (cross-platform)",
    "Mobile only (iOS and Android)",
  ];

  const mechanicsExamples = [
    "Combat, exploration, puzzle solving",
    "Resource management, crafting, building",
    "Platforming, combat, stealth",
    "Turn-based battles, team synergy",
    "Real-time strategy, base building",
  ];

  const moodExamples = [
    "Dark and mysterious, with hidden dangers",
    "Light-hearted and whimsical adventure",
    "Tense and suspenseful horror atmosphere",
    "Epic and heroic, inspiring wonder",
    "Relaxing and peaceful, stress-free",
  ];

  const inspirationExamples = [
    "Minecraft, Terraria, Stardew Valley",
    "Zelda: Breath of the Wild, Elden Ring, Dark Souls",
    "Fortnite, Apex Legends, Call of Duty",
    "Among Us, Fall Guys, Jackbox Party Games",
    "The Witcher 3, Baldur's Gate 3, Cyberpunk 2077",
  ];

  const uniqueFeaturesExamples = [
    "Dynamic weather system affecting gameplay",
    "Procedurally generated worlds for replayability",
    "Advanced AI companions with memory",
    "Cross-platform multiplayer support",
    "Modding support and steam workshop integration",
  ];

  return (
    <>
      <Helmet>
        <title>AiGameDesignAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-game-design-agent-team to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">AI Game Design Agent Team</h1>
            <p className="text-xl text-gray-400">Create comprehensive game designs with AI-powered assistance</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Game Design Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <FormSection title="Core Game Concept" description="Define the fundamental elements of your game">
                  <div className="col-span-1 md:col-span-2">
                    <SmartInput
                      label="Background Vibe"
                      name="background_vibe"
                      value={formData.background_vibe}
                      onChange={(v) => updateField('background_vibe', v)}
                      placeholder="Enter the overall atmosphere and setting (e.g., Sci-Fi, Fantasy, Cyberpunk)"
                      helperText="Describe the genre, setting, and overall feel of your game world"
                      required
                    />
                    <ExamplePrompt
                      examples={backgroundVibeExamples}
                      onSelect={(v) => updateField('background_vibe', v)}
                      title="Try a vibe:"
                    />
                  </div>

                  <SelectDropdown
                    label="Game Type"
                    value={formData.game_type}
                    onValueChange={(v) => updateField('game_type', v)}
                    options={GAME_TYPE_OPTIONS}
                    placeholder="Select a game genre"
                    helperText="Choose the primary genre that best fits your game concept"
                    required
                  />

                  <SelectDropdown
                    label="Target Audience"
                    value={formData.target_audience}
                    onValueChange={(v) => updateField('target_audience', v)}
                    options={TARGET_AUDIENCE_OPTIONS}
                    placeholder="Select target audience"
                    helperText="Define who will play your game"
                    required
                  />
                </FormSection>

                <FormSection title="Gameplay & Experience" description="Define how players interact with your game">
                  <SelectDropdown
                    label="Player Perspective"
                    value={formData.player_perspective}
                    onValueChange={(v) => updateField('player_perspective', v)}
                    options={PLAYER_PERSPECTIVE_OPTIONS}
                    placeholder="Select camera type"
                    helperText="Choose how the player views and interacts with the game world"
                    required
                  />

                  <SelectDropdown
                    label="Multiplayer Support"
                    value={formData.multiplayer_support}
                    onValueChange={(v) => updateField('multiplayer_support', v)}
                    options={MULTIPLAYER_OPTIONS}
                    placeholder="Select multiplayer type"
                    helperText="Define the multiplayer experience for your game"
                    required
                  />

                  <div className="col-span-1 md:col-span-2">
                    <SmartInput
                      label="Game Goal"
                      name="game_goal"
                      value={formData.game_goal}
                      onChange={(v) => updateField('game_goal', v)}
                      placeholder="Describe what players aim to achieve (e.g., Survive, Build, Conquer)"
                      helperText="Define the primary objective players work toward"
                      required
                    />
                    <ExamplePrompt
                      examples={gameGoalExamples}
                      onSelect={(v) => updateField('game_goal', v)}
                      title="Try a goal:"
                    />
                  </div>

                  <SelectDropdown
                    label="Art Style"
                    value={formData.art_style}
                    onValueChange={(v) => updateField('art_style', v)}
                    options={ART_STYLE_OPTIONS}
                    placeholder="Select visual style"
                    helperText="Choose the artistic visual direction for your game"
                    required
                  />
                </FormSection>

                <FormSection title="Development Parameters" description="Set realistic constraints and expectations">
                  <div className="col-span-1 md:col-span-2">
                    <SmartInput
                      label="Target Platforms"
                      name="target_platforms"
                      value={formData.target_platforms}
                      onChange={(v) => updateField('target_platforms', v)}
                      placeholder="List target platforms (e.g., PC, PlayStation 5, Nintendo Switch)"
                      helperText="Specify all platforms you intend to release on"
                      required
                    />
                    <ExamplePrompt
                      examples={platformsExamples}
                      onSelect={(v) => updateField('target_platforms', v)}
                      title="Try platforms:"
                    />
                  </div>

                  <SmartInput
                    label="Development Time (months)"
                    name="development_time_months"
                    value={formData.development_time_months}
                    onChange={(v) => updateField('development_time_months', v)}
                    type="number"
                    placeholder="Estimated development timeline in months"
                    helperText="Set a realistic timeline for your development team"
                    required
                  />

                  <SmartInput
                    label="Budget (USD)"
                    name="budget_usd"
                    value={formData.budget_usd}
                    onChange={(v) => updateField('budget_usd', v)}
                    type="number"
                    placeholder="Enter budget in USD (e.g., 50000)"
                    helperText="Define your total budget for development"
                    required
                  />
                </FormSection>

                <FormSection title="Game Mechanics & Feel" description="Define gameplay systems and atmosphere">
                  <div className="col-span-1 md:col-span-2">
                    <SmartInput
                      label="Core Gameplay Mechanics"
                      name="core_gameplay_mechanics"
                      value={formData.core_gameplay_mechanics}
                      onChange={(v) => updateField('core_gameplay_mechanics', v)}
                      placeholder="List key mechanics (e.g., Combat, Exploration, Crafting)"
                      helperText="Describe the primary gameplay systems that drive your game"
                      required
                    />
                    <ExamplePrompt
                      examples={mechanicsExamples}
                      onSelect={(v) => updateField('core_gameplay_mechanics', v)}
                      title="Try mechanics:"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <SmartInput
                      label="Game Mood/Atmosphere"
                      name="game_moodatmosphere"
                      value={formData.game_moodatmosphere}
                      onChange={(v) => updateField('game_moodatmosphere', v)}
                      placeholder="Describe the emotional tone (e.g., Tense, Whimsical, Dark)"
                      helperText="Define the emotional experience you want players to feel"
                      required
                    />
                    <ExamplePrompt
                      examples={moodExamples}
                      onSelect={(v) => updateField('game_moodatmosphere', v)}
                      title="Try a mood:"
                    />
                  </div>
                </FormSection>

                <FormSection title="References & Extras" description="Provide inspiration and special requirements">
                  <div className="col-span-1 md:col-span-2">
                    <SmartTextarea
                      label="Games for Inspiration (comma-separated)"
                      name="games_for_inspiration_commaseparated"
                      value={formData.games_for_inspiration_commaseparated}
                      onChange={(v) => updateField('games_for_inspiration_commaseparated', v)}
                      placeholder="List games that inspire your design (e.g., Minecraft, Elden Ring, Among Us)"
                      helperText="Reference games that showcase features or styles you want to emulate"
                      required
                    />
                    <ExamplePrompt
                      examples={inspirationExamples}
                      onSelect={(v) => updateField('games_for_inspiration_commaseparated', v)}
                      title="Try inspiration:"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <SmartTextarea
                      label="Unique Features or Requirements"
                      name="unique_features_or_requirements"
                      value={formData.unique_features_or_requirements}
                      onChange={(v) => updateField('unique_features_or_requirements', v)}
                      placeholder="Describe any special features, innovations, or constraints"
                      helperText="List standout features or specific requirements for your game"
                      required
                    />
                    <ExamplePrompt
                      examples={uniqueFeaturesExamples}
                      onSelect={(v) => updateField('unique_features_or_requirements', v)}
                      title="Try features:"
                    />
                  </div>

                  <SelectDropdown
                    label="Level of Detail in Response"
                    value={formData.level_of_detail_in_response}
                    onValueChange={(v) => updateField('level_of_detail_in_response', v)}
                    options={LEVEL_OF_DETAIL_OPTIONS}
                    placeholder="Select detail level"
                    helperText="Choose how comprehensive the generated design document should be"
                    required
                  />
                </FormSection>

                <ActionButton
                  type="submit"
                  variant="primary"
                  loading={loading}
                  loadingText="Generating..."
                  disabled={loading}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Game Design
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Creating your game design..."
              subtext="Our AI agents are crafting a comprehensive design document for your game"
            />
          )}

          {error && (
            <ErrorMessage
              title="Failed to generate game design"
              message={error}
              onRetry={handleRetry}
              retryLoading={retryLoading}
            />
          )}

          {result && result.status === 'completed' && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<Gamepad2 className="h-5 w-5" />}
                  title="Game Design Document"
                  description="AI-generated comprehensive game design"
                  variant="info"
                >
                  <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                      {result.result}
                    </pre>
                  </div>
                </ResultCard>
              </ResultGrid>
            </motion.div>
          )}

          {!result && !loading && !error && (
            <EmptyState
              icon={<Gamepad2 className="h-16 w-16 text-gray-600" />}
              title="Ready to design your game"
              description="Fill in the configuration above and let our AI agents create a comprehensive game design document tailored to your vision."
              tips={[
                "Start with a clear background vibe and game type",
                "Define your target audience early",
                "List inspiration games to guide the AI",
                "Be specific about unique features",
                "Consider your budget and timeline constraints",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiGameDesignAgentTeamPage;
