'use client';

import { useEffect, useState } from 'react';
import { type RiskAnalysis } from '@/aiLogic';
import { TimeRange } from '@/data/processData';
import { fetchHighRiskInsights, fetchAIInsightMessages, mapTimeRange, transformInsightForFrontend, fetchProcesses } from '@/services/api';
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
      case 'Medium':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-300',
          icon: 'text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300'
        };
      case 'Low':
        return {
          bg: 'bg-green-900/20',
          border: 'border-green-500/30',
          text: 'text-green-300',
          icon: 'text-green-400',
          badge: 'bg-green-500/20 text-green-300'
        };
      default:
        return {
          bg: 'bg-gray-900/20',
          border: 'border-gray-500/30',
          text: 'text-gray-300',
          icon: 'text-gray-400',
          badge: 'bg-gray-500/20 text-gray-300'
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

      {/* AI Insight Message - Use backend message if available, otherwise generate */}
      <div className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-lg p-3 mb-3`}>
        <p className={`text-xs ${colors.text} leading-relaxed font-medium`}>
          💬 {analysis.aiMessage || generateInsightMessage(analysis)}
        </p>
      </div>

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Unfiltered stats for accurate totals
  const [unfilteredStats, setUnfilteredStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });
  
  // AI Insight Messages state
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [aiMessagesLoading, setAiMessagesLoading] = useState(false);
  
  // Collapsible section states
  const [showScenarios, setShowScenarios] = useState(false);

  useEffect(() => {
    // Fetch insights from backend API
    const updateInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Map frontend time range to backend format
        const backendRange = mapTimeRange(timeRange);
        
        // Fetch AI insight messages with details
        setAiMessagesLoading(true);
        let aiInsightsDetails: any[] = [];
        try {
          const messagesResult = await fetchAIInsightMessages(backendRange, performanceThreshold);
          setAiMessages(messagesResult.messages || []);
          aiInsightsDetails = messagesResult.details || [];
        } catch (msgError) {
          console.warn('Failed to load AI messages:', msgError);
          setAiMessages(['⚠️ Unable to load AI insights']);
        } finally {
          setAiMessagesLoading(false);
        }
        
        // Fetch process data and calculate risk scores on frontend
        const response = await fetchProcesses({ range: backendRange });
        
        console.log('💡 Process data received:', response);
        console.log('💡 AI insights details:', aiInsightsDetails);
        
        // Create a map of process name to AI message
        const aiMessageMap = new Map(
          aiInsightsDetails.map(detail => [detail.processName, detail.message])
        );
        
        // Transform processes to RiskAnalysis format with proper risk calculation
        const transformedInsights: RiskAnalysis[] = (response.data || []).map((process: any) => {
          const delayPercentage = process.average_duration > 0
            ? ((process.actual_duration - process.average_duration) / process.average_duration) * 100
            : 0;
          
          const delayTime = process.actual_duration - process.average_duration;
          
          // Calculate risk score (same algorithm as backend)
          let riskScore = 0;
          const absDelayPercent = Math.abs(delayPercentage);
          if (absDelayPercent >= 50) riskScore += 50;
          else if (absDelayPercent >= 30) riskScore += 40;
          else if (absDelayPercent >= 20) riskScore += 30;
          else if (absDelayPercent >= 10) riskScore += 20;
          else riskScore += absDelayPercent;
          
          const status = String(process.status);
          if (status === 'critical') riskScore += 40;
          else if (status === 'failed') riskScore += 35;
          else if (status === 'delayed') riskScore += 20;
          else if (status === 'in-progress') riskScore += 10;
          
          const delayMinutes = delayTime / 60;
          if (delayMinutes >= 60) riskScore += 10;
          else if (delayMinutes >= 30) riskScore += 7;
          else if (delayMinutes >= 15) riskScore += 5;
          else if (delayMinutes > 0) riskScore += 3;
          
          riskScore = Math.min(Math.round(riskScore), 100);
          
          // Generate recommendation based on risk score
          const generateRecommendation = (score: number, name: string) => {
            if (score >= 80) return `🔴 CRITICAL: Immediate action required for ${name}. Deploy additional resources and investigate root cause.`;
            if (score >= 60) return `⚠️ WARNING: ${name} needs attention. Consider reallocation of resources or process optimization.`;
            if (score >= 40) return `📊 MONITOR: ${name} showing early warning signs. Continue monitoring and prepare contingency plans.`;
            return `✅ ${name} operating within normal parameters.`;
          };
          
          // Calculate estimated impact
          const calculateEstimatedImpact = (delayPercent: number) => {
            const absDelay = Math.abs(delayPercent);
            if (absDelay >= 50) return 'Very High - significant productivity loss';
            if (absDelay >= 30) return 'High - noticeable impact on throughput';
            if (absDelay >= 20) return 'Medium - moderate performance degradation';
            if (absDelay >= 10) return 'Low - minor impact on schedule';
            return 'Minimal - within acceptable variance';
          };
          
          // Get AI-generated message for this process (if available)
          const aiMessage = aiMessageMap.get(process.name) || null;
          
          return {
            processName: process.name,
            processId: process.id,
            delayPercentage: Math.round(delayPercentage),
            riskScore,
            riskLevel: getRiskLevel(riskScore),
            recommendation: generateRecommendation(riskScore, process.name),
            isPotentialBottleneck: riskScore >= 60,
            averageDuration: process.average_duration,
            actualDuration: process.actual_duration,
            delayTime,
            estimatedImpact: calculateEstimatedImpact(delayPercentage),
            aiMessage // Add AI message to the analysis object
          };
        });
        
        // Calculate UNFILTERED stats (for accurate totals) BEFORE applying filters
        const unfilteredStats = {
          critical: transformedInsights.filter(a => a.riskLevel === 'Critical').length,
          high: transformedInsights.filter(a => a.riskLevel === 'High').length,
          medium: transformedInsights.filter(a => a.riskLevel === 'Medium').length,
          low: transformedInsights.filter(a => a.riskLevel === 'Low').length,
          total: transformedInsights.length
        };
        
        // Store unfiltered stats in state for stats display
        setUnfilteredStats(unfilteredStats);
        
        // Filter by selected process
        const processFiltered = selectedProcess === 'all'
          ? transformedInsights
          : transformedInsights.filter(insight => 
              insight.processName.toLowerCase().includes(selectedProcess.toLowerCase()) ||
              selectedProcess.toLowerCase().includes(insight.processName.toLowerCase())
            );
        
        // Apply performance threshold filter (risk score)
        const thresholdFiltered = processFiltered.filter(
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
        
        // Filter to show only delayed/critical processes (not healthy/completed ones)
        const bottlenecksOnly = severityFiltered.filter(analysis => 
          analysis.riskLevel === 'Critical' || 
          analysis.riskLevel === 'High' || 
          analysis.riskLevel === 'Medium'
        );
        
        // Sort by priority: Critical first, then High, then Medium, then by risk score descending
        const sortedAnalyses = bottlenecksOnly.sort((a, b) => {
          const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
          const priorityDiff = priorityOrder[a.riskLevel] - priorityOrder[b.riskLevel];
          if (priorityDiff !== 0) return priorityDiff;
          return b.riskScore - a.riskScore; // Within same level, higher risk first
        });
        
        setAnalyses(sortedAnalyses);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Failed to load insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to load insights');
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    updateInsights();

    // Set up interval for real-time updates (every 60 seconds)
    const interval = setInterval(() => {
      updateInsights();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedProcess, timeRange, performanceThreshold, severityFilters]); // Re-run when filters change

  // Helper function to determine risk level from risk score
  const getRiskLevel = (riskScore: number): 'Critical' | 'High' | 'Medium' | 'Low' => {
    if (riskScore >= 80) return 'Critical';
    if (riskScore >= 60) return 'High';
    if (riskScore >= 40) return 'Medium';
    return 'Low';
  };

  // Helper function to calculate estimated impact
  const calculateEstimatedImpact = (delayPercentage: number): string => {
    if (delayPercentage > 50) return 'High - Immediate action required';
    if (delayPercentage > 20) return 'Medium - Schedule optimization needed';
    return 'Low - Monitor closely';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Insights
          </h3>
          <div className="flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Loading...</span>
              </>
            ) : error ? (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-xs text-red-400">Error</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Live</span>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Real-time bottleneck detection from Supabase
        </p>
      </div>

      {/* Loading State */}
      {loading && analyses.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading insights...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && analyses.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <p className="text-red-400 text-sm mb-1">Failed to load insights</p>
            <p className="text-gray-500 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Summary - Show UNFILTERED totals with proper colors */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-800/30 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-red-500">
              {unfilteredStats.critical + unfilteredStats.high + unfilteredStats.medium}
            </div>
            <div className="text-[10px] text-gray-400">Issues Detected</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{unfilteredStats.total}</div>
            <div className="text-[10px] text-gray-400">Total Processes</div>
          </div>
        </div>
      )}

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
          Last updated: {typeof window !== 'undefined' ? lastUpdate.toLocaleTimeString() : '--:--:--'}
        </div>
      </div>
    </div>
  );
}