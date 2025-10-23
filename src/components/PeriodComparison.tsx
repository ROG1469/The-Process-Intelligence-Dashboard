'use client';

import { useState, useMemo } from 'react';
import { getProcessDataByTimeRange, TimeRange } from '@/data/processData';
import { analyzeProcesses } from '@/aiLogic';

const TIME_PERIODS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' }
];

interface PeriodComparisonProps {
  selectedProcess: string;
  currentTimeRange: TimeRange;
}

export default function PeriodComparison({ selectedProcess, currentTimeRange }: PeriodComparisonProps) {
  const [comparisonPeriod, setComparisonPeriod] = useState<TimeRange>('24h');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const comparisonData = useMemo(() => {
    // Get data for both periods
    const currentData = getProcessDataByTimeRange(currentTimeRange);
    const comparisonData = getProcessDataByTimeRange(comparisonPeriod);
    
    // Filter by process
    const filterData = (data: typeof currentData) => 
      selectedProcess === 'all' ? data : data.filter(step => step.id === selectedProcess);
    
    const currentFiltered = filterData(currentData);
    const comparisonFiltered = filterData(comparisonData);
    
    // Analyze both periods
    const currentAnalyses = analyzeProcesses(currentFiltered);
    const comparisonAnalyses = analyzeProcesses(comparisonFiltered);
    
    // Calculate metrics
    const calcMetrics = (analyses: typeof currentAnalyses) => {
      const bottlenecks = analyses.filter(a => a.isPotentialBottleneck);
      const avgDelay = bottlenecks.reduce((sum, b) => sum + b.delayPercentage, 0) / (bottlenecks.length || 1);
      const avgRiskScore = analyses.reduce((sum, a) => sum + a.riskScore, 0) / (analyses.length || 1);
      
      return {
        processCount: analyses.length,
        bottleneckCount: bottlenecks.length,
        avgDelay: Math.round(avgDelay * 10) / 10,
        avgRiskScore: Math.round(avgRiskScore),
        criticalCount: analyses.filter(a => a.riskLevel === 'Critical').length,
        highCount: analyses.filter(a => a.riskLevel === 'High').length
      };
    };
    
    const current = calcMetrics(currentAnalyses);
    const comparison = calcMetrics(comparisonAnalyses);
    
    // Calculate changes
    const changes = {
      bottlenecks: current.bottleneckCount - comparison.bottleneckCount,
      avgDelay: current.avgDelay - comparison.avgDelay,
      avgRiskScore: current.avgRiskScore - comparison.avgRiskScore,
      critical: current.criticalCount - comparison.criticalCount
    };
    
    return { current, comparison, changes };
  }, [selectedProcess, currentTimeRange, comparisonPeriod]);
  
  const getTrendIcon = (value: number) => {
    if (value > 0) return { icon: '📈', color: 'text-red-400', label: 'Worsening' };
    if (value < 0) return { icon: '📉', color: 'text-green-400', label: 'Improving' };
    return { icon: '➡️', color: 'text-gray-400', label: 'Stable' };
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/30 overflow-hidden">
      {/* Header with Toggle */}
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

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 animate-fadeIn">
          <p className="text-xs text-gray-400 mb-4">
            Compare current performance against a different time period
          </p>

          {/* Period Selector */}
          <div className="mb-4">
            <label className="text-xs text-gray-300 mb-2 block">Compare Against:</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setComparisonPeriod(period.value)}
                  disabled={period.value === currentTimeRange}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    period.value === comparisonPeriod
                      ? 'bg-blue-500/30 border-2 border-blue-500/50 text-blue-300'
                      : period.value === currentTimeRange
                      ? 'bg-gray-700/30 border border-gray-600/30 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900/40 border border-gray-700/30 text-gray-300 hover:border-gray-600/50'
                  }`}
                >
                  {period.label}
                  {period.value === currentTimeRange && ' (Current)'}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Current Period */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="text-xs text-blue-300 mb-2 font-semibold">
                {TIME_PERIODS.find(p => p.value === currentTimeRange)?.label}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bottlenecks:</span>
                  <span className="text-white font-semibold">{comparisonData.current.bottleneckCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Delay:</span>
                  <span className="text-white font-semibold">{comparisonData.current.avgDelay}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Score:</span>
                  <span className="text-white font-semibold">{comparisonData.current.avgRiskScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Critical:</span>
                  <span className="text-red-400 font-semibold">{comparisonData.current.criticalCount}</span>
                </div>
              </div>
            </div>

            {/* Comparison Period */}
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
              <div className="text-xs text-gray-300 mb-2 font-semibold">
                {TIME_PERIODS.find(p => p.value === comparisonPeriod)?.label}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bottlenecks:</span>
                  <span className="text-gray-300 font-semibold">{comparisonData.comparison.bottleneckCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Delay:</span>
                  <span className="text-gray-300 font-semibold">{comparisonData.comparison.avgDelay}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Score:</span>
                  <span className="text-gray-300 font-semibold">{comparisonData.comparison.avgRiskScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Critical:</span>
                  <span className="text-gray-300 font-semibold">{comparisonData.comparison.criticalCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
              📈 Trend Analysis
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Bottleneck Trend:</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparisonData.changes.bottlenecks).icon}
                  <span className={getTrendIcon(comparisonData.changes.bottlenecks).color + ' font-semibold'}>
                    {comparisonData.changes.bottlenecks > 0 ? '+' : ''}
                    {comparisonData.changes.bottlenecks}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Delay Trend:</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparisonData.changes.avgDelay).icon}
                  <span className={getTrendIcon(comparisonData.changes.avgDelay).color + ' font-semibold'}>
                    {comparisonData.changes.avgDelay > 0 ? '+' : ''}
                    {comparisonData.changes.avgDelay.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Risk Score Trend:</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparisonData.changes.avgRiskScore).icon}
                  <span className={getTrendIcon(comparisonData.changes.avgRiskScore).color + ' font-semibold'}>
                    {comparisonData.changes.avgRiskScore > 0 ? '+' : ''}
                    {comparisonData.changes.avgRiskScore}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Critical Issues:</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparisonData.changes.critical).icon}
                  <span className={getTrendIcon(comparisonData.changes.critical).color + ' font-semibold'}>
                    {comparisonData.changes.critical > 0 ? '+' : ''}
                    {comparisonData.changes.critical}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <p className="text-xs text-gray-300">
                <strong className="text-white">Summary:</strong>{' '}
                {comparisonData.changes.bottlenecks < 0 || comparisonData.changes.avgDelay < 0 
                  ? '✅ Performance is improving compared to the selected period.'
                  : comparisonData.changes.bottlenecks > 0 || comparisonData.changes.avgDelay > 0
                  ? '⚠️ Performance has degraded. Review recent changes.'
                  : '➡️ Performance remains stable.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
