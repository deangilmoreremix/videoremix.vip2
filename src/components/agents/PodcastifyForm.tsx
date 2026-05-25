import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Mic,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Headphones
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
// Using HTML textarea element instead
import { Alert, AlertDescription } from "../ui/alert";

const podcastifySchema = z.object({
  blogUrl: z.string().url("Please enter a valid URL"),
  customInstructions: z.string().optional(),
});

type PodcastifyForm = z.infer<typeof podcastifySchema>;

const processingStages = [
  { id: 'scrape', label: 'Scraping blog content', icon: FileText, duration: '10-15s' },
  { id: 'analyze', label: 'Analyzing content structure', icon: CheckCircle, duration: '15-20s' },
  { id: 'generate', label: 'Generating podcast script', icon: Mic, duration: '25-35s' },
  { id: 'finalize', label: 'Finalizing episode details', icon: Headphones, duration: '5-10s' },
];

interface PodcastifyFormProps {
  onSubmit: (data: PodcastifyForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
}

const PodcastifyForm: React.FC<PodcastifyFormProps> = ({
  onSubmit,
  isProcessing,
  currentStage = 0,
  error
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PodcastifyForm>({
    resolver: zodResolver(podcastifySchema),
    defaultValues: {
      blogUrl: '',
      customInstructions: ''
    }
  });

  const watchedUrl = watch('blogUrl');
  const isValidUrl = watchedUrl && !errors.blogUrl;

  const handleFormSubmit = async (data: PodcastifyForm) => {
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl"
        >
          <Mic className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">PodCastify AI</h2>
          <p className="text-lg text-gray-300">
            Transform any blog post into an engaging podcast episode
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
            <h3 className="text-lg font-semibold text-white">Converting Blog to Podcast</h3>
            <span className="text-sm text-gray-400">{Math.round(progressPercentage)}% Complete</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full"
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
                    isCurrent ? 'bg-purple-500/10 border border-purple-500/20' :
                    'bg-gray-700/30'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    isCompleted ? 'text-green-400' :
                    isCurrent ? 'text-purple-400' :
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
                      isCurrent ? 'text-purple-300' :
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
                <FileText className="h-5 w-5 mr-2 text-purple-400" />
                Blog Post Details
              </h3>
              <span className={`text-xs ${isValidUrl ? 'text-green-400' : 'text-gray-500'}`}>
                {isValidUrl ? '✓ Valid URL' : 'Enter blog URL'}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blogUrl" className="text-white font-medium">
                Blog Post URL *
              </Label>
              <Input
                id="blogUrl"
                type="url"
                placeholder="https://example.com/blog-post-url"
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                {...register('blogUrl')}
              />
              {errors.blogUrl && (
                <p className="text-sm text-red-400">{errors.blogUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customInstructions" className="text-white font-medium">
                Custom Instructions (Optional)
              </Label>
              <textarea
                id="customInstructions"
                placeholder="Any specific style preferences, tone, or focus areas for the podcast episode..."
                className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 rounded-md px-3 py-2 min-h-[80px] resize-none w-full"
                {...register('customInstructions')}
              />
              <p className="text-xs text-gray-500">
                e.g., "Make it conversational and engaging", "Focus on practical takeaways", "Keep it under 1000 words"
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isValidUrl}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating Podcast...</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  <span>Create Podcast Episode</span>
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
          Takes 1-2 minutes to analyze the blog and generate a professional podcast script with key takeaways
        </p>
      </motion.div>
    </div>
  );
};

export default PodcastifyForm;