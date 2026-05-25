import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Heart, Activity } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-health-fitness-agent';

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (little or no exercise)" },
  { value: "light", label: "Light (exercise 1-3 days/week)" },
  { value: "moderate", label: "Moderate (exercise 3-5 days/week)" },
  { value: "active", label: "Active (daily exercise)" },
  { value: "very_active", label: "Very Active (intense daily exercise)" },
];

const DIETARY_PREFERENCES = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Ketogenic" },
  { value: "paleo", label: "Paleo" },
  { value: "gluten_free", label: "Gluten-Free" },
  { value: "dairy_free", label: "Dairy-Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const FITNESS_GOALS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "endurance", label: "Improve Endurance" },
  { value: "flexibility", label: "Improve Flexibility" },
  { value: "general_health", label: "General Health" },
  { value: "athletic_performance", label: "Athletic Performance" },
];

const AiHealthFitnessAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [dietaryPreferences, setDietaryPreferences] = useState("none");
  const [fitnessGoals, setFitnessGoals] = useState("general_health");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGeminiApiKey(parsed.geminiApiKey || "");
        setAge(parsed.age || "");
        setHeightCm(parsed.heightCm || "");
        setWeightKg(parsed.weightKg || "");
        setSex(parsed.sex || "male");
        setActivityLevel(parsed.activityLevel || "moderate");
        setDietaryPreferences(parsed.dietaryPreferences || "none");
        setFitnessGoals(parsed.fitnessGoals || "general_health");
        setQuery(parsed.query || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      geminiApiKey, age, heightCm, weightKg, sex, activityLevel, dietaryPreferences, fitnessGoals, query
    }));
  }, [geminiApiKey, age, heightCm, weightKg, sex, activityLevel, dietaryPreferences, fitnessGoals, query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || !heightCm || !weightKg) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-health-fitness-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: geminiApiKey,
          age,
          height_cm: heightCm,
          activity_level: activityLevel,
          dietary_preferences: dietaryPreferences,
          weight_kg: weightKg,
          sex,
          fitness_goals: fitnessGoals,
          what_would_you_like_to_know: query,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeminiApiKey("");
    setAge("");
    setHeightCm("");
    setWeightKg("");
    setSex("male");
    setActivityLevel("moderate");
    setDietaryPreferences("none");
    setFitnessGoals("general_health");
    setQuery("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Analysing your health data..." subtext="Generating personalised fitness and nutrition recommendations" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Health Analysis - AiHealthFitnessAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl mb-6">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Analysis Complete</h1>
              <p className="text-xl text-gray-400">Your personalised health recommendations are ready</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<Heart />}
                title="BMI"
                value={result.bmi || "—"}
                subtext="Body Mass Index"
                variant="info"
              />
              <ResultCard
                icon={<Activity />}
                title="Daily Calories"
                value={result.dailyCalories || result.calories || "—"}
                subtext="Estimated daily needs"
                variant="success"
              />
              <ResultCard
                icon={<Heart />}
                title="Protein Goal"
                value={result.proteinGrams || result.protein || "—"}
                subtext="grams per day"
                variant="info"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Recommendations</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                New Analysis
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AiHealthFitnessAgent - VideoRemix.vip</title>
        <meta name="description" content="Get personalised fitness and nutrition recommendations based on your health data." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl mb-6">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Health Fitness Agent</h1>
            <p className="text-xl text-gray-400">Get personalised health and fitness recommendations</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Your Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartInput
                  label="Gemini API Key"
                  name="geminiApiKey"
                  value={geminiApiKey}
                  onChange={setGeminiApiKey}
                  type="password"
                  placeholder="AIza... (required for health analysis)"
                  helperText="Get your Gemini API key from aistudio.google.com"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SmartInput
                    label="Age *"
                    name="age"
                    value={age}
                    onChange={setAge}
                    type="number"
                    placeholder="30"
                    helperText="Your current age"
                    required
                  />
                  <SmartInput
                    label="Height (cm) *"
                    name="heightCm"
                    value={heightCm}
                    onChange={setHeightCm}
                    type="number"
                    placeholder="175"
                    helperText="Height in centimetres"
                    required
                  />
                  <SmartInput
                    label="Weight (kg) *"
                    name="weightKg"
                    value={weightKg}
                    onChange={setWeightKg}
                    type="number"
                    placeholder="70"
                    helperText="Weight in kilograms"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectDropdown
                    label="Sex *"
                    value={sex}
                    onValueChange={setSex}
                    options={SEX_OPTIONS}
                    helperText="Used for calorie calculations"
                  />
                  <SelectDropdown
                    label="Activity Level *"
                    value={activityLevel}
                    onValueChange={setActivityLevel}
                    options={ACTIVITY_LEVELS}
                    helperText="Average daily physical activity"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectDropdown
                    label="Dietary Preferences *"
                    value={dietaryPreferences}
                    onValueChange={setDietaryPreferences}
                    options={DIETARY_PREFERENCES}
                    helperText="Any dietary restrictions"
                  />
                  <SelectDropdown
                    label="Fitness Goals *"
                    value={fitnessGoals}
                    onValueChange={setFitnessGoals}
                    options={FITNESS_GOALS}
                    helperText="Your primary fitness objective"
                  />
                </div>

                <SmartTextarea
                  label="Your Question"
                  name="query"
                  value={query}
                  onChange={setQuery}
                  placeholder="What would you like to know? e.g., 'Create a meal plan for muscle gain' or 'What exercises should I do for weight loss?'"
                  helperText="Ask any health or fitness related question"
                  required
                  rows={3}
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!age || !heightCm || !weightKg}>
                    <Heart className="h-4 w-4" />
                    Get Recommendations
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Heart className="h-16 w-16 text-gray-600" />}
            title="No recommendations yet"
            description="Enter your health data and ask a question to get personalised fitness and nutrition advice"
            tips={[
              "Be specific about your fitness goals",
              "Include any health conditions or injuries",
              "Ask about meal plans, workout routines, or supplements",
              "The more detail you provide, the better the recommendations"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiHealthFitnessAgentPage;