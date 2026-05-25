import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Target,
  MapPin,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FileText,
  Briefcase,
  Lightbulb
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";

const consultationSchema = z.object({
  question: z.string().min(10, "Business question must be at least 10 characters"),
  industry: z.string().min(1, "Industry selection is required"),
  stage: z.enum(['idea', 'startup', 'growth', 'enterprise'], {
    errorMap: () => ({ message: "Business stage selection is required" })
  }),
  context: z.string().optional(),
  goals: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

const industryOptions = [
  { value: 'technology', label: 'Technology/SaaS' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance/FinTech' },
  { value: 'retail', label: 'Retail/E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting Services' },
  { value: 'education', label: 'Education' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
];

const stageOptions = [
  { value: 'idea', label: 'Idea Stage - Just getting started' },
  { value: 'startup', label: 'Startup - Product launched, finding fit' },
  { value: 'growth', label: 'Growth - Scaling the business' },
  { value: 'enterprise', label: 'Enterprise - Established company' },
];

const processingStages = [
  { id: 'research', label: 'Research & Analysis', icon: FileText, duration: '45-60s' },
  { id: 'market', label: 'Market Intelligence', icon: TrendingUp, duration: '35-45s' },
  { id: 'strategy', label: 'Strategic Recommendations', icon: Target, duration: '40-50s' },
  { id: 'roadmap', label: 'Implementation Roadmap', icon: MapPin, duration: '30-40s' },
  { id: 'risks', label: 'Risk Assessment', icon: AlertTriangle, duration: '25-35s' },
];

interface ConsultProFormProps {
  onSubmit: (data: ConsultationForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
}

const ConsultProForm: React.FC<ConsultProFormProps> = ({
  onSubmit,
  isProcessing,
  currentStage = 0,
  error
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      question: '',
      industry: '',
      stage: undefined,
      context: '',
      goals: '',
      budget: '',
      timeline: ''
    }
  });

  const watchedQuestion = watch('question');
  const questionLength = watchedQuestion?.length || 0;

  const handleFormSubmit = async (data: ConsultationForm) => {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl"
        >
          <Users className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">ConsultPro AI</h2>
          <p className="text-lg text-gray-300">
            Expert business consultation powered by AI market intelligence
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
            <h3 className="text-lg font-semibold text-white">Conducting Business Analysis</h3>
            <span className="text-sm text-gray-400">{Math.round(progressPercentage)}% Complete</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full"
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
          {/* Business Question */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-purple-400" />
                Business Challenge
              </h3>
              <span className={`text-xs ${questionLength >= 10 ? 'text-green-400' : 'text-gray-500'}`}>
                {questionLength}/10+ characters
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question" className="text-white font-medium">
                What business question or challenge can I help you with? *
              </Label>
            <textarea
              id="question"
              placeholder="e.g., Should I launch my SaaS product now or wait for more funding? How can I compete against established players in the fintech space? What's my best strategy for entering the healthcare market?"
              className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 rounded-md px-3 py-2 min-h-[120px] resize-none w-full"
              {...register('question')}
            />
              {errors.question && (
                <p className="text-sm text-red-400">{errors.question.message}</p>
              )}
            </div>
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-white font-medium">
                Industry *
              </Label>
              <select
                {...register('industry')}
                className="bg-gray-900/50 border border-gray-600 text-white focus:border-purple-500 rounded-md px-3 py-2 w-full"
              >
                <option value="">Select your industry</option>
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-sm text-red-400">{errors.industry.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage" className="text-white font-medium">
                Business Stage *
              </Label>
              <select
                {...register('stage')}
                className="bg-gray-900/50 border border-gray-600 text-white focus:border-purple-500 rounded-md px-3 py-2 w-full"
              >
                <option value="">Select business stage</option>
                {stageOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.stage && (
                <p className="text-sm text-red-400">{errors.stage.message}</p>
              )}
            </div>
          </div>

          {/* Additional Context */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Additional Context</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="context" className="text-white font-medium">
                  Current Situation (Optional)
                </Label>
              <textarea
                id="context"
                placeholder="Describe your current business situation, team size, funding status, etc."
                className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 rounded-md px-3 py-2 min-h-[80px] resize-none w-full"
                {...register('context')}
              />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals" className="text-white font-medium">
                  Business Goals (Optional)
                </Label>
                <textarea
                  id="goals"
                  placeholder="What are you trying to achieve? Revenue targets, market share, etc."
                  className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 rounded-md px-3 py-2 min-h-[80px] resize-none w-full"
                  {...register('goals')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-white font-medium">
                  Budget Constraints (Optional)
                </Label>
                <Input
                  id="budget"
                  placeholder="e.g., $50K available, bootstrapped, seeking funding"
                  className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  {...register('budget')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline" className="text-white font-medium">
                  Decision Timeline (Optional)
                </Label>
                <Input
                  id="timeline"
                  placeholder="e.g., Need answer within 2 weeks, planning for next quarter"
                  className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  {...register('timeline')}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting Consultation...</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5" />
                  <span>Get Business Consultation</span>
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
          Takes 3-4 minutes to generate comprehensive business consultation with market analysis, strategic recommendations, and implementation roadmap
        </p>
      </motion.div>
    </div>
  );
};


export default ConsultProForm;
