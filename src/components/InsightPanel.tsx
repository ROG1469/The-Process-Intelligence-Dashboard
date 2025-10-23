'use client';

import { useEffect, useState } from 'react';
import { analyzeProcesses, type RiskAnalysis } from '@/aiLogic';
import { getProcessDataByTimeRange, TimeRange } from '@/data/processData';
import ScenarioPlanner from './ScenarioPlanner';
import PeriodComparison from './PeriodComparison';

interface InsightPanelProps {
  selectedProcess: string;
  timeRange: TimeRange;
  performanceThreshold: number;
  severityFilters: {
    Critical: boolean;
    High: boolean;
    Medium: boolean;
    Low: boolean;
  };
}

interface InsightCardProps {
  analysis: RiskAnalysis;
  index: number;
}

interface Recommendation {
  title: string;
  description: string;
  expectedImpact: string;
  costSavings: number;
  difficulty: 'Low' | 'Medium' | 'High';
}

const InsightCard = ({ analysis, index }: InsightCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    // Stagger the fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 150);

    return () => clearTimeout(timer);
  }, [index]);

  // Generate AI-style recommendations based on analysis
  const generateRecommendations = (analysis: RiskAnalysis): Recommendation[] => {
    const { processName, delayPercentage, riskScore } = analysis;
    const recommendations: Recommendation[] = [];
    const processId = processName.toLowerCase().replace(/\s+/g, '-');

    // Severity-based recommendations
    if (delayPercentage > 50) {
      // Critical delay - immediate action needed
      if (processId.includes('receiving')) {
        recommendations.push({
          title: 'Add Temporary Dock Staff',
          description: 'Assign 2 additional workers to unloading during peak hours (2-5pm)',
          expectedImpact: '-8 min processing time',
          costSavings: 1800,
          difficulty: 'Low'
        });
        recommendations.push({
          title: 'Implement Cross-Docking',
          description: 'Route high-priority shipments directly from receiving to dispatch',
          expectedImpact: '-12 min total cycle time',
          costSavings: 2400,
          difficulty: 'Medium'
        });
      } else if (processId.includes('quality')) {
        recommendations.push({
          title: 'Add Inspection Station',
          description: 'Set up parallel quality check station to handle overflow',
          expectedImpact: '-6 min processing time',
          costSavings: 1500,
          difficulty: 'Medium'
        });
        recommendations.push({
          title: 'Implement Sampling Procedures',
          description: 'Check 20% sample instead of 100% for low-risk items',
          expectedImpact: '-10 min processing time',
          costSavings: 2200,
          difficulty: 'Low'
        });
      } else if (processId.includes('storing')) {
        recommendations.push({
          title: 'Optimize Putaway Routing',
          description: 'Use AI-based location assignment to minimize travel distance',
          expectedImpact: '-7 min per cycle',
          costSavings: 1600,
          difficulty: 'High'
        });
        recommendations.push({
          title: 'Add Temporary Storage Zones',
          description: 'Create overflow staging area closer to receiving',
          expectedImpact: '-5 min travel time',
          costSavings: 1200,
          difficulty: 'Low'
        });
      } else if (processId.includes('picking') || processId.includes('material')) {
        recommendations.push({
          title: 'Implement Batch Picking',
          description: 'Group similar orders to reduce trips (pick 5-10 orders per trip)',
          expectedImpact: '-9 min per batch',
          costSavings: 2000,
          difficulty: 'Low'
        });
        recommendations.push({
          title: 'Optimize Pick Paths',
          description: 'Reorganize warehouse layout based on velocity analysis',
          expectedImpact: '-6 min per cycle',
          costSavings: 1400,
          difficulty: 'High'
        });
      } else if (processId.includes('packaging') || processId.includes('packing')) {
        recommendations.push({
          title: 'Add Packing Station',
          description: 'Set up 2 additional packing stations with pre-staged materials',
          expectedImpact: '-5 min processing time',
          costSavings: 1300,
          difficulty: 'Medium'
        });
        recommendations.push({
          title: 'Pre-Stage Packing Materials',
          description: 'Stock boxes, tape, labels at each station before shift starts',
          expectedImpact: '-3 min material retrieval',
          costSavings: 800,
          difficulty: 'Low'
        });
      } else if (processId.includes('dispatch')) {
        recommendations.push({
          title: 'Add Loading Staff',
          description: 'Assign 1 additional worker to loading dock during peak hours',
          expectedImpact: '-9 min loading time',
          costSavings: 1800,
          difficulty: 'Low'
        });
        recommendations.push({
          title: 'Pre-Stage High-Priority Orders',
          description: 'Move urgent shipments to staging area 1 hour before carrier arrival',
          expectedImpact: '-7 min turnaround time',
          costSavings: 1500,
          difficulty: 'Low'
        });
      }
    } else if (delayPercentage > 20 && delayPercentage <= 50) {
      // Moderate delay - process optimization
      recommendations.push({
        title: 'Process Flow Analysis',
        description: `Conduct time-motion study of ${processName} to identify waste`,
        expectedImpact: '-4 min potential savings',
        costSavings: 900,
        difficulty: 'Medium'
      });
      recommendations.push({
        title: 'Equipment Maintenance Check',
        description: 'Inspect and service equipment to prevent slowdowns',
        expectedImpact: '-3 min equipment delays',
        costSavings: 600,
        difficulty: 'Low'
      });
    } else {
      // Minor delay - monitoring and prevention
      recommendations.push({
        title: 'Continue Monitoring',
        description: `Track ${processName} performance for next 48 hours`,
        expectedImpact: 'Prevent escalation',
        costSavings: 0,
        difficulty: 'Low'
      });
      recommendations.push({
        title: 'Document Best Practices',
        description: 'Capture current workflow for training and consistency',
        expectedImpact: 'Maintain performance',
        costSavings: 0,
        difficulty: 'Low'
      });
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  };

  const recommendations = generateRecommendations(analysis);

  // Difficulty indicator component
  const DifficultyBadge = ({ difficulty }: { difficulty: Recommendation['difficulty'] }) => {
    const colors = {
      Low: { bg: 'bg-green-900/30', text: 'text-green-300', icon: '🟢' },
      Medium: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', icon: '🟡' },
      High: { bg: 'bg-red-900/30', text: 'text-red-300', icon: '🔴' }
    };
    const style = colors[difficulty];
    return (
      <span className={`${style.bg} ${style.text} text-xs px-2 py-1 rounded-full`}>
        {style.icon} {difficulty}
      </span>
    );
  };

  // Generate AI-style insight message
  const generateInsightMessage = (analysis: RiskAnalysis): string => {
    const { processName, delayPercentage, riskLevel, riskScore } = analysis;
    
    if (delayPercentage > 50) {
      return `⚠️ ${processName} shows +${delayPercentage.toFixed(1)}% delay — critical resource bottleneck detected`;
    } else if (delayPercentage > 30) {
      return `⚠️ ${processName} shows +${delayPercentage.toFixed(1)}% delay — possible resource bottleneck`;
    } else if (delayPercentage > 15) {
      return `⚡ ${processName} experiencing +${delayPercentage.toFixed(1)}% delay — monitor for escalation`;
    } else if (delayPercentage > 0) {
      return `📊 ${processName} running +${delayPercentage.toFixed(1)}% slower than average`;
    } else {
      return `✅ ${processName} performing ${Math.abs(delayPercentage).toFixed(1)}% better than expected`;
    }
  };

  // Get color scheme based on risk level
  const getColorScheme = () => {
    switch (analysis.riskLevel) {
      case 'Critical':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-500/30',
          text: 'text-red-300',
          icon: 'text-red-400',
          badge: 'bg-red-500/20 text-red-300'
        };
      case 'High':
        return {
          bg: 'bg-orange-900/20',
          border: 'border-orange-500/30',
          text: 'text-orange-300',
          icon: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300'
        };
      case 'Medium':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-300',
          icon: 'text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300'
        };
      default:
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-500/30',
          text: 'text-blue-300',
          icon: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300'
        };
    }
  };

  const colors = getColorScheme();

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} border rounded-lg p-4
        transform transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        hover:scale-[1.02] hover:shadow-lg
      `}
    >
      {/* Header with Process Name and Badge */}
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-semibold ${colors.text} text-sm`}>
          {analysis.processName}
        </h4>
        <span className={`${colors.badge} text-xs px-2 py-1 rounded-full font-medium`}>
          {analysis.riskLevel}
        </span>
      </div>

      {/* AI Insight Message */}
      <p className={`text-xs ${colors.text} mb-3 leading-relaxed`}>
        {generateInsightMessage(analysis)}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div className="bg-gray-800/30 rounded px-2 py-1">
          <div className="text-gray-400 text-[10px]">Delay</div>
          <div className={`${colors.icon} font-medium`}>
            {analysis.delayPercentage > 0 ? '+' : ''}{analysis.delayPercentage.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-800/30 rounded px-2 py-1">
          <div className="text-gray-400 text-[10px]">Risk Score</div>
          <div className={`${colors.icon} font-medium`}>
            {analysis.riskScore}/100
          </div>
        </div>
        <div className="bg-gray-800/30 rounded px-2 py-1">
          <div className="text-gray-400 text-[10px]">💰 Cost Impact</div>
          <div className="text-red-400 font-medium">
            ${Math.round(analysis.delayPercentage * 45)}/hr
          </div>
        </div>
      </div>

      {/* Bottleneck Badge */}
      {analysis.isPotentialBottleneck && (
        <div className="mt-3 flex items-center gap-2">
          <div className={`w-2 h-2 ${colors.icon} rounded-full animate-pulse`}></div>
          <span className={`text-[10px] ${colors.text} font-medium uppercase tracking-wide`}>
            Potential Bottleneck
          </span>
        </div>
      )}

      {/* Recommendations Section */}
      {analysis.isPotentialBottleneck && recommendations.length > 0 && (
        <div className="mt-4 border-t border-gray-700/30 pt-3">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className={`w-full flex items-center justify-between text-xs font-medium ${colors.text} hover:opacity-80 transition-opacity`}
          >
            <span className="flex items-center gap-2">
              💡 {showRecommendations ? 'Hide' : 'Show'} Recommendations ({recommendations.length})
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showRecommendations ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showRecommendations && (
            <div className="mt-3 space-y-2 animate-fadeIn">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-xs font-semibold text-white">{rec.title}</h5>
                    <DifficultyBadge difficulty={rec.difficulty} />
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-blue-300">
                      📊 {rec.expectedImpact}
                    </span>
                    {rec.costSavings > 0 && (
                      <span className="text-green-300 font-medium">
                        ✅ Save ${rec.costSavings.toLocaleString()}/day
                      </span>
                    )}
                  </div>
                  {rec.costSavings > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700/30">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">💵 Money You&apos;ll Save:</span>
                        <span className="text-green-400 font-bold">
                          ${(rec.costSavings * 30).toLocaleString()}/month
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function InsightPanel({ 
  selectedProcess, 
  timeRange, 
  performanceThreshold, 
  severityFilters 
}: InsightPanelProps) {
  const [analyses, setAnalyses] = useState<RiskAnalysis[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Collapsible section states
  const [showScenarios, setShowScenarios] = useState(false);

  useEffect(() => {
    // Analyze processes and update insights
    const updateInsights = () => {
      // Get data based on selected time range
      const allProcessData = getProcessDataByTimeRange(timeRange);
      
      // Filter data based on selected process
      const filteredData = selectedProcess === 'all' 
        ? allProcessData 
        : allProcessData.filter(step => step.id === selectedProcess);
      
      const riskAnalyses = analyzeProcesses(filteredData);
      
      // Apply performance threshold filter
      const thresholdFiltered = riskAnalyses.filter(
        analysis => analysis.riskScore >= performanceThreshold
      );
      
      // Apply severity filters
      const severityFiltered = thresholdFiltered.filter(analysis => {
        if (analysis.riskLevel === 'Critical') return severityFilters.Critical;
        if (analysis.riskLevel === 'High') return severityFilters.High;
        if (analysis.riskLevel === 'Medium') return severityFilters.Medium;
        if (analysis.riskLevel === 'Low') return severityFilters.Low;
        return true;
      });
      
      setAnalyses(severityFiltered);
      setLastUpdate(new Date());
    };

    // Initial analysis
    updateInsights();

    // Set up interval to check for data changes (simulating real-time updates)
    const interval = setInterval(() => {
      updateInsights();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [selectedProcess, timeRange, performanceThreshold, severityFilters]); // Re-run when filters change

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Automated bottleneck detection powered by AI
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-800/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-white">{analyses.length}</div>
          <div className="text-[10px] text-gray-400">Processes</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-red-400">
            {analyses.filter(a => a.riskLevel === 'Critical' || a.riskLevel === 'High').length}
          </div>
          <div className="text-[10px] text-gray-400">Issues</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-400">
            {analyses.filter(a => a.riskLevel === 'Low').length}
          </div>
          <div className="text-[10px] text-gray-400">Healthy</div>
        </div>
      </div>

      {/* Active Bottlenecks - Always Visible, No Collapse */}
      <div className="flex-1 overflow-y-auto">
        {analyses.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-red-500 rounded"></span>
              <h4 className="text-xs font-semibold text-red-400">
                ACTIVE BOTTLENECKS ({analyses.length})
              </h4>
            </div>
            {analyses.map((analysis, index) => (
              <InsightCard
                key={analysis.processId}
                analysis={analysis}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-center">
            <div>
              <div className="text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">All processes running smoothly</p>
            </div>
          </div>
        )}
      </div>

      {/* Additional Analysis Panels */}
      <div className="mt-6 space-y-4">
        {/* Scenario Planner - Collapsible */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700/30 overflow-hidden">
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
          >
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              🎯 Scenario Planner
            </h3>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showScenarios ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showScenarios && (
            <div className="px-4 pb-4 animate-fadeIn">
              <ScenarioPlanner 
                selectedProcess={selectedProcess}
                timeRange={timeRange}
              />
            </div>
          )}
        </div>

        {/* Period Comparison - Already has built-in collapse */}
        <PeriodComparison 
          selectedProcess={selectedProcess}
          currentTimeRange={timeRange}
        />
      </div>

      {/* Footer - Last Update */}
      <div className="mt-4 pt-3 border-t border-gray-700/30">
        <div className="text-[10px] text-gray-500 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}