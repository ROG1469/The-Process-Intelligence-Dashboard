'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatDuration, TimeRange } from '@/data/processData';
import { fetchProcesses, mapTimeRange, transformProcessForFrontend } from '@/services/api';

interface ProcessTimelineChartProps {
  selectedProcess: string;
  timeRange: TimeRange;
  performanceThreshold: number;
  severityFilters: {
    Critical: boolean;
    High: boolean;
    Medium: boolean;
    Low: boolean;
  };
  viewMode?: 'desktop' | 'mobile';
}

interface ChartDataPoint {
  name: string;
  actualDuration: number;
  averageDuration: number;
  status: 'on-track' | 'delayed' | 'critical';
  id: string;
  riskScore: number;
  riskLevel: string;
}

// Color mapping for different statuses
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'on-track':
      return '#22c55e'; // brighter green-500
    case 'delayed':
      return '#f97316'; // brighter orange-500
    case 'critical':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Color mapping for risk levels (UNIVERSAL SCHEME)
const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'Critical':
      return '#ef4444'; // red-500
    case 'High':
    case 'Medium':
      return '#eab308'; // yellow-500
    case 'Low':
      return '#22c55e'; // green-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Format minutes with decimal
    const formatMinutes = (minutes: number) => {
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${minutes} min`;
    };
    
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-blue-300">
            <span className="text-gray-300">Actual Time:</span> {formatMinutes(data.actualDuration)}
          </p>
          <p className="text-purple-300">
            <span className="text-gray-300">Expected Time:</span> {formatMinutes(data.averageDuration)}
          </p>
          <p className={`font-medium ${
            data.status === 'on-track' ? 'text-green-300' :
            data.status === 'delayed' ? 'text-orange-300' : 'text-red-300'
          }`}>
            Status: {data.status.replace('-', ' ').toUpperCase()}
          </p>
          <p className="text-gray-400 text-sm">
            Efficiency: {((data.averageDuration / data.actualDuration) * 100).toFixed(0)}%
          </p>
          {data.actualDuration > data.averageDuration && (
            <p className="text-red-400 text-xs">
              ⚠️ Delayed by {formatMinutes(data.actualDuration - data.averageDuration)}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Y-axis tick formatter to truncate long names
const formatYAxisLabel = (value: string) => {
  return value.length > 15 ? `${value.substring(0, 15)}...` : value;
};

export default function ProcessTimelineChart({ 
  selectedProcess, 
  timeRange, 
  performanceThreshold, 
  severityFilters,
  viewMode = 'desktop'
}: ProcessTimelineChartProps) {
  // State for data fetching
  const [processData, setProcessData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Map frontend time range to backend format
        const backendRange = mapTimeRange(timeRange);
        
        // Fetch processes from backend
        const response = await fetchProcesses({
          range: backendRange,
          name: selectedProcess === 'all' ? undefined : selectedProcess
        });
        
        console.log('📊 Backend data received:', response);
        
        // Transform backend data to frontend format
        const transformedData = response.data.map(transformProcessForFrontend);
        
        setProcessData(transformedData);
      } catch (err) {
        console.error('Failed to load process data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Fallback to empty array on error
        setProcessData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Auto-refresh every 60 seconds (reduced from 30 to minimize flickering)
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [selectedProcess, timeRange]);

  // Helper function to calculate risk score (DRY - Don't Repeat Yourself!)
  const calculateRiskData = (step: any) => {
    const actualSeconds = step.actualDuration / 1000;
    const averageSeconds = step.averageDuration / 1000;
    
    const delayPercentage = averageSeconds > 0
      ? ((actualSeconds - averageSeconds) / averageSeconds) * 100
      : 0;
    
    const delayTime = actualSeconds - averageSeconds;
    
    // Calculate risk score (SAME algorithm as backend and InsightPanel)
    let riskScore = 0;
    const absDelayPercent = Math.abs(delayPercentage);
    if (absDelayPercent >= 50) riskScore += 50;
    else if (absDelayPercent >= 30) riskScore += 40;
    else if (absDelayPercent >= 20) riskScore += 30;
    else if (absDelayPercent >= 10) riskScore += 20;
    else riskScore += absDelayPercent;
    
    const status = String(step.status);
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
    
    // Determine risk level
    let riskLevel: string;
    if (riskScore >= 80) riskLevel = 'Critical';
    else if (riskScore >= 60) riskLevel = 'High';
    else if (riskScore >= 40) riskLevel = 'Medium';
    else riskLevel = 'Low';
    
    return { riskScore, riskLevel, delayPercentage };
  };

  // Get all process data and calculate risk for ALL data (before filtering)
  const allProcessData = processData;
  
  // Calculate risk for ALL processes ONCE
  const allProcessDataWithRisk = allProcessData.map(step => ({
    ...step,
    ...calculateRiskData(step)
  }));
  
  // Calculate UNFILTERED stats (for accurate totals)
  const unfilteredStats = {
    critical: allProcessDataWithRisk.filter(d => d.riskLevel === 'Critical').length,
    mediumHigh: allProcessDataWithRisk.filter(d => d.riskLevel === 'Medium' || d.riskLevel === 'High').length,
    low: allProcessDataWithRisk.filter(d => d.riskLevel === 'Low').length,
    total: allProcessDataWithRisk.length
  };
  
  // Now apply filters for chart display only
  let filteredData = allProcessDataWithRisk;
  
  // Filter by selected process
  if (selectedProcess !== 'all') {
    filteredData = filteredData.filter(step => step.id === selectedProcess);
  }
  
  // Filter by performance threshold
  filteredData = filteredData.filter(step => step.riskScore >= performanceThreshold);
  
  // Filter by severity checkboxes
  filteredData = filteredData.filter(step => {
    if (step.riskLevel === 'Critical') return severityFilters.Critical;
    if (step.riskLevel === 'High') return severityFilters.High;
    if (step.riskLevel === 'Medium') return severityFilters.Medium;
    if (step.riskLevel === 'Low') return severityFilters.Low;
    return true;
  });
  
  // Transform filtered data for the chart
  const chartData: ChartDataPoint[] = filteredData.map(step => {
    const actualMinutes = Math.max(0.1, Math.round((step.actualDuration / 60000) * 10) / 10);
    const averageMinutes = Math.max(0.1, Math.round((step.averageDuration / 60000) * 10) / 10);
    
    return {
      name: step.name,
      actualDuration: actualMinutes,
      averageDuration: averageMinutes,
      status: step.status,
      id: step.id,
      riskScore: step.riskScore,
      riskLevel: step.riskLevel
    };
  });

  // Calculate max duration for better chart scaling
  const maxDuration = Math.max(
    ...chartData.map(d => Math.max(d.actualDuration, d.averageDuration)),
    5 // Minimum scale of 5 minutes
  );

  // Debug logging
  console.log('Chart Data:', chartData);
  console.log('Max Duration:', maxDuration, 'minutes');

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading process data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-400 mb-2">Failed to load data</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-md text-sm hover:bg-blue-600/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-5xl mb-4">📊</div>
          <p className="text-gray-400 mb-2">No data available</p>
          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className={`${viewMode === 'mobile' ? 'mb-3' : 'mb-4'}`}>
        <h3 className={`${viewMode === 'mobile' ? 'text-lg' : 'text-xl'} font-semibold text-white mb-2`}>Process Timeline</h3>
        <p className={`${viewMode === 'mobile' ? 'text-sm' : 'text-gray-400 text-sm'}`}>
          Average processing time for each warehouse operation (measured in minutes)
        </p>
        <div className={`${viewMode === 'mobile' ? 'text-sm' : 'text-xs'} text-gray-500 mt-1`}>
          Showing {chartData.length} process{chartData.length !== 1 ? 'es' : ''} • Max duration: {maxDuration} min
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={viewMode === 'mobile' ? 300 : 400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 80,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151"
          />
          <XAxis 
            dataKey="name"
            stroke="#9ca3af"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tickFormatter={formatYAxisLabel}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={11}
            tickFormatter={(value) => `${value} min`}
            label={{ value: 'Duration (minutes)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Actual Duration Bars */}
          <Bar 
            dataKey="actualDuration" 
            name="Actual Duration"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`actual-${index}`} 
                fill={getRiskColor(entry.riskLevel)}
              />
            ))}
          </Bar>
          
          {/* Average Duration Bars (Semi-transparent overlay) */}
          <Bar 
            dataKey="averageDuration" 
            name="Average Duration"
            fill="#6366f1"
            opacity={0.3}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-300">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-300">Delayed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-300">Critical</span>
        </div>
      </div>

      {/* Performance Summary - Show UNFILTERED totals with proper colors */}
      <div className={`${viewMode === 'mobile' ? 'mt-3 grid grid-cols-1 gap-3' : 'mt-4 grid grid-cols-3 gap-4'} text-center`}>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-green-500 text-lg font-semibold">
            {unfilteredStats.low}
          </div>
          <div className={`${viewMode === 'mobile' ? 'text-base' : 'text-gray-400 text-sm'}`}>Low Risk</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-yellow-500 text-lg font-semibold">
            {unfilteredStats.mediumHigh}
          </div>
          <div className={`${viewMode === 'mobile' ? 'text-base' : 'text-gray-400 text-sm'}`}>Medium/High</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-red-500 text-lg font-semibold">
            {unfilteredStats.critical}
          </div>
          <div className={`${viewMode === 'mobile' ? 'text-base' : 'text-gray-400 text-sm'}`}>Critical</div>
        </div>
      </div>
    </div>
  );
}