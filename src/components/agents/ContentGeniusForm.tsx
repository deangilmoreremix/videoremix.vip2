import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Users,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Mic,
  Zap
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent } from "../ui/card";

const contentGeniusSchema = z.object({
  content: z.string().min(50, "Meeting content must be at least 50 characters"),
  contentType: z.enum(['transcript', 'audio', 'notes']),
  meetingTitle: z.string().optional(),
  attendees: z.string().optional(),
  meetingDate: z.string().optional(),
});

type ContentGeniusForm = z.infer<typeof contentGeniusSchema>;

const processingStages = [
  { id: 'analyze', label: 'Analyzing meeting structure', icon: FileText, duration: '10-15s' },
  { id: 'decisions', label: 'Extracting key decisions', icon: CheckCircle, duration: '15-20s' },
  { id: 'actions', label: 'Identifying action items', icon: Zap, duration: '15-20s' },
  { id: 'sentiment', label: 'Analyzing discussion tone', icon: Users, duration: '10-15s' },
  { id: 'summary', label: 'Generating summary & insights', icon: Clock, duration: '10-15s' },
];

interface ContentGeniusFormProps {
  onSubmit: (data: ContentGeniusForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
}

const ContentGeniusForm: React.FC<ContentGeniusFormProps> = ({
  onSubmit,
  isProcessing,
  currentStage = 0,
  error
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<'transcript' | 'audio' | 'notes'>('transcript');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ContentGeniusForm>({
    resolver: zodResolver(contentGeniusSchema),
    defaultValues: {
      content: '',
      contentType: 'transcript',
      meetingTitle: '',
      attendees: '',
      meetingDate: ''
    }
  });

  const watchedContent = watch('content');

  const handleFormSubmit = async (data: ContentGeniusForm) => {
    setIsSubmitting(true);
    try {
      // Process attendees string into array
      const attendeesArray = data.attendees
        ? data.attendees.split(',').map(a => a.trim()).filter(a => a)
        : undefined;

      await onSubmit({
        ...data,
        attendees: attendeesArray
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For demo purposes, we'll just show the file name
    // In production, you'd upload the file and process it
    setValue('content', `File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  const progressPercentage = isProcessing ? ((currentStage + 1) / processingStages.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-500 rounded-2xl"
        >
          <FileText className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">ContentGenius AI</h2>
          <p className="text-lg text-gray-300">
            Transform meeting content into actionable insights and summaries
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
            <h3 className="text-lg font-semibold text-white">Analyzing Meeting Content</h3>
            <span className="text-sm text-gray-400">{Math.round(progressPercentage)}% Complete</span>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-purple-500 h-2 rounded-full"
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
          {/* Content Type Selection */}
          <div className="space-y-4">
            <Label className="text-white font-medium">Content Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'transcript', label: 'Meeting Transcript', icon: FileText },
                { value: 'audio', label: 'Audio Recording', icon: Mic },
                { value: 'notes', label: 'Meeting Notes', icon: FileText }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setContentType(type.value as any);
                    setValue('contentType', type.value as any);
                  }}
                  className={`p-4 rounded-lg border transition-colors ${
                    contentType === type.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-gray-600 hover:border-gray-500 text-gray-400'
                  }`}
                >
                  <type.icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="meetingTitle" className="text-white font-medium">
                Meeting Title (Optional)
              </Label>
              <Input
                id="meetingTitle"
                placeholder="e.g., Q1 Planning Meeting"
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                {...register('meetingTitle')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingDate" className="text-white font-medium">
                Meeting Date (Optional)
              </Label>
              <Input
                id="meetingDate"
                type="date"
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                {...register('meetingDate')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees" className="text-white font-medium">
              Attendees (Optional)
            </Label>
            <Input
              id="attendees"
              placeholder="e.g., John Doe, Jane Smith, Bob Johnson"
              className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              {...register('attendees')}
            />
            <p className="text-xs text-gray-400">Separate names with commas</p>
          </div>

          {/* Content Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-white font-medium">
                Meeting Content *
              </Label>
              {contentType === 'audio' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label
                    htmlFor="audio-upload"
                    className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Audio</span>
                  </label>
                </div>
              )}
            </div>

            <Textarea
              id="content"
              placeholder={
                contentType === 'transcript'
                  ? "Paste your meeting transcript here..."
                  : contentType === 'audio'
                  ? "Upload an audio file above or paste transcript..."
                  : "Enter your meeting notes here..."
              }
              className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 min-h-[200px] resize-none"
              {...register('content')}
            />

            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-400">
                {watchedContent?.length || 0} characters
              </div>
              {errors.content && (
                <p className="text-red-400">{errors.content.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-500 hover:to-purple-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing Meeting...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Analyze Meeting</span>
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
          Takes 1-2 minutes to analyze and extract insights from your meeting content
        </p>
      </motion.div>
    </div>
  );
};

export default ContentGeniusForm;
