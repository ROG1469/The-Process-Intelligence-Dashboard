// API Service Layer - Connects Frontend to Backend
// All backend API calls go through this file

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============================================================================
// TYPES - Match backend response structures
// ============================================================================

export interface ProcessStep {
  id: string;
  name: string;
  average_duration: number; // seconds from backend
  actual_duration: number;  // seconds from backend
  status: 'completed' | 'in-progress' | 'delayed' | 'failed';
  timestamp: string;
  created_at?: string;
  updated_at?: string;
}

export interface DelayedProcess extends ProcessStep {
  delay_seconds: number;
  delay_percentage: number;
}

export interface ProcessSummary {
  process_name: string;
  total_count: number;
  avg_duration: number;
  max_duration: number;
  min_duration: number;
  delayed_count: number;
}

export interface Insight {
  id: string;
  process_id: string;
  risk_score: number;
  recommendation: string;
  timestamp: string;
  created_at?: string;
  process?: ProcessStep; // From JOIN query
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

export interface ProcessStatsResponse {
  success: boolean;
  count: number;
  stats: {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
    failed: number;
  };
  data: ProcessStep[];
  filters?: {
    range: string;
    status: string;
    name: string;
  };
}

// ============================================================================
// PROCESS ENDPOINTS
// ============================================================================

/**
 * Fetch all processes with optional filters
 * @param filters - Optional filters for range, status, name
 * @returns Process steps with statistics
 */
export const fetchProcesses = async (filters?: {
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days';
  status?: 'all' | 'completed' | 'in-progress' | 'delayed' | 'failed';
  name?: string;
}): Promise<ProcessStatsResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters?.range) params.append('range', filters.range);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.name && filters.name !== 'all') params.append('name', filters.name);
    
    const url = `${API_BASE_URL}/api/processes${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🔍 Fetching processes from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Processes fetched:', data.count, 'records');
    return data;
  } catch (error) {
    console.error('❌ Error fetching processes:', error);
    throw error;
  }
};

/**
 * Fetch delayed processes (bottlenecks)
 * @param range - Time range filter
 * @returns Delayed processes with delay calculations
 */
export const fetchDelayedProcesses = async (
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' | 'all'
): Promise<ApiResponse<DelayedProcess[]> & { count: number; range: string }> => {
  try {
    const params = range ? `?range=${range}` : '';
    const url = `${API_BASE_URL}/api/processes/delayed${params}`;
    console.log('🔍 Fetching delayed processes from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('⚠️ Delayed processes found:', data.count);
    return data;
  } catch (error) {
    console.error('❌ Error fetching delayed processes:', error);
    throw error;
  }
};

/**
 * Fetch process summary statistics grouped by process name
 * @param range - Time range filter
 * @returns Summary statistics for each process type
 */
export const fetchProcessSummary = async (
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' | 'all'
): Promise<ApiResponse<ProcessSummary[]> & { total_processes: number; range: string }> => {
  try {
    const params = range ? `?range=${range}` : '';
    const url = `${API_BASE_URL}/api/processes/summary${params}`;
    console.log('🔍 Fetching process summary from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Process summary:', data.total_processes, 'process types');
    return data;
  } catch (error) {
    console.error('❌ Error fetching process summary:', error);
    throw error;
  }
};

/**
 * Fetch a single process by ID
 * @param id - Process ID
 * @returns Single process with related insights
 */
export const fetchProcessById = async (id: string): Promise<ApiResponse<ProcessStep & { insights: Insight[] }>> => {
  try {
    const url = `${API_BASE_URL}/api/processes/${id}`;
    console.log('🔍 Fetching process by ID:', id);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching process by ID:', error);
    throw error;
  }
};

// ============================================================================
// INSIGHTS ENDPOINTS
// ============================================================================

/**
 * Fetch AI-powered insight messages from intelligent analysis
 * Returns simple text messages for display in AI panel
 * @param range - Time range filter
 * @param threshold - Risk threshold (0-100)
 * @returns Array of human-readable insight messages
 */
export const fetchAIInsightMessages = async (
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days',
  threshold: number = 60
): Promise<{ success: boolean; count: number; messages: string[]; details?: any[] }> => {
  try {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    params.append('threshold', threshold.toString());
    
    const url = `${API_BASE_URL}/api/insights?${params.toString()}`;
    console.log('💬 Fetching AI insight messages from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ AI messages received:', data.count, 'insights');
    console.log('📝 Messages:', data.messages);
    return data;
  } catch (error) {
    console.error('❌ Error fetching AI insight messages:', error);
    // Return fallback messages on error
    return {
      success: false,
      count: 0,
      messages: ['❌ Unable to load insights — please check your connection']
    };
  }
};

/**
 * Fetch all insights with optional filters
 * @deprecated This endpoint queries old 'insights' table. Use fetchAIInsightMessages instead.
 * @param filters - Optional filters for range and minimum risk score
 * @returns Insights with related process data
 */
export const fetchInsights = async (filters?: {
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' | 'all';
  minRisk?: number;
}): Promise<ApiResponse<Insight[]> & { count: number }> => {
  try {
    const params = new URLSearchParams();
    if (filters?.range) params.append('range', filters.range);
    if (filters?.minRisk !== undefined) params.append('minRisk', filters.minRisk.toString());
    
    const url = `${API_BASE_URL}/api/insights${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🔍 Fetching insights from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('💡 Insights fetched:', data.count, 'records');
    return data;
  } catch (error) {
    console.error('❌ Error fetching insights:', error);
    throw error;
  }
};

