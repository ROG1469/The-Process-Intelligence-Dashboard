/**
 * Data export utilities for CSV and future PDF export
 */

export interface ProcessData {
  id: string;
  name: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  delay?: number;
  severity?: string;
  riskLevel?: string;
  riskScore?: number;
}

export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
  columns?: string[];
}

/**
 * Convert process data to CSV format
 */
export function convertToCSV(data: ProcessData[], options: ExportOptions = {}): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const columns = options.columns || [
    'id',
    'name',
    'status',
    'startTime',
    'endTime',
    'duration',
    'delay',
    'severity',
    'riskLevel',
    'riskScore'
  ];

  // Create CSV header
  const header = columns.join(',');

  // Create CSV rows
  const rows = data.map(process => {
    return columns.map(column => {
      let value = process[column as keyof ProcessData];
      
      // Format dates
      if (column === 'startTime' || column === 'endTime') {
        value = value ? new Date(value).toISOString() : '';
      }
      
      // Handle undefined/null values
      if (value === undefined || value === null) {
        return '';
      }
      
      // Escape commas and quotes in string values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Download CSV file to browser
 */
export function downloadCSV(csvContent: string, filename: string = 'export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    URL.revokeObjectURL(url);
  }
}

/**
 * Export process data to CSV file
 */
export function exportProcessesToCSV(
  data: ProcessData[],
  options: ExportOptions = {}
): void {
  const timestamp = options.includeTimestamp !== false
    ? new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    : '';
  
  const filename = options.filename || `process-data${timestamp ? '-' + timestamp : ''}.csv`;
  
  const csvContent = convertToCSV(data, options);
  downloadCSV(csvContent, filename);
}

/**
 * Export insights data to CSV file
 */
export function exportInsightsToCSV(
  insights: Array<{
    id: string;
    message: string;
    severity: string;
    timestamp: Date;
    processId?: string;
    processName?: string;
  }>,
  options: ExportOptions = {}
): void {
  const timestamp = options.includeTimestamp !== false
    ? new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    : '';
  
  const filename = options.filename || `ai-insights${timestamp ? '-' + timestamp : ''}.csv`;
  
  if (!insights || insights.length === 0) {
    downloadCSV('No insights available', filename);
    return;
  }

  const columns = ['id', 'severity', 'message', 'processName', 'timestamp'];
  const header = columns.join(',');
  
  const rows = insights.map(insight => {
    const values = [
      insight.id,
      insight.severity,
      `"${insight.message.replace(/"/g, '""')}"`,
      insight.processName || '',
      new Date(insight.timestamp).toISOString()
    ];
    return values.join(',');
  });

  const csvContent = [header, ...rows].join('\n');
  downloadCSV(csvContent, filename);
}

/**
 * Export statistics summary to CSV
 */
export function exportStatsToCSV(
  stats: {
    total: number;
    critical: number;
    delayed: number;
    inProgress: number;
    completed: number;
    failed: number;
    onTrack: number;
  },
  timeRange: string,
  options: ExportOptions = {}
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = options.filename || `statistics-${timeRange}-${timestamp}.csv`;
  
  const csvContent = [
    'Metric,Count',
    `Time Range,${timeRange}`,
    `Total Processes,${stats.total}`,
    `Critical,${stats.critical}`,
    `Failed,${stats.failed}`,
    `Delayed,${stats.delayed}`,
    `In Progress,${stats.inProgress}`,
    `Completed,${stats.completed}`,
    `On Track,${stats.onTrack}`,
    `Export Date,${new Date().toISOString()}`
  ].join('\n');
  
  downloadCSV(csvContent, filename);
}
