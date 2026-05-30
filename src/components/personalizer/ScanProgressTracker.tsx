import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { ScanEvent } from '../../types/personalization';

interface ScanProgressTrackerProps {
  events: ScanEvent[];
  currentStep?: string;
  status?: 'pending' | 'processing' | 'complete' | 'failed';
}

const STEPS = [
  { id: 'github', label: 'Searching GitHub', icon: '🔍' },
  { id: 'websites', label: 'Searching Websites', icon: '🌐' },
  { id: 'profiles', label: 'Searching Profiles', icon: '👤' },
  { id: 'graph', label: 'Building Identity Graph', icon: '🔗' },
  { id: 'analysis', label: 'Running AI Analysis', icon: '🧠' },
  { id: 'assets', label: 'Generating Assets', icon: '🎨' },
] as const;

const ScanProgressTracker: React.FC<ScanProgressTrackerProps> = ({ events, currentStep, status }) => {
  const getStepStatus = (stepId: string): 'complete' | 'current' | 'pending' => {
    const stepEvents = events.filter(e => e.step === stepId);
    if (stepEvents.some(e => e.status === 'failed')) return 'pending';
    if (stepEvents.some(e => e.status === 'complete')) return 'complete';
    if (currentStep === stepId) return 'current';
    return 'pending';
  };

  const overallProgress = events.length > 0 
    ? Math.round((events.filter(e => e.status === 'complete').length / STEPS.length) * 100)
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Scan Progress</span>
          <span className="text-primary-400 font-medium">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const stepEvents = events.filter(e => e.step === step.id);
          const latestMessage = stepEvents[stepEvents.length - 1]?.message;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex-shrink-0">
                {stepStatus === 'complete' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                ) : stepStatus === 'current' ? (
                  <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  stepStatus === 'complete' ? 'text-green-400' :
                  stepStatus === 'current' ? 'text-primary-400' :
                  'text-gray-500'
                }`}>
                  {step.icon} {step.label}
                </p>
                {latestMessage && (
                  <p className="text-xs text-gray-400 mt-0.5">{latestMessage}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Status Badge */}
      {status && (
        <div className="mt-6 flex justify-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            status === 'complete' ? 'bg-green-500/20 text-green-300' :
            status === 'failed' ? 'bg-red-500/20 text-red-300' :
            'bg-primary-500/20 text-primary-300'
          }`}>
            {status === 'complete' ? 'Scan Complete' :
             status === 'failed' ? 'Scan Failed' :
             'Scanning...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ScanProgressTracker;