/**
 * Fetch high-risk insights only (risk_score >= 70)
 * @param range - Time range filter
 * @returns High-risk insights with process details
 */
export const fetchHighRiskInsights = async (
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' | 'all'
): Promise<ApiResponse<Insight[]> & { count: number; range: string }> => {
  try {
    const params = range ? `?range=${range}` : '';
    const url = `${API_BASE_URL}/api/insights/high-risk${params}`;
    console.log('🔍 Fetching high-risk insights from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🚨 High-risk insights found:', data.count);
    return data;
  } catch (error) {
    console.error('❌ Error fetching high-risk insights:', error);
    throw error;
  }
};

/**
 * Fetch a single insight by ID
 * @param id - Insight ID
 * @returns Single insight with related process data
 */
export const fetchInsightById = async (id: string): Promise<ApiResponse<Insight>> => {
  try {
    const url = `${API_BASE_URL}/api/insights/${id}`;
    console.log('🔍 Fetching insight by ID:', id);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching insight by ID:', error);
    throw error;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map frontend time range format to backend format
 */
export const mapTimeRange = (frontendRange: '1h' | '6h' | '24h' | '7d'): 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' => {
  const rangeMap = {
    '1h': 'last1Hour' as const,
    '6h': 'last6Hours' as const,
    '24h': 'last24Hours' as const,
    '7d': 'last7Days' as const
  };
  return rangeMap[frontendRange];
};

/**
 * Map backend status to frontend status format
 * Backend uses: 'completed', 'in-progress', 'delayed', 'critical', 'failed'
 * Frontend uses the same values - just pass through!
 */
export const mapBackendStatus = (backendStatus: string): string => {
  // No mapping needed - backend status is already correct!
  return backendStatus;
};

/**
 * Convert seconds to milliseconds (backend uses seconds, frontend uses ms)
 */
export const secondsToMilliseconds = (seconds: number): number => {
  return seconds * 1000;
};

/**
 * Convert milliseconds to seconds (frontend uses ms, backend uses seconds)
 */
export const millisecondsToSeconds = (milliseconds: number): number => {
  return Math.floor(milliseconds / 1000);
};

/**
 * Transform backend process data to frontend format
 */
export const transformProcessForFrontend = (backendProcess: ProcessStep) => {
  return {
    id: backendProcess.id,
    name: backendProcess.name,
    actualDuration: secondsToMilliseconds(backendProcess.actual_duration),
    averageDuration: secondsToMilliseconds(backendProcess.average_duration),
    status: mapBackendStatus(backendProcess.status),
    lastUpdated: backendProcess.timestamp,
    timestamp: backendProcess.timestamp
  };
};

/**
 * Transform backend insight to frontend format
 */
export const transformInsightForFrontend = (backendInsight: Insight) => {
  const delayPercentage = backendInsight.process 
    ? ((backendInsight.process.actual_duration - backendInsight.process.average_duration) / backendInsight.process.average_duration) * 100
    : 0;

  return {
    processName: backendInsight.process?.name || 'Unknown Process',
    riskScore: backendInsight.risk_score,
    recommendation: backendInsight.recommendation,
    delayPercentage: Math.round(delayPercentage * 10) / 10, // Round to 1 decimal
    timestamp: backendInsight.timestamp,
    id: backendInsight.id,
    processId: backendInsight.process_id
  };
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if backend API is reachable
 * @returns true if backend is up, false otherwise
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/processes?range=last1Hour`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return false;
  }
};

const apiService = {
  fetchProcesses,
  fetchDelayedProcesses,
  fetchProcessSummary,
  fetchProcessById,
  fetchInsights,
  fetchHighRiskInsights,
  fetchInsightById,
  checkBackendHealth,
  mapTimeRange,
  transformProcessForFrontend,
  transformInsightForFrontend
};

export default apiService;

// ============================================================================
// ENHANCED ANALYTICS ENDPOINT (Stage 2.1.6)
// ============================================================================

export interface BottleneckAnalysis {
  processId: string;
  processName: string;
  status: string;
  delaySeconds: number;
  delayPercentage: number;
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  isPotentialBottleneck: boolean;
  recommendation: string;
  impact: {
    potentialTimeSavings: string;
    estimatedCostImpact: string;
    efficiencyGain: string;
  };
  timestamp: string;
  metrics: {
    averageDuration: number;
    actualDuration: number;
    efficiency: number;
  };
}

export interface ProcessTrend {
  processName: string;
  occurrences: number;
  totalDelay: number;
  avgRisk: number;
  status: 'healthy' | 'warning' | 'critical';
  avgDelayPerProcess: number;
}

export interface ComprehensiveAnalysis {
  summary: {
    totalProcesses: number;
    delayedProcesses: number;
    bottleneckCount: number;
    criticalBottlenecks: number;
    highRiskBottlenecks: number;
    averageRiskScore: number;
    totalDelayTime: string;
    healthScore: number;
    timeRange: string;
    generatedAt: string;
  };
  bottlenecks: BottleneckAnalysis[];
  insights: {
    total: number;
    highRisk: number;
    recentInsights: Array<{
      id: string;
      processId: string;
      riskScore: number;
      recommendation: string;
      timestamp: string;
    }>;
  };
  trends: ProcessTrend[];
  recommendations: {
    immediate: Array<{
      process: string;
      action: string;
      priority: string;
      expectedImpact: any;
    }>;
    scheduled: Array<{
      process: string;
      action: string;
      priority: string;
      expectedImpact: any;
    }>;
  };
}

/**
 * Fetch comprehensive bottleneck analysis with AI-powered insights
 * This is the enhanced analytics endpoint that aggregates all data
 * @param range - Time range filter
 * @param threshold - Minimum delay percentage to consider as bottleneck (default: 0)
 * @returns Comprehensive analysis with bottlenecks, trends, and recommendations
 */
export const fetchComprehensiveAnalysis = async (
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days' | 'all',
  threshold: number = 0
): Promise<ComprehensiveAnalysis> => {
  try {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (threshold > 0) params.append('threshold', threshold.toString());
    
    const url = `${API_BASE_URL}/api/insights${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🔍 Fetching AI-powered analysis from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🤖 AI Analysis received:', {
      aiEnabled: true,
      count: data.count || 0,
      range: data.range
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching AI analysis:', error);
    throw error;
  }
};
