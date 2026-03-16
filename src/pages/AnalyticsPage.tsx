import { BarChart3, TrendingUp, Calendar, Clock, PieChart as PieChartIcon, ChevronDown, Loader2, Target } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { analyticsService, AnalyticsData } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";

const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'this-week' | 'last-week' | 'last-month' | 'all-time'>('this-week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadAnalyticsData(); }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsData(selectedPeriod);
      setAnalyticsData(data);
      setTotalHours(data.reduce((sum, item) => sum + item.hours, 0));
    } catch (error) {
      toast({ title: "Error loading data", description: "Failed to load analytics.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'this-week': return 'This Week';
      case 'last-week': return 'Last Week';
      case 'last-month': return 'Last Month';
      case 'all-time': return 'All Time';
      default: return 'This Week';
    }
  };

  const getColorValue = (color: string) => {
    if (color.startsWith('#')) return color;
    switch (color) {
      case 'deep-blue': return '#6B8ADB';
      case 'emerald': return '#5BAD8A';
      case 'violet': return '#9B7FD4';
      case 'amber': return '#D4A847';
      case 'rose': return '#D47B8A';
      case 'teal': return '#5BA8A0';
      case 'cyan': return '#6BADC4';
      case 'green': return '#6BB87A';
      case 'orange': return '#D49A47';
      case 'purple': return '#9B7FD4';
      default: return '#6B8ADB';
    }
  };

  const ChartJSPieChart = ({ data, title, totalHours }: { data: AnalyticsData[], title: string, totalHours: number }) => {
    useEffect(() => {
      if (chartRef.current && data.length > 0) {
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const chartInstance = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.map(item => item.habit),
            datasets: [{
              data: data.map(item => item.hours),
              backgroundColor: data.map(item => getColorValue(item.color)),
              borderColor: 'oklch(16% 0.01 60)',
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: title,
                color: 'oklch(93% 0.01 60)',
                font: { size: 14, weight: 'bold', family: 'Plus Jakarta Sans' }
              },
              legend: {
                position: 'bottom',
                labels: {
                  color: 'oklch(80% 0.01 60)',
                  font: { weight: 'normal', family: 'DM Sans' },
                  padding: 16,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const percentage = data[context.dataIndex]?.percentage || 0;
                    return `${label}: ${value}h (${percentage}%)`;
                  }
                },
                backgroundColor: 'oklch(20% 0.01 60)',
                titleColor: 'oklch(93% 0.01 60)',
                bodyColor: 'oklch(80% 0.01 60)',
                borderColor: 'oklch(28% 0.01 60)',
                borderWidth: 1
              }
            }
          }
        });
        chartInstanceRef.current = chartInstance;
      }
      return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
    }, [data, title]);

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No data available for this period</p>
            <p className="text-xs mt-1">Start tracking your habits to see analytics</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-64">
        <canvas ref={chartRef} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your habit progress and insights</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-border hover:bg-surface-2 text-sm">
              <Calendar className="w-4 h-4" />
              {getPeriodLabel(selectedPeriod)}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-surface-1 border-border">
            <DropdownMenuItem onClick={() => setSelectedPeriod('this-week')}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedPeriod('last-week')}>Last Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedPeriod('last-month')}>Last Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedPeriod('all-time')}>All Time</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <StatsCard title="Total Time" value={`${totalHours}h`} subtitle={`${getPeriodLabel(selectedPeriod)} total`} icon={Clock} />
        <StatsCard title="Active Habits" value={analyticsData.length.toString()} subtitle="Currently tracking" icon={Target} />
        <StatsCard title="Most Active" value={analyticsData[0]?.habit || 'None'} subtitle="Top habit by time" icon={TrendingUp} />
      </div>

      {/* Chart */}
      <div className="bg-surface-1 border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground">{getPeriodLabel(selectedPeriod)} Distribution</h3>
        </div>
        <ChartJSPieChart data={analyticsData} title={getPeriodLabel(selectedPeriod)} totalHours={totalHours} />
      </div>

      {/* Performance details */}
      {analyticsData.length > 0 && (
        <div className="bg-surface-1 border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Performance Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analyticsData.map((habit, index) => (
              <div
                key={index}
                className="p-4 rounded-md bg-surface-2 transition-colors duration-150 hover:bg-surface-3"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: getColorValue(habit.color) }} />
                  <h4 className="font-display font-semibold text-foreground text-sm">{habit.habit}</h4>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-display font-bold text-foreground tabular-nums">{habit.hours}h</div>
                  <div className="text-xs text-muted-foreground">{habit.percentage}% of total time</div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {Math.round(habit.hours / (selectedPeriod === 'this-week' || selectedPeriod === 'last-week' ? 7 : 30))}h/day
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
