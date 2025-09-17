import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Task } from '../types/task';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  priorityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  weeklyTrend: Array<{ date: string; created: number; completed: number }>;
  upcomingDeadlines: Task[];
  overdueTasks: Task[];
}

const Analytics: React.FC = () => {
  const { tasks } = useTaskContext();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const analyticsData = useMemo((): AnalyticsData => {
    const now = new Date();
    const rangeMs = timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                   timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                   90 * 24 * 60 * 60 * 1000;
    
    const rangeStart = new Date(now.getTime() - rangeMs);
    
    // Filter tasks within time range
    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt) >= rangeStart
    );

    const completedTasks = recentTasks.filter(task => task.completed);
    const totalTasks = recentTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Calculate average completion time
    const completionTimes = completedTasks
      .map(task => {
        const created = new Date(task.createdAt).getTime();
        const updated = new Date(task.updatedAt).getTime();
        return updated - created;
      })
      .filter(time => time > 0);

    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Priority distribution
    const priorityDistribution = recentTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category distribution
    const categoryDistribution = recentTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Weekly trend
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const created = tasks.filter(task => 
        task.createdAt.split('T')[0] === dateStr
      ).length;
      
      const completed = tasks.filter(task => 
        task.completed && task.updatedAt.split('T')[0] === dateStr
      ).length;

      weeklyTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        completed
      });
    }

    // Upcoming deadlines (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = tasks
      .filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) <= nextWeek &&
        new Date(task.dueDate) >= now
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);

    // Overdue tasks
    const overdueTasks = tasks
      .filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate,
      averageCompletionTime,
      priorityDistribution,
      categoryDistribution,
      weeklyTrend,
      upcomingDeadlines,
      overdueTasks
    };
  }, [tasks, timeRange]);

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
  }> = ({ title, value, icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 text-${color}-600`}>{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Track your productivity and task completion patterns</p>
        </div>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={analyticsData.totalTasks}
          icon={<BarChart3 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Completion Rate"
          value={`${analyticsData.completionRate.toFixed(1)}%`}
          icon={<Target className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Avg. Completion Time"
          value={formatDuration(analyticsData.averageCompletionTime)}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Overdue Tasks"
          value={analyticsData.overdueTasks.length}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">7-Day Productivity Trend</h3>
          </div>
          <div className="space-y-3">
            {analyticsData.weeklyTrend.map((day, index) => {
              const maxValue = Math.max(
                ...analyticsData.weeklyTrend.map(d => Math.max(d.created, d.completed))
              );
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-12 text-sm text-gray-600">{day.date}</div>
                  <div className="flex-1 flex space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Created: {day.created}</span>
                      </div>
                      <div 
                        className="h-2 bg-blue-500 rounded"
                        style={{ width: `${maxValue > 0 ? (day.created / maxValue) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Completed: {day.completed}</span>
                      </div>
                      <div 
                        className="h-2 bg-green-500 rounded"
                        style={{ width: `${maxValue > 0 ? (day.completed / maxValue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Priority Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analyticsData.priorityDistribution).map(([priority, count]) => {
              const percentage = analyticsData.totalTasks > 0 
                ? (count / analyticsData.totalTasks) * 100 
                : 0;
              const colors = {
                high: 'bg-red-500',
                medium: 'bg-orange-500',
                low: 'bg-green-500'
              };
              return (
                <div key={priority} className="flex items-center space-x-3">
                  <div className="w-16 text-sm text-gray-600 capitalize">{priority}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{count} tasks</span>
                      <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[priority as keyof typeof colors]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
          </div>
          {analyticsData.upcomingDeadlines.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {analyticsData.upcomingDeadlines.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.dueDate!).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Insights */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
          </div>
          {Object.keys(analyticsData.categoryDistribution).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tasks to analyze</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analyticsData.categoryDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => {
                  const percentage = analyticsData.totalTasks > 0 
                    ? (count / analyticsData.totalTasks) * 100 
                    : 0;
                  return (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{category}</p>
                        <p className="text-sm text-gray-600">{count} tasks</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {analyticsData.overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Overdue Tasks Require Attention</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analyticsData.overdueTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-sm text-red-600">
                  Due: {new Date(task.dueDate!).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          {analyticsData.overdueTasks.length > 4 && (
            <p className="text-sm text-red-600 mt-3">
              And {analyticsData.overdueTasks.length - 4} more overdue tasks...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;