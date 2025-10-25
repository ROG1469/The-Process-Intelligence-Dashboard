'use client';

import React, { useState, useEffect } from 'react';
import { fetchAIInsightMessages } from '@/services/api';

interface AIInsightsPanelProps {
  timeRange?: 'last1Hour' | 'last6Hours' | 'last24Hours' | 'last7Days';
  threshold?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function AIInsightsPanel({
  timeRange = 'last1Hour',
  threshold = 60,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: AIInsightsPanelProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadInsights = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchAIInsightMessages(timeRange, threshold);
      
      if (result.success) {
        setMessages(result.messages || []);
        setLastUpdate(new Date());
      } else {
        setMessages(result.messages || ['❌ Failed to load insights']);
        setError('Failed to load insights');
      }
    } catch (err) {
      console.error('Error loading AI insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages(['❌ Failed to load insights — please try again']);
    } finally {
      setLoading(false);
    }
  }, [timeRange, threshold]);

  useEffect(() => {
    loadInsights();

    if (autoRefresh) {
      const interval = setInterval(loadInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadInsights, autoRefresh, refreshInterval]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Insights
        </h3>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          title="Refresh insights"
        >
          <svg
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Last Update Time */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 mb-3">
          Last updated: {typeof window !== 'undefined' ? lastUpdate.toLocaleTimeString() : '--:--:--'}
        </div>
      )}

      {/* Loading State */}
      {loading && messages.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading insights...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && messages.length === 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium mb-1">⚠️ Error</p>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Messages List */}
      {!loading && messages.length > 0 && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {messages.map((message, index) => {
            // Determine message type by emoji/prefix
            const isError = message.startsWith('❌');
            const isSuccess = message.startsWith('✅');
            const isWarning = message.startsWith('⚠️');
            const isPrediction = message.startsWith('🔮');
            const isAnomaly = message.startsWith('📊');
            const isPattern = message.startsWith('📈');
            
            let bgColor = 'bg-gray-800/50';
            let borderColor = 'border-gray-700';
            let textColor = 'text-gray-300';
            
            if (isError) {
              bgColor = 'bg-red-900/20';
              borderColor = 'border-red-500/30';
              textColor = 'text-red-300';
            } else if (isSuccess) {
              bgColor = 'bg-green-900/20';
              borderColor = 'border-green-500/30';
              textColor = 'text-green-300';
            } else if (isWarning) {
              bgColor = 'bg-yellow-900/20';
              borderColor = 'border-yellow-500/30';
              textColor = 'text-yellow-300';
            } else if (isPrediction) {
              bgColor = 'bg-purple-900/20';
              borderColor = 'border-purple-500/30';
              textColor = 'text-purple-300';
            } else if (isAnomaly) {
              bgColor = 'bg-orange-900/20';
              borderColor = 'border-orange-500/30';
              textColor = 'text-orange-300';
            } else if (isPattern) {
              bgColor = 'bg-blue-900/20';
              borderColor = 'border-blue-500/30';
              textColor = 'text-blue-300';
            }

            return (
              <div
                key={index}
                className={`${bgColor} border ${borderColor} rounded-lg p-3 transition-all hover:scale-[1.02]`}
              >
                <p className={`${textColor} text-sm leading-relaxed`}>
                  {message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg
            className="w-16 h-16 mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">No insights available</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Range: {timeRange.replace('last', '')}</span>
          <span>Threshold: {threshold}%</span>
          <span className="flex items-center gap-1">
            {autoRefresh && (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Auto-refresh
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
