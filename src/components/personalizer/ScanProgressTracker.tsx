import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';
import { ScanEvent, ScanJob } from '../../types/personalization';

interface ScanProgressTrackerProps {
  job: ScanJob | null;
  events: ScanEvent[];
}

const STEPS = [
  { id: 'initiate', name: 'Initiating Scan', description: 'Starting background scan job' },
  { id: 'scan', name: 'Platform Scanning', description: 'Searching 500+ platforms' },
  { id: 'analyze', name: 'Analysis', description: 'Processing discovered profiles' },
  { id: 'graph', name: 'Graph Building', description: 'Creating identity relationships' },
  { id: 'generate', name: 'Asset Generation', description: 'Creating personalized content' },
  { id: 'complete', name: 'Complete', description: 'Ready for review' },
];

export default function ScanProgressTracker({ job, events }: ScanProgressTrackerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!job) return;

    const eventStepMap: Record<string, number> = {
      initiate: 0,
      scan: 1,
      analyze: 2,
      graph: 3,
      generate: 4,
      complete: 5,
    };

    events.forEach((event) => {
      const stepNumber = eventStepMap[event.step_name];
      if (stepNumber !== undefined && stepNumber > currentStep) {
        setCurrentStep(stepNumber);
      }
    });
  }, [events, job]);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return job?.status === 'failed' ? 'failed' : 'active';
    return 'pending';
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white font-display">Scan Progress</h3>
        {job && (
          <span className="text-xs text-gray-400 font-body">
            {job.current_step || 'Starting...'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const status = getStepStatus(index);

          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="relative flex-shrink-0 mt-0.5">
                {status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
                {status === 'active' && (
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                )}
                {status === 'failed' && (
                  <XCircle className="w-5 h-5 text-danger" />
                )}
                {status === 'pending' && (
                  <Clock className="w-5 h-5 text-gray-500" />
                )}
              </div>

              <div className="flex-1">
                <p className={`text-sm font-medium font-body ${
                  status === 'completed' ? 'text-success' :
                  status === 'active' ? 'text-primary-300' :
                  status === 'failed' ? 'text-danger' : 'text-gray-400'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500 font-body">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {job?.status === 'failed' && job.error_message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-danger/20 border border-danger/50 rounded-lg"
          >
            <p className="text-sm text-danger font-body">{job.error_message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}