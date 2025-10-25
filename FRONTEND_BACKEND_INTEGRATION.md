# Frontend-Backend Integration Plan

## Current State ❌
The dashboard is using **HARDCODED MOCK DATA** from:
- `src/data/processData.ts` - Fake warehouse process data
- `src/aiLogic.ts` - Fake AI-generated insights
- Components fetch data from local TypeScript files, NOT from backend API

## What Needs to Change ✅

### 1. Create API Service Layer
Create `src/services/api.ts` to handle all backend API calls:

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:5000/api';

export interface ProcessStep {
  id: string;
  name: string;
  average_duration: number; // seconds from backend
  actual_duration: number;  // seconds from backend
  status: 'completed' | 'in-progress' | 'delayed' | 'failed';
  timestamp: string;
}

export interface Insight {
  id: string;
  process_id: string;
  risk_score: number;
  recommendation: string;
  timestamp: string;
  process?: ProcessStep; // From JOIN query
}

// Fetch all processes with optional filters
export const fetchProcesses = async (filters?: {
  range?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days';
  status?: string;
  name?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.range) params.append('range', filters.range);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.name) params.append('name', filters.name);
  
  const response = await fetch(`${API_BASE_URL}/processes?${params}`);
  if (!response.ok) throw new Error('Failed to fetch processes');
  return response.json();
};

// Fetch delayed processes (bottlenecks)
export const fetchDelayedProcesses = async (range?: string) => {
  const params = range ? `?range=${range}` : '';
  const response = await fetch(`${API_BASE_URL}/processes/delayed${params}`);
  if (!response.ok) throw new Error('Failed to fetch delayed processes');
  return response.json();
};

// Fetch process summary statistics
export const fetchProcessSummary = async (range?: string) => {
  const params = range ? `?range=${range}` : '';
  const response = await fetch(`${API_BASE_URL}/processes/summary${params}`);
  if (!response.ok) throw new Error('Failed to fetch summary');
  return response.json();
};

// Fetch all insights with optional filters
export const fetchInsights = async (filters?: {
  range?: string;
  minRisk?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.range) params.append('range', filters.range);
  if (filters?.minRisk) params.append('minRisk', filters.minRisk.toString());
  
  const response = await fetch(`${API_BASE_URL}/insights?${params}`);
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
};

// Fetch high-risk insights only (risk_score >= 70)
export const fetchHighRiskInsights = async (range?: string) => {
  const params = range ? `?range=${range}` : '';
  const response = await fetch(`${API_BASE_URL}/insights/high-risk${params}`);
  if (!response.ok) throw new Error('Failed to fetch high-risk insights');
  return response.json();
};
```

### 2. Update ProcessTimelineChart Component

**Current** (line 109):
```typescript
const allProcessData = getProcessDataByTimeRange(timeRange);
```

**Change to**:
```typescript
'use client';
import { useState, useEffect } from 'react';
import { fetchProcesses } from '@/services/api';

