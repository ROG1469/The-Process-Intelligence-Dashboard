'use client';

import React from 'react';
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
import { getProcessDataByTimeRange, formatDuration, TimeRange } from '@/data/processData';

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
}

interface ChartDataPoint {
  name: string;
  actualDuration: number;
  averageDuration: number;
  status: 'on-track' | 'delayed' | 'critical';
  id: string;
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
  severityFilters 
}: ProcessTimelineChartProps) {
  // Get data based on selected time range
  const allProcessData = getProcessDataByTimeRange(timeRange);
  
  // Filter data based on selected process
  let filteredData = selectedProcess === 'all' 
    ? allProcessData 
    : allProcessData.filter(step => step.id === selectedProcess);
  
  // Apply performance threshold filter (based on risk score)
  filteredData = filteredData.filter(step => {
    const performanceRatio = (step.actualDuration / step.averageDuration) * 100;
    const delayPercentage = performanceRatio - 100;
    
    // Calculate approximate risk score
    let riskScore = 0;
    if (delayPercentage <= 0) {
      riskScore = 10;
    } else if (delayPercentage <= 20) {
      riskScore = 20 + (delayPercentage * 1.5);
    } else if (delayPercentage <= 50) {
      riskScore = 50 + (delayPercentage - 20);
    } else {
      riskScore = Math.min(100, 80 + (delayPercentage - 50) * 0.5);
    }
    
    return riskScore >= performanceThreshold;
  });
  
  // Apply severity filters
  filteredData = filteredData.filter(step => {
    const status = step.status;
    if (status === 'critical') return severityFilters.Critical;
    if (status === 'delayed') return severityFilters.High || severityFilters.Medium;
    if (status === 'on-track') return severityFilters.Low;
    return true;
  });
  
  // Transform data for the chart with fallback values
  // Convert milliseconds to minutes (warehouse operations are measured in minutes, not seconds)
  const chartData: ChartDataPoint[] = filteredData.map(step => {
    const actualMinutes = Math.max(0.1, Math.round((step.actualDuration / 60000) * 10) / 10); // Round to 1 decimal
    const averageMinutes = Math.max(0.1, Math.round((step.averageDuration / 60000) * 10) / 10);
    
    return {
      name: step.name,
      actualDuration: actualMinutes,
      averageDuration: averageMinutes,
      status: step.status,
      id: step.id
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

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">Process Timeline</h3>
        <p className="text-gray-400 text-sm">
          Average processing time for each warehouse operation (measured in minutes)
        </p>
        <div className="text-xs text-gray-500 mt-1">
          Showing {chartData.length} process{chartData.length !== 1 ? 'es' : ''} • Max duration: {maxDuration} min
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
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
                fill={getStatusColor(entry.status)}
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

      {/* Performance Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-green-400 text-lg font-semibold">
            {chartData.filter(d => d.status === 'on-track').length}
          </div>
          <div className="text-gray-400 text-sm">On Track</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-orange-400 text-lg font-semibold">
            {chartData.filter(d => d.status === 'delayed').length}
          </div>
          <div className="text-gray-400 text-sm">Delayed</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-red-400 text-lg font-semibold">
            {chartData.filter(d => d.status === 'critical').length}
          </div>
          <div className="text-gray-400 text-sm">Critical</div>
        </div>
      </div>
    </div>
  );
}