'use client';

import { useMemo } from 'react';
import { getProcessDataByTimeRange, TimeRange } from '@/data/processData';
import { analyzeProcesses } from '@/aiLogic';

interface RootCausePanelProps {
  selectedProcess: string;
  timeRange: TimeRange;
}

interface RootCauseFactor {
  category: string;
  icon: string;
  probability: number;
  description: string;
  color: string;
}

export default function RootCausePanel({ selectedProcess, timeRange }: RootCausePanelProps) {
  
  const rootCauses = useMemo(() => {
    const allProcessData = getProcessDataByTimeRange(timeRange);
    const filteredData = selectedProcess === 'all' 
      ? allProcessData 
      : allProcessData.filter(step => step.id === selectedProcess);
    
    const analyses = analyzeProcesses(filteredData);
    const bottlenecks = analyses.filter(a => a.isPotentialBottleneck);
    
    if (bottlenecks.length === 0) return [];
    
    // Generate root cause analysis based on process type and severity
    const causes: RootCauseFactor[] = [];
    
    bottlenecks.forEach(bottleneck => {
      const delayPercent = bottleneck.delayPercentage;
      
      // Staffing Issues
      if (delayPercent > 30) {
        causes.push({
          category: 'Staffing',
          icon: '👥',
          probability: Math.min(delayPercent * 0.8, 95),
          description: 'Insufficient staff during peak hours causing process slowdown',
          color: 'red'
        });
      }
      
      // Equipment/Technology
      if (['storing', 'material-picking', 'dispatch'].includes(bottleneck.processId)) {
        causes.push({
          category: 'Equipment',
          icon: '🔧',
          probability: Math.min(delayPercent * 0.6, 85),
          description: 'Equipment constraints or outdated technology limiting throughput',
          color: 'orange'
        });
      }
      
      // Process Design
      if (delayPercent > 20) {
        causes.push({
          category: 'Process Design',
          icon: '📋',
          probability: Math.min(delayPercent * 0.7, 90),
          description: 'Inefficient workflow layout or redundant process steps',
          color: 'yellow'
        });
      }
      
      // Inventory Management
      if (['material-picking', 'packaging'].includes(bottleneck.processId)) {
        causes.push({
          category: 'Inventory',
          icon: '📦',
          probability: Math.min(delayPercent * 0.5, 75),
          description: 'Stock placement or inventory organization causing delays',
          color: 'blue'
        });
      }
      
      // Communication
      if (delayPercent > 15) {
        causes.push({
          category: 'Communication',
          icon: '💬',
          probability: Math.min(delayPercent * 0.4, 65),
          description: 'Poor coordination between teams or unclear instructions',
          color: 'purple'
        });
      }
    });
    
    // Sort by probability and return top 5 unique
    const uniqueCauses = causes.reduce((acc, cause) => {
      const existing = acc.find(c => c.category === cause.category);
      if (!existing || existing.probability < cause.probability) {
        return [...acc.filter(c => c.category !== cause.category), cause];
      }
      return acc;
    }, [] as RootCauseFactor[]);
    
    return uniqueCauses.sort((a, b) => b.probability - a.probability).slice(0, 5);
  }, [selectedProcess, timeRange]);
  
  if (rootCauses.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 text-sm">No bottlenecks detected for root cause analysis.</p>
      </div>
    );
  }

  const getColorClasses = (color: string) => {
    const colors = {
      red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', bar: 'bg-red-500' },
      orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300', bar: 'bg-orange-500' },
      yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', bar: 'bg-yellow-500' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', bar: 'bg-blue-500' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', bar: 'bg-purple-500' },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        AI-identified factors contributing to bottlenecks (sorted by likelihood)
      </p>

      <div className="space-y-3">
        {rootCauses.map((cause, index) => {
          const colors = getColorClasses(cause.color);
          return (
            <div 
              key={index}
              className={`${colors.bg} border ${colors.border} rounded-lg p-3`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cause.icon}</span>
                  <div>
                    <h4 className={`text-sm font-semibold ${colors.text}`}>
                      {cause.category}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {cause.description}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${colors.text} whitespace-nowrap ml-2`}>
                  {cause.probability.toFixed(0)}%
                </span>
              </div>
              
              {/* Probability Bar */}
              <div className="w-full bg-gray-700/30 rounded-full h-2 mt-2">
                <div 
                  className={`${colors.bar} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${cause.probability}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Note */}
      <div className="mt-4 bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          💡 <strong className="text-white">Tip:</strong> Address high-probability factors first for maximum impact. 
          Combine multiple solutions for compound effects.
        </p>
      </div>
    </div>
  );
}