export default function ProcessTimelineChart({ 
  selectedProcess, 
  timeRange, 
  performanceThreshold, 
  severityFilters 
}: ProcessTimelineChartProps) {
  const [processData, setProcessData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Map frontend time range to backend format
        const rangeMap = {
          '1h': 'last1Hour',
          '6h': 'last6Hours',
          '24h': 'last24Hours',
          '7d': 'last7Days'
        };
        
        const response = await fetchProcesses({
          range: rangeMap[timeRange],
          name: selectedProcess === 'all' ? undefined : selectedProcess
        });
        
        // Transform backend data to frontend format
        const transformedData = response.data.map(step => ({
          id: step.id,
          name: step.name,
          actualDuration: step.actual_duration * 1000, // Convert seconds to ms
          averageDuration: step.average_duration * 1000,
          status: mapBackendStatus(step.status),
          lastUpdated: step.timestamp
        }));
        
        setProcessData(transformedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedProcess, timeRange]);

  // Map backend status to frontend status
  const mapBackendStatus = (backendStatus) => {
    if (backendStatus === 'delayed') return 'critical';
    if (backendStatus === 'in-progress') return 'delayed';
    return 'on-track';
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Rest of component logic...
}
```

### 3. Update InsightPanel Component

**Current** (line 5):
```typescript
import { getProcessDataByTimeRange, TimeRange } from '@/data/processData';
```

**Change to**:
```typescript
'use client';
import { useState, useEffect } from 'react';
import { fetchHighRiskInsights } from '@/services/api';

export default function InsightPanel({ 
  selectedProcess,
  timeRange,
  performanceThreshold,
  severityFilters 
}: InsightPanelProps) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        
        const rangeMap = {
          '1h': 'last1Hour',
          '6h': 'last6Hours',
          '24h': 'last24Hours',
          '7d': 'last7Days'
        };
        
        const response = await fetchHighRiskInsights(rangeMap[timeRange]);
        
        // Transform backend insights to frontend format
        const transformedInsights = response.data.map(insight => ({
          processName: insight.process?.name || 'Unknown',
          riskScore: insight.risk_score,
          recommendation: insight.recommendation,
          delayPercentage: calculateDelayPercentage(insight.process),
          timestamp: insight.timestamp
        }));
        
        setInsights(transformedInsights);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInsights();
  }, [timeRange, selectedProcess]);

  const calculateDelayPercentage = (process) => {
    if (!process) return 0;
    return ((process.actual_duration - process.average_duration) / process.average_duration) * 100;
  };

  // Rest of component logic...
}
```

### 4. Add Auto-Refresh Feature

Add polling to automatically fetch new data:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadData(); // Refresh every 30 seconds
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### 5. Backend Data vs Frontend Mock Data Comparison

| Field | Backend Format | Frontend Mock Format | Conversion Needed |
|-------|---------------|---------------------|-------------------|
| Duration | Seconds (180) | Milliseconds (180000) | Multiply by 1000 |
| Status | completed/in-progress/delayed/failed | on-track/delayed/critical | Map values |
| Process ID | UUID | kebab-case string | Use as-is or map |
| Timestamp | ISO string | ISO string | Use as-is |
| Risk Score | 0-100 number | 0-100 number | Use as-is |

## Files That Need Modification

1. ✅ **CREATE**: `src/services/api.ts` - New API service layer
2. ✅ **UPDATE**: `src/components/ProcessTimelineChart.tsx` - Replace mock data with API calls
3. ✅ **UPDATE**: `src/components/InsightPanel.tsx` - Replace mock data with API calls
4. ✅ **UPDATE**: `src/components/DashboardLayout.tsx` - Add loading states
5. ⚠️ **KEEP**: `src/data/processData.ts` - Keep as fallback for offline mode

## Testing Checklist

- [ ] Backend API running on port 5000
- [ ] Frontend can reach http://localhost:5000/api/processes
- [ ] CORS enabled on backend (already done ✓)
- [ ] Loading states display correctly
- [ ] Error handling shows user-friendly messages
- [ ] Data refreshes when time range changes
- [ ] Data refreshes when process filter changes
- [ ] Chart displays real data from Supabase
- [ ] Insights panel shows real AI recommendations from database
- [ ] No console errors about failed API calls

## How to Verify Data Source

**Option 1: Check Network Tab**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh dashboard
4. Look for requests to `http://localhost:5000/api/*`
5. If you see these requests → Using backend ✅
6. If you don't see these requests → Still using mock data ❌

**Option 2: Check Console Logs**
Add this to your component:
```typescript
useEffect(() => {
  console.log('🔍 DATA SOURCE CHECK:', {
    usingBackend: true, // or false if using mock
    dataCount: processData.length,
    firstItem: processData[0]
  });
}, [processData]);
```

**Option 3: Modify Backend Data**
1. Add a new process in Supabase
2. Refresh dashboard
3. If you see the new process → Using backend ✅
4. If you don't see it → Still using mock data ❌

## Next Steps

Would you like me to:
1. **Create the API service file** (`src/services/api.ts`)
2. **Update ProcessTimelineChart** to use real backend data
3. **Update InsightPanel** to use real backend data
4. **Add loading/error states** to all components
5. **Test the integration** end-to-end

Let me know which step you want to start with! 🚀
