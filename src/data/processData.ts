// Process Data Types and Utilities - Backend API Integration
// All data comes from Supabase database via API

export interface ProcessStep {
  id: string;
  name: string;
  averageDuration: number;
  actualDuration: number;
  lastUpdated: string;
  status: 'on-track' | 'delayed' | 'critical' | 'completed';
}

export type TimeRange = '1h' | '6h' | '24h' | '7d';

// Utility Functions
export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

export const getPerformanceRatio = (actual: number, average: number): number => {
  return (actual / average) * 100;
};

export const getStatusColor = (status: ProcessStep['status']): string => {
  switch (status) {
    case 'on-track':
    case 'completed': return '#22c55e';
    case 'delayed': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

export const getStatusBgColor = (status: ProcessStep['status']): string => {
  switch (status) {
    case 'on-track':
    case 'completed': return 'bg-green-500/20 border-green-500/30';
    case 'delayed': return 'bg-orange-500/20 border-orange-500/30';
    case 'critical': return 'bg-red-500/20 border-red-500/30';
    default: return 'bg-gray-500/20 border-gray-500/30';
  }
};

// Deprecated - use API service
export const getProcessDataByTimeRange = (timeRange: TimeRange): ProcessStep[] => {
  console.warn('Use fetchProcesses() from @/services/api');
  return [];
};

export const processData: ProcessStep[] = [];
