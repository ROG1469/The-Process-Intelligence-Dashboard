'use client';
import { useState, useEffect } from 'react';
import { TimeRange } from '@/data/processData';

interface PeriodComparisonProps {
  selectedProcess: string;
  currentTimeRange: TimeRange;
  totalProcesses: number;
}

interface HistoricalData {
  period: string;
  averageRiskScore: number;
  bottleneckCount: number;
  totalProcesses: number;
  averageDelay: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ComparisonResult {
  current: HistoricalData;
  previous: HistoricalData;
  change: {
    riskScoreChange: number;
    bottleneckChange: number;
    delayChange: number;
  };
  summary: string;
}

// Mock historical data generator
const generateHistoricalData = (selectedProcess: string, currentTimeRange: TimeRange, totalProcesses: number): ComparisonResult => {
  // Generate realistic historical data based on current time range
  const periods = {
    '1h': { current: 'Last Hour', previous: 'Previous Hour' },
    '6h': { current: 'Last 6 Hours', previous: 'Previous 6 Hours' },
    '24h': { current: 'Today', previous: 'Yesterday' },
    '7d': { current: 'This Week', previous: 'Last Week' }
  };

  const { current: currentLabel, previous: previousLabel } = periods[currentTimeRange];

  // Generate current period data (slightly randomized for realism)
  const currentRiskScore = Math.floor(Math.random() * 40) + 30; // 30-70
  const currentBottlenecks = Math.floor(Math.random() * 3) + 1; // 1-3
  const currentProcesses = totalProcesses; // Use actual process count
  const currentDelay = Math.floor(Math.random() * 20) + 5; // 5-25%

  // Generate previous period data (with some correlation to current)
  const prevRiskScore = Math.floor(currentRiskScore + (Math.random() - 0.5) * 20); // +/- 10 from current
  const prevBottlenecks = Math.max(0, Math.floor(currentBottlenecks + (Math.random() - 0.5) * 2)); // +/- 1 from current
  const prevProcesses = currentProcesses; // Same number of processes
  const prevDelay = Math.max(0, Math.floor(currentDelay + (Math.random() - 0.5) * 10)); // +/- 5% from current

  const current: HistoricalData = {
    period: currentLabel,
    averageRiskScore: Math.min(100, Math.max(0, currentRiskScore)),
    bottleneckCount: currentBottlenecks,
    totalProcesses: currentProcesses,
    averageDelay: currentDelay,
    trend: 'stable'
  };

  const previous: HistoricalData = {
    period: previousLabel,
    averageRiskScore: Math.min(100, Math.max(0, prevRiskScore)),
    bottleneckCount: prevBottlenecks,
    totalProcesses: prevProcesses,
    averageDelay: prevDelay,
    trend: 'stable'
  };

  const change = {
    riskScoreChange: current.averageRiskScore - previous.averageRiskScore,
    bottleneckChange: current.bottleneckCount - previous.bottleneckCount,
    delayChange: current.averageDelay - previous.averageDelay
  };

  // Generate summary
  let summary = '';
  const riskChange = change.riskScoreChange;
  const bottleneckChange = change.bottleneckChange;

  if (Math.abs(riskChange) < 5 && Math.abs(bottleneckChange) < 1) {
    summary = 'Performance is stable compared to the previous period.';
  } else if (riskChange < -10 || bottleneckChange < 0) {
    summary = '✅ Performance is improving compared to the previous period.';
  } else if (riskChange > 10 || bottleneckChange > 0) {
    summary = '⚠️ Performance is declining compared to the previous period.';
  } else {
    summary = 'Performance shows mixed results compared to the previous period.';
  }

  return { current, previous, change, summary };
};

export default function PeriodComparison({ selectedProcess, currentTimeRange, totalProcesses }: PeriodComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !comparisonData) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        const data = generateHistoricalData(selectedProcess, currentTimeRange, totalProcesses);
        setComparisonData(data);
        setIsLoading(false);
      }, 800);
    }
  }, [isExpanded, selectedProcess, currentTimeRange, comparisonData, totalProcesses]);

  const formatChange = (value: number, isPercentage: boolean = false): string => {
    const sign = value > 0 ? '+' : '';
    const formatted = isPercentage ? `${value.toFixed(1)}%` : value.toString();
    return `${sign}${formatted}`;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'text-red-400'; // Worse
    if (value < 0) return 'text-green-400'; // Better
    return 'text-gray-400'; // Same
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📊 Period Comparison
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-500 border-t-blue-500"></div>
              <span className="ml-3 text-gray-400">Analyzing historical data...</span>
            </div>
          ) : comparisonData ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 font-medium">{comparisonData.summary}</p>
              </div>

              {/* Comparison Table */}
              <div className="overflow-hidden rounded-lg border border-gray-700/50">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Metric</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {comparisonData.current.period}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                        {comparisonData.previous.period}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    <tr className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-300">Average Risk Score</td>
                      <td className="px-4 py-3 text-center text-white font-mono">
                        {comparisonData.current.averageRiskScore}/100
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 font-mono">
                        {comparisonData.previous.averageRiskScore}/100
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${getChangeColor(comparisonData.change.riskScoreChange)}`}>
                        {formatChange(comparisonData.change.riskScoreChange)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-300">Bottlenecks Detected</td>
                      <td className="px-4 py-3 text-center text-white font-mono">
                        {comparisonData.current.bottleneckCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 font-mono">
                        {comparisonData.previous.bottleneckCount}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${getChangeColor(comparisonData.change.bottleneckChange)}`}>
                        {formatChange(comparisonData.change.bottleneckChange)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-300">Average Delay</td>
                      <td className="px-4 py-3 text-center text-white font-mono">
                        {comparisonData.current.averageDelay.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 font-mono">
                        {comparisonData.previous.averageDelay.toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-center font-mono ${getChangeColor(comparisonData.change.delayChange)}`}>
                        {formatChange(comparisonData.change.delayChange, true)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-300">Total Processes</td>
                      <td className="px-4 py-3 text-center text-white font-mono">
                        {comparisonData.current.totalProcesses}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 font-mono">
                        {comparisonData.previous.totalProcesses}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 font-mono">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Risk Score Trend</h4>
                  <p className="text-sm text-gray-400">
                    {comparisonData.change.riskScoreChange < -5
                      ? 'Risk scores are decreasing, indicating better performance.'
                      : comparisonData.change.riskScoreChange > 5
                      ? 'Risk scores are increasing, indicating potential issues.'
                      : 'Risk scores remain stable across periods.'
                    }
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Bottleneck Analysis</h4>
                  <p className="text-sm text-gray-400">
                    {comparisonData.change.bottleneckChange < 0
                      ? `${Math.abs(comparisonData.change.bottleneckChange)} fewer bottlenecks detected.`
                      : comparisonData.change.bottleneckChange > 0
                      ? `${comparisonData.change.bottleneckChange} additional bottlenecks identified.`
                      : 'Bottleneck count remains consistent.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Unable to load comparison data. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
