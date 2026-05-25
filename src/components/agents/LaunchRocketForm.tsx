import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Rocket,
  Building2,
  Users,
  BarChart3,
  Lightbulb,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Target
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
// Using HTML select elements instead of custom Select component
import { Alert, AlertDescription } from "../ui/alert";

const launchIntelligenceSchema = z.object({
  product: z.string().min(1, "Product name is required"),
  market: z.string().min(1, "Target market is required"),
  competitors: z.array(z.string()).min(1, "At least one competitor is required").max(3, "Maximum 3 competitors allowed"),
  timeline: z.enum(['immediate', '3months', '6months', '1year']).optional(),
  context: z.string().optional(),
});

type LaunchIntelligenceForm = z.infer<typeof launchIntelligenceSchema>;

const marketOptions = [
  { value: 'b2b-saas', label: 'B2B SaaS' },
  { value: 'consumer-app', label: 'Consumer App' },
  { value: 'hardware', label: 'Hardware/IoT' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'other', label: 'Other' },
];

const timelineOptions = [
  { value: 'immediate', label: 'Immediate (within 1 month)' },
  { value: '3months', label: '3 months' },
  { value: '6months', label: '6 months' },
  { value: '1year', label: '1 year or more' },
];

const processingStages = [
  { id: 'competitor', label: 'Analyzing competitor landscape', icon: Building2, duration: '30-45s' },
  { id: 'sentiment', label: 'Gathering market sentiment', icon: Users, duration: '25-35s' },
  { id: 'metrics', label: 'Calculating launch metrics', icon: BarChart3, duration: '20-30s' },
  { id: 'recommendations', label: 'Generating strategic recommendations', icon: Lightbulb, duration: '15-25s' },
];

interface LaunchRocketFormProps {
  onSubmit: (data: LaunchIntelligenceForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
}

const LaunchRocketForm: React.FC<LaunchRocketFormProps> = ({
  onSubmit,
  isProcessing,
  currentStage = 0,
  error
}) => {
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LaunchIntelligenceForm>({
    resolver: zodResolver(launchIntelligenceSchema),
    defaultValues: {
      product: '',
      market: '',
      competitors: [''],
      timeline: undefined,
      context: ''
    }
  });

  const watchedCompetitors = watch('competitors');

  const addCompetitor = () => {
    if (competitors.length < 3) {
      const newCompetitors = [...competitors, ''];
      setCompetitors(newCompetitors);
      setValue('competitors', newCompetitors);
    }
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length > 1) {
      const newCompetitors = competitors.filter((_, i) => i !== index);
      setCompetitors(newCompetitors);
      setValue('competitors', newCompetitors);
    }
  };

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
    setValue('competitors', newCompetitors);
  };

  const handleFormSubmit = async (data: LaunchIntelligenceForm) => {
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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-600 to-red-500 rounded-2xl"
        >
          <Rocket className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">LaunchRocket AI</h2>
          <p className="text-lg text-gray-300">
            AI-powered product launch intelligence for GTM success
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
            <h3 className="text-lg font-semibold text-white">Generating Launch Intelligence</h3>
            <span className="text-sm text-gray-400">{Math.round(progressPercentage)}% Complete</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-orange-600 to-red-500 h-2 rounded-full"
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
                    isCurrent ? 'bg-orange-500/10 border border-orange-500/20' :
                    'bg-gray-700/30'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    isCompleted ? 'text-green-400' :
                    isCurrent ? 'text-orange-400' :
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
                      isCurrent ? 'text-orange-300' :
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
          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Target className="h-5 w-5 mr-2 text-orange-400" />
              Product Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product" className="text-white font-medium">
                  Product/Service Name *
                </Label>
                <Input
                  id="product"
                  placeholder="e.g., TaskFlow Pro, HealthAI Assistant"
                  className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                  {...register('product')}
                />
                {errors.product && (
                  <p className="text-sm text-red-400">{errors.product.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="market" className="text-white font-medium">
                  Target Market *
                </Label>
                <select
                  {...register('market')}
                  className="bg-gray-900/50 border border-gray-600 text-white focus:border-orange-500 rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select market category</option>
                  {marketOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.market && (
                  <p className="text-sm text-red-400">{errors.market.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-orange-400" />
                Key Competitors (1-3)
              </h3>
              {competitors.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetitor}
                  className="text-orange-400 border-orange-400 hover:bg-orange-400 hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Competitor
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Competitor ${index + 1} name`}
                    value={competitor}
                    onChange={(e) => updateCompetitor(index, e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                  />
                  {competitors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCompetitor(index)}
                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.competitors && (
              <p className="text-sm text-red-400">{errors.competitors.message}</p>
            )}
          </div>

          {/* Timeline and Context */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Launch Planning</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeline" className="text-white font-medium">
                  Launch Timeline (Optional)
                </Label>
                <select
                  {...register('timeline')}
                  className="bg-gray-900/50 border border-gray-600 text-white focus:border-orange-500 rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select timeline (optional)</option>
                  {timelineOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context" className="text-white font-medium">
                Additional Context (Optional)
              </Label>
            <textarea
              id="context"
              placeholder="Any specific market conditions, unique value propositions, or competitive concerns..."
              className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 rounded-md px-3 py-2 min-h-[100px] w-full resize-none"
              {...register('context')}
            />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Launching Analysis...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  <span>Generate Launch Intelligence</span>
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
          Takes 2-3 minutes to generate comprehensive launch intelligence with competitor analysis, market sentiment, and strategic recommendations
        </p>
      </motion.div>
    </div>
  );
};


export default LaunchRocketForm;
