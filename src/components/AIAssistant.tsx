'use client';

import { useState, useEffect } from 'react';
import { analyzeProcesses, type RiskAnalysis } from '@/aiLogic';
import { getProcessDataByTimeRange } from '@/data/processData';

interface AIInsight {
  title: string;
  message: string;
  actionable: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate human-like insights based on risk analysis
  const generateInsights = (analyses: RiskAnalysis[]): AIInsight[] => {
    // Get top 2 highest risk tasks
    const topRisks = analyses.slice(0, 2);
    const generatedInsights: AIInsight[] = [];

    topRisks.forEach((analysis, index) => {
      const { processName, delayPercentage, riskScore, riskLevel } = analysis;

      // Generate contextual insights based on risk level and delay
      if (riskLevel === 'Critical' || riskScore >= 80) {
        generatedInsights.push({
          title: `🚨 Critical Bottleneck Detected`,
          message: `${processName} is running ${delayPercentage.toFixed(1)}% slower than expected, with a risk score of ${riskScore}/100.`,
          actionable: `Consider reallocating resources to ${processName} or scaling up infrastructure to handle the increased load.`
        });
      } else if (riskLevel === 'High' || riskScore >= 60) {
        generatedInsights.push({
          title: `⚠️ Performance Issue Identified`,
          message: `${processName} shows a ${delayPercentage.toFixed(1)}% delay, indicating potential resource constraints.`,
          actionable: `Monitor ${processName} closely and consider optimizing the process or adding more computing resources.`
        });
      } else if (delayPercentage > 20) {
        generatedInsights.push({
          title: `📊 Optimization Opportunity`,
          message: `${processName} is experiencing a ${delayPercentage.toFixed(1)}% delay compared to baseline.`,
          actionable: `Review ${processName} configuration and consider parallel processing or caching strategies.`
        });
      }
    });

    // Add general insights if we have data
    if (analyses.length > 0) {
      const avgRisk = Math.round(
        analyses.reduce((sum, a) => sum + a.riskScore, 0) / analyses.length
      );
      
      if (avgRisk > 50) {
        generatedInsights.push({
          title: `💡 System-Wide Recommendation`,
          message: `Overall system performance is below optimal levels (avg risk: ${avgRisk}/100).`,
          actionable: `Consider implementing auto-scaling policies or reviewing resource allocation across all processes.`
        });
      }
    }

    return generatedInsights.slice(0, 3); // Limit to 3 insights
  };

  // Update insights when opening modal
  useEffect(() => {
    if (isOpen) {
      // Use default time range (1h) for AI Assistant
      const currentData = getProcessDataByTimeRange('1h');
      const analyses = analyzeProcesses(currentData);
      const newInsights = generateInsights(analyses);
      setInsights(newInsights);
    }
  }, [isOpen]);

  // Handle bubble click
  const handleBubbleClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsAnimating(false);
    }, 200);
  };

  // Handle modal close
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating AI Assistant Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleBubbleClick}
          className={`
            relative group
            w-16 h-16 
            bg-gradient-to-br from-blue-500 to-purple-600
            rounded-full 
            shadow-lg hover:shadow-2xl
            transform transition-all duration-300
            hover:scale-110
            ${isAnimating ? 'scale-95' : 'scale-100'}
            flex items-center justify-center
          `}
          aria-label="Open AI Assistant"
        >
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></div>
          
          {/* Icon */}
          <div className="relative z-10">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
          </div>

          {/* Notification badge */}
          {insights.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">
              {insights.length}
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
              AI Assistant
              <div className="absolute top-full right-4 w-2 h-2 bg-gray-800 transform rotate-45 -mt-1"></div>
            </div>
          </div>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleClose}
        >
          <div 
            className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700 transform transition-all duration-300 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Assistant</h2>
                    <p className="text-blue-100 text-sm">Smart Insights & Recommendations</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div 
                      key={index}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/30 transition-all duration-200"
                      style={{
                        animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`
                      }}
                    >
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        {insight.title}
                      </h3>
                      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                        {insight.message}
                      </p>
                      <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-blue-200 text-sm">
                          <span className="font-medium">💡 Recommendation:</span> {insight.actionable}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">All Systems Optimal</h3>
                  <p className="text-gray-400 text-sm">
                    No critical issues detected. Your processes are running smoothly!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-800/50 rounded-b-2xl border-t border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Analysis</span>
                </div>
                <span>Powered by AI Logic</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations to global CSS */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}