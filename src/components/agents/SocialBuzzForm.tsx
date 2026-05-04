import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  Twitter,
  Linkedin,
  Facebook
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

const socialbuzzSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'all']).optional(),
  timeframe: z.enum(['day', 'week', 'month']).optional(),
});

type SocialBuzzForm = z.infer<typeof socialbuzzSchema>;

const processingStages = [
  { id: 'gather', label: 'Gathering social media data', icon: Search, duration: '15-20s' },
  { id: 'analyze', label: 'Analyzing sentiment patterns', icon: Users, duration: '20-25s' },
  { id: 'insights', label: 'Extracting key insights', icon: TrendingUp, duration: '15-20s' },
  { id: 'recommend', label: 'Generating recommendations', icon: BarChart3, duration: '10-15s' },
];

const platformOptions = [
  { value: 'all', label: 'All Platforms', icon: Search },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
];

const timeframeOptions = [
  { value: 'day', label: 'Last 24 hours' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
];

interface SocialBuzzFormProps {
  onSubmit: (data: SocialBuzzForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
}

const SocialBuzzForm: React.FC<SocialBuzzFormProps> = ({
  onSubmit,
  isProcessing,
  currentStage = 0,
  error
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SocialBuzzForm>({
    resolver: zodResolver(socialbuzzSchema),
    defaultValues: {
      topic: '',
      platform: 'all',
      timeframe: 'week'
    }
  });

  const watchedTopic = watch('topic');
  const watchedPlatform = watch('platform');
  const inputLength = watchedTopic?.length || 0;

  const handleFormSubmit = async (data: SocialBuzzForm) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = isProcessing ? ((currentStage + 1) / processingStages.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl"
        >
          <TrendingUp className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">SocialBuzz AI</h2>
          <p className="text-lg text-gray-300">
            Real-time social media intelligence and sentiment analysis
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Analyzing Social Media Buzz</h3>
            <span className="text-sm text-gray-400">{Math.round(progressPercentage)}% Complete</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Current Stage */}
          <div className="space-y-3">
            {processingStages.map((stage, index) => {
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;
              const isPending = index > currentStage;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isCompleted ? 'bg-green-500/10 border border-green-500/20' :
                    isCurrent ? 'bg-blue-500/10 border border-blue-500/20' :
                    'bg-gray-700/30'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    isCompleted ? 'text-green-400' :
                    isCurrent ? 'text-blue-400' :
                    'text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <stage.icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isCompleted ? 'text-green-300' :
                      isCurrent ? 'text-blue-300' :
                      'text-gray-400'
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-gray-500">{stage.duration}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Input Form */}
      {!isProcessing && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
                Social Media Analysis
              </h3>
              <span className={`text-xs ${inputLength >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                {inputLength}/2+ characters
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className="text-white font-medium">
                Topic or Keyword *
              </Label>
              <Input
                id="topic"
                placeholder="e.g., artificial intelligence, remote work, electric vehicles"
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                {...register('topic')}
              />
              {errors.topic && (
                <p className="text-sm text-red-400">{errors.topic.message}</p>
              )}
            </div>
          </div>

          {/* Platform and Timeframe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-white font-medium">Platform (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {platformOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue('platform', option.value as any)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                        watchedPlatform === option.value
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-gray-600 bg-gray-900/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-white font-medium">Timeframe (Optional)</Label>
              <div className="space-y-2">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('timeframe', option.value as any)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      watch('timeframe') === option.value
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-gray-600 bg-gray-900/50 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || inputLength < 2}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing Social Buzz...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  <span>Analyze Social Media</span>
                </>
              )}
            </Button>
          </div>
        </motion.form>
      )}

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-sm text-gray-400">
          Takes 1-2 minutes to analyze social media sentiment, trends, and engagement patterns across platforms
        </p>
      </motion.div>
    </div>
  );
};

export default SocialBuzzForm;