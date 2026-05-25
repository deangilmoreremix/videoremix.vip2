import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Check from 'lucide-react/dist/esm/icons/check.js';
import X from 'lucide-react/dist/esm/icons/x.js';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';

interface ComparisonRow {
  feature: string;
  generic: string | boolean;
  personalized: string | boolean;
  lift?: string;
}

interface ComparisonTableProps {
  className?: string;
  title?: string;
  rows: ComparisonRow[];
}

const InteractiveComparisonTable: React.FC<ComparisonTableProps> = ({
  className = '',
  title = 'Generic vs. Personalized Marketing',
  rows,
}) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [animateResults, setAnimateResults] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAnimateResults(!animateResults)}
          className="bg-primary-900/40 text-primary-400 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          {animateResults ? 'Hide Animation' : 'Animate Results'}
        </motion.button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm font-medium pb-4">Feature</th>
              <th className="text-center text-gray-400 text-sm font-medium pb-4">Generic</th>
              <th className="text-center text-gray-400 text-sm font-medium pb-4">Personalized</th>
              <th className="text-right text-gray-400 text-sm font-medium pb-4">Lift</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={index}
                className="border-b border-gray-800"
                onHoverStart={() => setHoveredRow(index)}
                onHoverEnd={() => setHoveredRow(null)}
                animate={{
                  backgroundColor: hoveredRow === index ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                }}
                transition={{ duration: 0.2 }}
              >
                <td className="py-4 text-white font-medium">{row.feature}</td>
                <td className="py-4 text-center">
                  {typeof row.generic === 'boolean' ? (
                    row.generic ? (
                      <Check className="h-5 w-5 text-gray-500 inline" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 inline" />
                    )
                  ) : (
                    <span className="text-gray-400">{row.generic}</span>
                  )}
                </td>
                <td className="py-4 text-center">
                  {typeof row.personalized === 'boolean' ? (
                    row.personalized ? (
                      <Check className="h-5 w-5 text-green-500 inline" />
                    ) : (
                      <X className="h-5 w-5 text-gray-500 inline" />
                    )
                  ) : (
                    <span className="text-green-400 font-medium">{row.personalized}</span>
                  )}
                </td>
                <td className="py-4 text-right">
                  <AnimatePresence>
                    {row.lift && (
                      <motion.span
                        key={animateResults ? 'animated' : 'static'}
                        initial={animateResults ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-400 font-bold"
                      >
                        {row.lift}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default InteractiveComparisonTable;
