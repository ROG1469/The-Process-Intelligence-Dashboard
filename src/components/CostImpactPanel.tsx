'use client';

import { useMemo } from 'react';
import { getProcessDataByTimeRange, TimeRange } from '@/data/processData';
import { analyzeProcesses } from '@/aiLogic';

interface CostImpactPanelProps {
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

interface CostCalculation {
  processName: string;
  delayMinutes: number;
  costPerDay: number;
  costPerWeek: number;
  costPerMonth: number;
  ordersAffected: number;
}

export default function CostImpactPanel({
  selectedProcess,
  timeRange,
  performanceThreshold,
  severityFilters
}: CostImpactPanelProps) {
  
  const costData = useMemo(() => {
    // Get data based on selected time range
    const allProcessData = getProcessDataByTimeRange(timeRange);
    
    // Filter by selected process
    const filteredData = selectedProcess === 'all' 
      ? allProcessData 
      : allProcessData.filter(step => step.id === selectedProcess);
    
    const analyses = analyzeProcesses(filteredData);
    
    // Filter by severity and threshold
    const bottlenecks = analyses.filter(analysis => {
      const severityMatch = severityFilters[analysis.riskLevel as keyof typeof severityFilters];
      const thresholdMatch = analysis.delayPercentage >= (performanceThreshold - 100);
      return analysis.isPotentialBottleneck && severityMatch && thresholdMatch;
    });
    
    // Calculate costs for each bottleneck
    const calculations: CostCalculation[] = bottlenecks.map(analysis => {
      const delayMinutes = (analysis.actualDuration - analysis.averageDuration) / 60000;
      
      // Cost assumptions for Amazon warehouse
      const HOURLY_OPERATION_COST = 500; // $500/hour operational cost
      const ORDERS_PER_DAY = 1000; // Average orders processed
      const ORDERS_AFFECTED_PERCENT = Math.min(analysis.delayPercentage / 100, 1);
      
      // Calculate daily delay cost
      const costPerMinute = HOURLY_OPERATION_COST / 60;
      const ordersAffected = Math.floor(ORDERS_PER_DAY * ORDERS_AFFECTED_PERCENT);
      const costPerDay = delayMinutes * costPerMinute * ordersAffected;
      
      return {
        processName: analysis.processName,
        delayMinutes: Math.round(delayMinutes * 10) / 10,
        costPerDay: Math.round(costPerDay),
        costPerWeek: Math.round(costPerDay * 7),
        costPerMonth: Math.round(costPerDay * 30),
        ordersAffected
      };
    });
    
    // Calculate totals
    const totalCostPerDay = calculations.reduce((sum, calc) => sum + calc.costPerDay, 0);
    const totalCostPerWeek = calculations.reduce((sum, calc) => sum + calc.costPerWeek, 0);
    const totalCostPerMonth = calculations.reduce((sum, calc) => sum + calc.costPerMonth, 0);
    const totalOrdersAffected = calculations.reduce((sum, calc) => sum + calc.ordersAffected, 0);
    
    return {
      calculations,
      totals: {
        costPerDay: totalCostPerDay,
        costPerWeek: totalCostPerWeek,
        costPerMonth: totalCostPerMonth,
        ordersAffected: totalOrdersAffected,
        bottleneckCount: calculations.length
      }
    };
  }, [selectedProcess, timeRange, performanceThreshold, severityFilters]);

  if (costData.calculations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 text-sm">No bottlenecks detected. System running efficiently! ✅</p>
      </div>
    );
  }

  return (
    <div>
      {/* Total Impact Summary */}
      <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-red-300 font-semibold text-sm flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            Total Financial Impact
          </h4>
          <span className="bg-red-500/20 px-3 py-1 rounded-full text-xs text-red-300 font-medium">
            {costData.totals.bottleneckCount} Bottleneck{costData.totals.bottleneckCount > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/40 rounded-lg p-3 border border-red-500/20">
            <div className="text-gray-400 text-[10px] mb-1">DAILY LOSS</div>
            <div className="text-red-400 font-bold text-lg">
              ${costData.totals.costPerDay.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-900/40 rounded-lg p-3 border border-orange-500/20">
            <div className="text-gray-400 text-[10px] mb-1">WEEKLY LOSS</div>
            <div className="text-orange-400 font-bold text-lg">
              ${costData.totals.costPerWeek.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-900/40 rounded-lg p-3 border border-yellow-500/20">
            <div className="text-gray-400 text-[10px] mb-1">MONTHLY LOSS</div>
            <div className="text-yellow-400 font-bold text-lg">
              ${costData.totals.costPerMonth.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Orders Affected Daily:</span>
            <span className="text-red-300 font-semibold">{costData.totals.ordersAffected.toLocaleString()} orders</span>
          </div>
        </div>
      </div>

      {/* Individual Bottleneck Costs */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Breakdown by Process:</h4>
        {costData.calculations.map((calc, index) => (
          <div 
            key={index}
            className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-white font-semibold text-sm">{calc.processName}</h5>
              <span className="bg-red-500/20 px-2 py-1 rounded text-xs text-red-300">
                +{calc.delayMinutes} min delay
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-gray-500 text-[10px]">Daily</div>
                <div className="text-red-400 font-semibold">${calc.costPerDay.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-[10px]">Weekly</div>
                <div className="text-orange-400 font-semibold">${calc.costPerWeek.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-[10px]">Monthly</div>
                <div className="text-yellow-400 font-semibold">${calc.costPerMonth.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-700/30 text-xs text-gray-400">
              Affects ~{calc.ordersAffected} orders/day
            </div>
          </div>
        ))}
      </div>

      {/* Explanation Note */}
      <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-300 text-xs leading-relaxed">
          💡 <strong>Note:</strong> Costs calculated based on $500/hour operational cost and delay impact on order throughput. 
          These are estimated losses from reduced efficiency.
        </p>
      </div>
    </div>
  );
}
