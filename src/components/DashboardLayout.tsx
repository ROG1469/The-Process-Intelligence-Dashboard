'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import ProcessTimelineChart from './ProcessTimelineChart';
import InsightPanel from './InsightPanel';
import AIAssistant from './AIAssistant';
import { TimeRange } from '@/data/processData';
import { exportProcessesToCSV, exportInsightsToCSV, exportStatsToCSV } from '@/utils/exportData';
import { fetchProcesses, fetchAIInsightMessages } from '@/services/api';

// Add type mapping helper
const mapTimeRangeToAPI = (range: TimeRange): 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' => {
  const mapping = {
    '1h': 'last1Hour' as const,
    '6h': 'last6Hours' as const,
    '24h': 'last24Hours' as const,
    '7d': 'last7Days' as const,
  };
  return mapping[range];
};

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Resizable panels state
  const [chartWidth, setChartWidth] = useState(60); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [thresholdValue, setThresholdValue] = useState(75);
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1h');
  const [filterActive, setFilterActive] = useState(true);
  const [severityFilters, setSeverityFilters] = useState({
    Critical: true,
    High: true,
    Medium: true,
    Low: true
  });
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Handle resize drag
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const leftSidebarWidth = 320; // 320px fixed sidebar
      const x = e.clientX - rect.left - leftSidebarWidth;
      const availableWidth = rect.width - leftSidebarWidth;
      const newPercentage = (x / availableWidth) * 100;
      
      // Constrain between 30% and 80%
      if (newPercentage >= 30 && newPercentage <= 80) {
        setChartWidth(newPercentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle severity filter toggle
  const toggleSeverity = (severity: keyof typeof severityFilters) => {
    setSeverityFilters(prev => ({
      ...prev,
      [severity]: !prev[severity]
    }));
  };

  // Handle Export Report
  const handleExportReport = async () => {
    try {
      // Convert time range format
      const apiRange = mapTimeRangeToAPI(selectedTimeRange);
      
      // Fetch current data
      const processResponse = await fetchProcesses({ 
        range: apiRange,
        status: 'all',
        name: selectedProcess === 'all' ? undefined : selectedProcess 
      });
      
      const insightsResponse = await fetchAIInsightMessages(apiRange);
      
      // Extract actual process data from stats response
      const processes = processResponse.data || [];
      const insights = insightsResponse.messages || [];
      
      // Calculate statistics from the response
      const stats = {
        total: processResponse.stats?.total || processResponse.count || 0,
        critical: processes.filter((p: any) => p.status === 'critical').length,
        delayed: processResponse.stats?.delayed || 0,
        inProgress: processResponse.stats?.inProgress || 0,
        completed: processResponse.stats?.completed || 0,
        failed: processResponse.stats?.failed || 0,
        onTrack: processes.filter((p: any) => p.status === 'on-track').length,
      };
      
      // Export all data
      if (processes.length > 0) {
        exportProcessesToCSV(processes as any, { 
          filename: `processes-${selectedTimeRange}-${Date.now()}.csv`,
          includeTimestamp: true 
        });
      }
      
      setTimeout(() => {
        if (insights.length > 0) {
          // Convert insights messages to exportable format
          const exportableInsights = insights.map((msg: string, idx: number) => ({
            id: `insight-${idx}`,
            message: msg,
            severity: msg.includes('Critical') ? 'Critical' : msg.includes('High') ? 'High' : 'Medium',
            timestamp: new Date(),
            processName: selectedProcess !== 'all' ? selectedProcess : ''
          }));
          
          exportInsightsToCSV(exportableInsights as any, { 
            filename: `insights-${selectedTimeRange}-${Date.now()}.csv`,
            includeTimestamp: true 
          });
        }
      }, 500);
      
      setTimeout(() => {
        exportStatsToCSV(stats, selectedTimeRange, { 
          filename: `statistics-${selectedTimeRange}-${Date.now()}.csv`,
          includeTimestamp: true 
        });
      }, 1000);
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Handle Refresh
  const handleRefresh = () => {
    window.location.reload();
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Process Intelligence Hub</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">Last updated: 2 minutes ago</div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div ref={containerRef} className="flex h-[calc(100vh-5rem)]">
        {/* Left Sidebar - Process Selector & Filters */}
        <aside className="w-80 bg-gray-900/60 backdrop-blur-sm border-r border-gray-700/50 transform transition-all duration-300 ease-in-out hover:bg-gray-900/70">
          <div className="p-6 h-full overflow-y-auto">
            <div className="space-y-6">
              {/* Process Selector */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30 transition-all duration-200 hover:border-gray-600/50">
                <h2 className="text-lg font-semibold text-white mb-4">Process Selection</h2>
                <div className="space-y-3">
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                      value={selectedProcess}
                      onChange={(e) => setSelectedProcess(e.target.value)}
                    >
                      <option value="all">All Processes</option>
                      <option value="receiving">Receiving</option>
                      <option value="quality-check">Quality Check</option>
                      <option value="storing">Storing</option>
                      <option value="material-picking">Material Picking</option>
                      <option value="packaging">Packaging</option>
                      <option value="dispatch">Dispatch</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className={`px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                        filterActive 
                          ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                          : 'bg-gray-700/50 border border-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                      }`}
                      onClick={() => setFilterActive(true)}
                    >
                      Active
                    </button>
                    <button 
                      className={`px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                        !filterActive 
                          ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                          : 'bg-gray-700/50 border border-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                      }`}
                      onClick={() => setFilterActive(false)}
                    >
                      All
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30 transition-all duration-200 hover:border-gray-600/50">
                <h3 className="text-md font-semibold text-white mb-4">Filters</h3>
                <div className="space-y-4">
                  {/* Time Range */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Time Range</label>
                    <select 
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={selectedTimeRange}
                      onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
                    >
                      <option value="1h">Last 1 hour</option>
                      <option value="6h">Last 6 hours</option>
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Severity Filter
                      <span className="text-xs text-gray-500 ml-2">
                        ({Object.values(severityFilters).filter(Boolean).length}/4 active)
                      </span>
                    </label>
                    <div className="space-y-2">
                      {(Object.keys(severityFilters) as Array<keyof typeof severityFilters>).map((severity) => (
                        <label key={severity} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={severityFilters[severity]}
                            onChange={() => toggleSeverity(severity)}
                            className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                          />
                          <span className={`text-sm transition-colors ${
                            severityFilters[severity] ? 'text-gray-300' : 'text-gray-500 line-through'
                          } group-hover:text-white`}>
                            {severity}
                          </span>
                          <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                            severity === 'Critical' ? 'bg-red-900/30 text-red-300' :
                            severity === 'High' ? 'bg-orange-900/30 text-orange-300' :
                            severity === 'Medium' ? 'bg-yellow-900/30 text-yellow-300' :
                            'bg-blue-900/30 text-blue-300'
                          }`}>
                            {severity === 'Critical' ? '>80' :
                             severity === 'High' ? '60-80' :
                             severity === 'Medium' ? '40-60' :
                             '<40'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Performance Threshold */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Performance Threshold
                      <span className="text-xs text-gray-500 ml-2">
                        (Hide processes below {thresholdValue}% risk)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={thresholdValue}
                        onChange={(e) => setThresholdValue(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      {/* Live Value Display */}
                      <div 
                        className="absolute -top-8 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg transition-all duration-300 ease-out transform -translate-x-1/2"
                        style={{ 
                          left: `${thresholdValue}%`,
                          opacity: 1,
                          animation: 'fadeIn 0.3s ease-out'
                        }}
                      >
                        {thresholdValue}%
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-blue-600"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0% (Show All)</span>
                      <span>100% (Critical Only)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                <h3 className="text-md font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setIsMonitoring(!isMonitoring)}
                    className={`w-full px-3 py-2 rounded-md text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      isMonitoring 
                        ? 'bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30' 
                        : 'bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30'
                    }`}
                  >
                    {isMonitoring ? (
                      <>
                        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                        Stop Monitoring
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Start Monitoring
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleExportReport}
                    className="w-full bg-blue-600/20 border border-blue-500/30 text-blue-300 px-3 py-2 rounded-md text-sm hover:bg-blue-600/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                  </button>
                  <button 
                    onClick={handleRefresh}
                    className="w-full bg-orange-600/20 border border-orange-500/30 text-orange-300 px-3 py-2 rounded-md text-sm hover:bg-orange-600/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Main Chart Area (Resizable) */}
        <main 
          className="bg-gray-800/30 backdrop-blur-sm transform transition-all duration-300 ease-in-out"
          style={{ width: `${chartWidth}%` }}
        >
          <div className="p-6 h-full">
            <div className="bg-gray-900/40 rounded-lg border border-gray-700/50 h-full p-6 transition-all duration-200 hover:border-gray-600/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Performance Metrics</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-sm text-gray-300">
                      {isMonitoring ? 'Live Monitoring' : 'Paused'}
                    </span>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    className="bg-gray-700/50 border border-gray-600/50 px-3 py-1 rounded-md text-sm text-gray-300 hover:bg-gray-600/50 transition-all duration-200"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div className="bg-gray-800/30 rounded-lg border border-gray-700/30 h-[calc(100%-5rem)] p-4">
                <ProcessTimelineChart 
                  selectedProcess={selectedProcess}
                  timeRange={selectedTimeRange}
                  performanceThreshold={thresholdValue}
                  severityFilters={severityFilters}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Resizable Divider */}
        <div 
          className={`w-1 bg-gray-700/50 hover:bg-blue-500 cursor-col-resize transition-colors ${isDragging ? 'bg-blue-500' : ''}`}
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-1 h-16 bg-gray-600 rounded-full"></div>
          </div>
        </div>

        {/* Right Sidebar - Insights Panel (Resizable) */}
        <aside 
          className="bg-gray-900/60 backdrop-blur-sm border-l border-gray-700/50 transform transition-all duration-300 ease-in-out hover:bg-gray-900/70"
          style={{ width: `${100 - chartWidth}%` }}
        >
          <div className="p-6 h-full overflow-y-auto">
            <InsightPanel 
              selectedProcess={selectedProcess}
              timeRange={selectedTimeRange}
              performanceThreshold={thresholdValue}
              severityFilters={severityFilters}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}