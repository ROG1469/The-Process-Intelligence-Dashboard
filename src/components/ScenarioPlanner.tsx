'use client';

import { useState, useMemo } from 'react';
import { getProcessDataByTimeRange, TimeRange } from '@/data/processData';
import { analyzeProcesses } from '@/aiLogic';

interface ScenarioPlannerProps {
  selectedProcess: string;
  timeRange: TimeRange;
}

interface Scenario {
  name: string;
  icon: string;
  improvement: number; // percentage improvement
  cost: number; // implementation cost
  timeframe: string;
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Add 2 Staff Members',
    icon: '👥',
    improvement: 25,
    cost: 8000,
    timeframe: '1 week'
  },
  {
    name: 'Upgrade Equipment',
    icon: '🔧',
    improvement: 35,
    cost: 25000,
    timeframe: '4 weeks'
  },
  {
    name: 'Process Optimization',
    icon: '⚡',
    improvement: 20,
    cost: 5000,
    timeframe: '2 weeks'
  },
  {
    name: 'Automation System',
    icon: '🤖',
    improvement: 50,
    cost: 75000,
    timeframe: '12 weeks'
  },
  {
    name: 'Staff Training',
    icon: '📚',
    improvement: 15,
    cost: 3000,
    timeframe: '3 weeks'
  }
];

export default function ScenarioPlanner({ selectedProcess, timeRange }: ScenarioPlannerProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  
  const currentPerformance = useMemo(() => {
    const allProcessData = getProcessDataByTimeRange(timeRange);
    const filteredData = selectedProcess === 'all' 
      ? allProcessData 
      : allProcessData.filter(step => step.id === selectedProcess);
    
    const analyses = analyzeProcesses(filteredData);
    const bottlenecks = analyses.filter(a => a.isPotentialBottleneck);
    
    const avgDelay = bottlenecks.reduce((sum, b) => sum + b.delayPercentage, 0) / (bottlenecks.length || 1);
    return {
      avgDelay: Math.round(avgDelay),
      bottleneckCount: bottlenecks.length
    };
  }, [selectedProcess, timeRange]);
  
  const projectedImpact = useMemo(() => {
    // Calculate compound improvement
    let improvement = 0;
    let totalCost = 0;
    let maxTimeframe = '';
    
    selectedScenarios.forEach(index => {
      const scenario = SCENARIOS[index];
      improvement += scenario.improvement * (1 - improvement / 100); // Diminishing returns
      totalCost += scenario.cost;
      
      // Find longest timeframe
      const weeks = parseInt(scenario.timeframe);
      if (maxTimeframe === '' || weeks > parseInt(maxTimeframe)) {
        maxTimeframe = scenario.timeframe;
      }
    });
    
    const newDelay = Math.max(0, currentPerformance.avgDelay - improvement);
    const reduction = currentPerformance.avgDelay - newDelay;
    
    // Estimate monthly savings (based on $500/hour operational cost)
    const monthlySavings = Math.round((reduction / 100) * 500 * 8 * 30); // 8 hour days, 30 days
    const roi = totalCost > 0 ? ((monthlySavings * 12 - totalCost) / totalCost * 100) : 0;
    
    return {
      improvement: Math.round(improvement),
      newDelay: Math.round(newDelay),
      reduction: Math.round(reduction),
      totalCost,
      timeframe: maxTimeframe || 'N/A',
      monthlySavings,
      annualROI: Math.round(roi)
    };
  }, [selectedScenarios, currentPerformance]);
  
  const toggleScenario = (index: number) => {
    setSelectedScenarios(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };
  
  if (currentPerformance.bottleneckCount === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 text-sm">No bottlenecks detected. System running efficiently! ✅</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        Test different improvement strategies and see projected outcomes
      </p>

      {/* Current State */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Current Avg Delay:</span>
          <span className="text-lg font-bold text-red-400">{currentPerformance.avgDelay}%</span>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="space-y-2 mb-4">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Select Improvements to Test:</h4>
        {SCENARIOS.map((scenario, index) => (
          <button
            key={index}
            onClick={() => toggleScenario(index)}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
              selectedScenarios.includes(index)
                ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                : 'bg-gray-900/40 border-gray-700/30 hover:border-gray-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{scenario.icon}</span>
                <span className="text-sm font-medium text-white">{scenario.name}</span>
                {selectedScenarios.includes(index) && (
                  <span className="text-xs text-blue-300">✓</span>
                )}
              </div>
              <span className="text-xs text-green-300">+{scenario.improvement}%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 ml-7">
              <span>${scenario.cost.toLocaleString()}</span>
              <span>{scenario.timeframe}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Projected Results */}
      {selectedScenarios.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4 animate-fadeIn">
          <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
            📊 Projected Results
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">New Avg Delay:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">{currentPerformance.avgDelay}%</span>
                <span className="text-lg font-bold text-green-400">{projectedImpact.newDelay}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Total Improvement:</span>
              <span className="text-sm font-semibold text-green-300">-{projectedImpact.reduction}%</span>
            </div>
            
            <div className="h-px bg-gray-700/50 my-2"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Total Investment:</span>
              <span className="text-sm font-semibold text-orange-300">${projectedImpact.totalCost.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Monthly Savings:</span>
              <span className="text-sm font-semibold text-green-300">${projectedImpact.monthlySavings.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Est. Annual ROI:</span>
              <span className={`text-sm font-bold ${projectedImpact.annualROI > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {projectedImpact.annualROI > 0 ? '+' : ''}{projectedImpact.annualROI}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Implementation Time:</span>
              <span className="text-sm font-semibold text-blue-300">{projectedImpact.timeframe}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Current: {currentPerformance.avgDelay}%</span>
              <span>Target: {projectedImpact.newDelay}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-green-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (projectedImpact.reduction / currentPerformance.avgDelay) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {selectedScenarios.length === 0 && (
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">
            👆 Select one or more improvements above to see projected impact
          </p>
        </div>
      )}
    </div>
  );
}
