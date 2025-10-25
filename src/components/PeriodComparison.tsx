'use client';
import { useState } from 'react';

interface PeriodComparisonProps {
  selectedProcess: string;
  currentTimeRange: '1h' | '6h' | '24h' | '7d';
}

export default function PeriodComparison({ selectedProcess, currentTimeRange }: PeriodComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          ?? Period Comparison
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-400">
            Period comparison feature is being optimized. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
