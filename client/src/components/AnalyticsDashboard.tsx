/**
 * Analytics Dashboard Component
 * 
 * Displays analytics and statistics for sessions including:
 * - Participant statistics
 * - Incident statistics
 * - Penalty statistics
 * - Performance metrics
 * - Trends over time
 */

import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  sessionStats: {
    totalParticipants: number;
    activeParticipants: number;
    totalLaps: number;
    averageLapTime: number;
    fastestLap: number;
    totalDistance: number;
  };
  incidentStats: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
  };
  penaltyStats: {
    total: number;
    byType: Record<string, number>;
    totalPenaltyTime: number;
    averagePenaltyTime: number;
  };
  performanceMetrics: {
    averageSpeed: number;
    maxSpeed: number;
    totalViolations: number;
    checkpointSuccessRate: number;
  };
  trends: {
    lapTimes: number[];
    speeds: number[];
    incidents: number[];
  };
}

interface AnalyticsDashboardProps {
  sessionId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  sessionId,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'session' | 'hour' | 'day' | 'week'>('session');

  useEffect(() => {
    loadAnalytics();
  }, [sessionId, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        sessionStats: {
          totalParticipants: 12,
          activeParticipants: 10,
          totalLaps: 156,
          averageLapTime: 92.5,
          fastestLap: 88.3,
          totalDistance: 468,
        },
        incidentStats: {
          total: 8,
          byType: {
            off_track: 3,
            crash: 1,
            spin: 2,
            stall: 2,
          },
          bySeverity: {
            minor: 4,
            moderate: 3,
            major: 1,
            critical: 0,
          },
          unresolved: 2,
        },
        penaltyStats: {
          total: 5,
          byType: {
            time: 3,
            points: 1,
            grid: 1,
            disqualification: 0,
          },
          totalPenaltyTime: 120,
          averagePenaltyTime: 40,
        },
        performanceMetrics: {
          averageSpeed: 145.2,
          maxSpeed: 182.5,
          totalViolations: 15,
          checkpointSuccessRate: 98.5,
        },
        trends: {
          lapTimes: [95, 93, 91, 89, 88, 90, 92, 91, 89, 88],
          speeds: [140, 145, 150, 155, 160, 158, 152, 148, 145, 142],
          incidents: [0, 1, 0, 2, 0, 1, 0, 1, 0, 3],
        },
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="p-6">No analytics data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="session">This Session</option>
          <option value="hour">Last Hour</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
        </select>
      </div>

      {/* Session Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Session Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Participants"
            value={data.sessionStats.totalParticipants}
            sublabel={`${data.sessionStats.activeParticipants} active`}
          />
          <StatCard
            label="Total Laps"
            value={data.sessionStats.totalLaps}
          />
          <StatCard
            label="Avg Lap Time"
            value={`${data.sessionStats.averageLapTime.toFixed(1)}s`}
          />
          <StatCard
            label="Fastest Lap"
            value={`${data.sessionStats.fastestLap.toFixed(1)}s`}
            highlight
          />
          <StatCard
            label="Total Distance"
            value={`${data.sessionStats.totalDistance}km`}
          />
          <StatCard
            label="Avg Speed"
            value={`${data.performanceMetrics.averageSpeed.toFixed(1)} km/h`}
          />
        </div>
      </div>

      {/* Incident Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Incident Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">By Type</h4>
            <div className="space-y-2">
              {Object.entries(data.incidentStats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">By Severity</h4>
            <div className="space-y-2">
              {Object.entries(data.incidentStats.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span className="capitalize">{severity}</span>
                  <span className={`font-bold ${getSeverityColor(severity)}`}>{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span>Unresolved</span>
                <span className="font-bold text-red-600">{data.incidentStats.unresolved}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Penalty Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Penalty Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Penalties"
            value={data.penaltyStats.total}
          />
          <StatCard
            label="Total Penalty Time"
            value={`${data.penaltyStats.totalPenaltyTime}s`}
          />
          <StatCard
            label="Avg Penalty Time"
            value={`${data.penaltyStats.averagePenaltyTime.toFixed(0)}s`}
          />
        </div>
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">By Type</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.penaltyStats.byType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Max Speed"
            value={`${data.performanceMetrics.maxSpeed.toFixed(1)} km/h`}
            highlight
          />
          <StatCard
            label="Total Violations"
            value={data.performanceMetrics.totalViolations}
            warning={data.performanceMetrics.totalViolations > 10}
          />
          <StatCard
            label="Checkpoint Success"
            value={`${data.performanceMetrics.checkpointSuccessRate.toFixed(1)}%`}
            highlight={data.performanceMetrics.checkpointSuccessRate > 95}
          />
          <StatCard
            label="Violations/Participant"
            value={(data.performanceMetrics.totalViolations / data.sessionStats.totalParticipants).toFixed(1)}
          />
        </div>
      </div>

      {/* Trends */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrendChart
            title="Lap Times"
            data={data.trends.lapTimes}
            unit="s"
            color="blue"
          />
          <TrendChart
            title="Speeds"
            data={data.trends.speeds}
            unit="km/h"
            color="green"
          />
          <TrendChart
            title="Incidents"
            data={data.trends.incidents}
            unit=""
            color="red"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
  warning?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  highlight,
  warning,
}) => {
  return (
    <div className={`p-4 rounded-lg ${
      highlight ? 'bg-green-50 border-2 border-green-200' :
      warning ? 'bg-red-50 border-2 border-red-200' :
      'bg-gray-50'
    }`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-2xl font-bold ${
        highlight ? 'text-green-600' :
        warning ? 'text-red-600' :
        'text-gray-900'
      }`}>{value}</div>
      {sublabel && (
        <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
      )}
    </div>
  );
};

interface TrendChartProps {
  title: string;
  data: number[];
  unit: string;
  color: 'blue' | 'green' | 'red';
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, unit, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;

  const getColorClass = () => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="flex items-end justify-between h-32 gap-1">
        {data.map((value, index) => {
          const height = ((value - min) / (max - min || 1)) * 100;
          return (
            <div
              key={index}
              className={`flex-1 ${getColorClass()} rounded-t`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${value}${unit}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Min: {min.toFixed(1)}{unit}</span>
        <span>Avg: {avg.toFixed(1)}{unit}</span>
        <span>Max: {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'minor': return 'text-yellow-600';
    case 'moderate': return 'text-orange-600';
    case 'major': return 'text-red-600';
    case 'critical': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};
