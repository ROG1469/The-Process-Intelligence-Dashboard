export interface ProcessStep {
  id: string;
  name: string;
  averageDuration: number; // in milliseconds
  actualDuration: number; // in milliseconds
  lastUpdated: string; // ISO string
  status: 'on-track' | 'delayed' | 'critical';
}

export type TimeRange = '1h' | '6h' | '24h' | '7d';

// Amazon Warehouse Process Data - Different snapshots for different time ranges
const warehouseProcesses1Hour: ProcessStep[] = [
  {
    id: 'receiving',
    name: 'Receiving',
    averageDuration: 900000, // 15 minutes
    actualDuration: 840000, // 14 minutes
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'quality-check',
    name: 'Quality Check',
    averageDuration: 600000, // 10 minutes
    actualDuration: 780000, // 13 minutes
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'storing',
    name: 'Storing',
    averageDuration: 1200000, // 20 minutes
    actualDuration: 1080000, // 18 minutes
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'material-picking',
    name: 'Material Picking',
    averageDuration: 480000, // 8 minutes
    actualDuration: 420000, // 7 minutes
    lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'packaging',
    name: 'Packaging',
    averageDuration: 360000, // 6 minutes
    actualDuration: 540000, // 9 minutes
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    averageDuration: 720000, // 12 minutes
    actualDuration: 1260000, // 21 minutes
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'critical'
  }
];

const warehouseProcesses6Hours: ProcessStep[] = [
  {
    id: 'receiving',
    name: 'Receiving',
    averageDuration: 900000, // 15 minutes
    actualDuration: 960000, // 16 minutes
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'quality-check',
    name: 'Quality Check',
    averageDuration: 600000, // 10 minutes
    actualDuration: 570000, // 9.5 minutes
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'storing',
    name: 'Storing',
    averageDuration: 1200000, // 20 minutes
    actualDuration: 1800000, // 30 minutes
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'critical'
  },
  {
    id: 'material-picking',
    name: 'Material Picking',
    averageDuration: 480000, // 8 minutes
    actualDuration: 450000, // 7.5 minutes
    lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'packaging',
    name: 'Packaging',
    averageDuration: 360000, // 6 minutes
    actualDuration: 480000, // 8 minutes
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    averageDuration: 720000, // 12 minutes
    actualDuration: 690000, // 11.5 minutes
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'on-track'
  }
];

const warehouseProcesses24Hours: ProcessStep[] = [
  {
    id: 'receiving',
    name: 'Receiving',
    averageDuration: 900000, // 15 minutes
    actualDuration: 1080000, // 18 minutes
    lastUpdated: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'quality-check',
    name: 'Quality Check',
    averageDuration: 600000, // 10 minutes
    actualDuration: 900000, // 15 minutes
    lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'critical'
  },
  {
    id: 'storing',
    name: 'Storing',
    averageDuration: 1200000, // 20 minutes
    actualDuration: 1140000, // 19 minutes
    lastUpdated: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'material-picking',
    name: 'Material Picking',
    averageDuration: 480000, // 8 minutes
    actualDuration: 660000, // 11 minutes
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'packaging',
    name: 'Packaging',
    averageDuration: 360000, // 6 minutes
    actualDuration: 330000, // 5.5 minutes
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    averageDuration: 720000, // 12 minutes
    actualDuration: 720000, // 12 minutes
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  }
];

const warehouseProcesses7Days: ProcessStep[] = [
  {
    id: 'receiving',
    name: 'Receiving',
    averageDuration: 900000, // 15 minutes
    actualDuration: 870000, // 14.5 minutes
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'quality-check',
    name: 'Quality Check',
    averageDuration: 600000, // 10 minutes
    actualDuration: 720000, // 12 minutes
    lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'storing',
    name: 'Storing',
    averageDuration: 1200000, // 20 minutes
    actualDuration: 1500000, // 25 minutes
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delayed'
  },
  {
    id: 'material-picking',
    name: 'Material Picking',
    averageDuration: 480000, // 8 minutes
    actualDuration: 900000, // 15 minutes
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'critical'
  },
  {
    id: 'packaging',
    name: 'Packaging',
    averageDuration: 360000, // 6 minutes
    actualDuration: 390000, // 6.5 minutes
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'on-track'
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    averageDuration: 720000, // 12 minutes
    actualDuration: 780000, // 13 minutes
    lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delayed'
  }
];

// Function to get data based on selected time range
export const getProcessDataByTimeRange = (timeRange: TimeRange): ProcessStep[] => {
  switch (timeRange) {
    case '1h':
      return warehouseProcesses1Hour;
    case '6h':
      return warehouseProcesses6Hours;
    case '24h':
      return warehouseProcesses24Hours;
    case '7d':
      return warehouseProcesses7Days;
    default:
      return warehouseProcesses1Hour;
  }
};

// Default export for backward compatibility
export const processData: ProcessStep[] = warehouseProcesses1Hour;

// Helper function to format duration for display
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// Helper function to calculate performance ratio
export const getPerformanceRatio = (actual: number, average: number): number => {
  return (actual / average) * 100;
};

// Helper function to get status color for UI
export const getStatusColor = (status: ProcessStep['status']): string => {
  switch (status) {
    case 'on-track':
      return 'text-green-400';
    case 'delayed':
      return 'text-yellow-400';
    case 'critical':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

// Helper function to get background color for status badges
export const getStatusBgColor = (status: ProcessStep['status']): string => {
  switch (status) {
    case 'on-track':
      return 'bg-green-900/30 border-green-500/30';
    case 'delayed':
      return 'bg-yellow-900/30 border-yellow-500/30';
    case 'critical':
      return 'bg-red-900/30 border-red-500/30';
    default:
      return 'bg-gray-900/30 border-gray-500/30';
  }
};