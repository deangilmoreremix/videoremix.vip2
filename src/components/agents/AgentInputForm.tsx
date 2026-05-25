import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

const salesIntelligenceSchema = z.object({
  competitor: z.string().min(1, "Competitor company name is required"),
  product: z.string().min(1, "Your product name is required"),
  industry: z.string().optional(),
  context: z.string().optional(),
});

type SalesIntelligenceForm = z.infer<typeof salesIntelligenceSchema>;

const processingStages = [
  { id: 'research', label: 'Researching competitor profile', icon: Search, duration: '20-30s' },
  { id: 'features', label: 'Analyzing product features', icon: Building2, duration: '25-35s' },
  { id: 'positioning', label: 'Uncovering positioning strategy', icon: Zap, duration: '20-30s' },
  { id: 'swot', label: 'Creating SWOT analysis', icon: CheckCircle, duration: '15-25s' },
  { id: 'objections', label: 'Generating objection scripts', icon: AlertCircle, duration: '20-30s' },
  { id: 'battlecard', label: 'Building battle card', icon: ArrowRight, duration: '15-25s' },
  { id: 'visual', label: 'Creating comparison visual', icon: Info, duration: '10-20s' },
];

interface AgentInputFormProps {
  onSubmit: (data: SalesIntelligenceForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
}

const AgentInputForm: React.FC<AgentInputFormProps> = ({
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
    reset
  } = useForm<SalesIntelligenceForm>({
    resolver: zodResolver(salesIntelligenceSchema),
    defaultValues: {
      competitor: '',
      product: '',
      industry: '',
      context: ''
    }
  });

  const handleFormSubmit = async (data: SalesIntelligenceForm) => {
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
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl"
        >
          <Search className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">SalesForce AI</h2>
          <p className="text-lg text-gray-300">
            Generate comprehensive sales battle cards against any competitor
          </p>
        </div>
      </div>

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

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Analyzing Competitor</h3>
            <span className="text-sm text-gray-400">{Math.round(progressPercentage)}% Complete</span>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

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

      {!isProcessing && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="competitor" className="text-white font-medium">
                Competitor Company *
              </Label>
              <Input
                id="competitor"
                placeholder="e.g., Salesforce, HubSpot, Slack"
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                {...register('competitor')}
              />
              {errors.competitor && (
                <p className="text-sm text-red-400">{errors.competitor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product" className="text-white font-medium">
                Your Product *
              </Label>
              <Input
                id="product"
                placeholder="e.g., Pipedrive, Zoho CRM, Discord"
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                {...register('product')}
              />
              {errors.product && (
                <p className="text-sm text-red-400">{errors.product.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-white font-medium">
              Industry Context (Optional)
            </Label>
            <Input
              id="industry"
              placeholder="e.g., B2B SaaS, Marketing, Sales, HR"
              className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              {...register('industry')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context" className="text-white font-medium">
              Additional Context (Optional)
            </Label>
            <textarea
              id="context"
              placeholder="Any specific deal details, concerns, or competitive situation..."
              className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 rounded-md px-3 py-2 min-h-[100px] w-full resize-none"
              {...register('context')}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting Analysis...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Generate Battle Card</span>
                </>
              )}
            </Button>
          </div>
        </motion.form>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-sm text-gray-400">
          Takes 2-3 minutes to generate a comprehensive battle card with research, analysis, and visual comparison
        </p>
      </motion.div>
    </div>
  );
};

export default AgentInputForm;