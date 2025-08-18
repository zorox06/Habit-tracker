import { BarChart3, TrendingUp, Calendar, Clock, PieChart as PieChartIcon, ChevronDown, Loader2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Load analytics data when period changes
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsData(selectedPeriod);
      setAnalyticsData(data);
      setTotalHours(data.reduce((sum, item) => sum + item.hours, 0));
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get period label
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'this-week': return 'This Week';
      case 'last-week': return 'Last Week';
      case 'last-month': return 'Last Month';
      case 'all-time': return 'All Time';
      default: return 'This Week';
    }
  };

  // Get color value based on habit color
  const getColorValue = (color: string) => {
    // If color is already a hex code, return it
    if (color.startsWith('#')) {
      return color;
    }
    
    // Map color names to hex values
    switch (color) {
      case 'deep-blue': return '#3B82F6';
      case 'emerald': return '#10B981';
      case 'violet': return '#8B5CF6';
      case 'amber': return '#F59E0B';
      case 'rose': return '#F43F5E';
      case 'teal': return '#14B8A6';
      case 'cyan': return '#06B6D4';
      case 'green': return '#22C55E';
      case 'orange': return '#F97316';
      case 'purple': return '#A855F7';
      default: return '#3B82F6';
    }
  };

  // Chart.js Pie Chart Component
  const ChartJSPieChart = ({ 
    data, 
    title, 
    totalHours 
  }: { 
    data: AnalyticsData[], 
    title: string, 
    totalHours: number 
  }) => {
    useEffect(() => {
      if (chartRef.current && data.length > 0) {
        // Destroy previous chart instance if it exists
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const chartInstance = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.map(item => item.habit),
            datasets: [{
              data: data.map(item => item.hours),
              backgroundColor: data.map(item => getColorValue(item.color)),
              borderColor: 'rgba(0, 0, 0, 0.1)',
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
                color: '#FFFFFF',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              },
              legend: {
                position: 'bottom',
                labels: {
                  color: '#FFFFFF',
                  font: {
                    weight: 'normal'
                  },
                  padding: 20,
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
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1
              }
            }
          }
        });

        chartInstanceRef.current = chartInstance;
      }

      return () => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }
      };
    }, [data, title]);

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <PieChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No data available for this period</p>
            <p className="text-sm">Start tracking your habits to see analytics</p>
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
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your habit progress and insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Period Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {getPeriodLabel(selectedPeriod)}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedPeriod('this-week')}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod('last-week')}>
                Last Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod('last-month')}>
                Last Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod('all-time')}>
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Time"
          value={`${totalHours}h`}
          subtitle={`${getPeriodLabel(selectedPeriod)} total`}
          icon={Clock}
        />
        <StatsCard
          title="Active Habits"
          value={analyticsData.length.toString()}
          subtitle="Currently tracking"
          icon={Target}
        />
        <StatsCard
          title="Most Active"
          value={analyticsData[0]?.habit || 'None'}
          subtitle="Top habit by time"
          icon={TrendingUp}
        />
      </div>

      {/* Main Chart */}
      <Card className="bg-card/50 backdrop-blur border border-glass-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <PieChartIcon className="w-5 h-5 text-chart-blue" />
            {getPeriodLabel(selectedPeriod)} Habit Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartJSPieChart 
            data={analyticsData} 
            title={getPeriodLabel(selectedPeriod)} 
            totalHours={totalHours} 
          />
        </CardContent>
      </Card>

      {/* Habit Performance Details */}
      {analyticsData.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border border-glass-border shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <BarChart3 className="w-5 h-5 text-chart-blue" />
              Habit Performance Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.map((habit, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-secondary/20 border border-glass-border hover:bg-secondary/30 transition-all duration-300 hover:scale-105 transform text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: getColorValue(habit.color) }}
                    />
                    <h4 className="font-semibold text-foreground text-lg">{habit.habit}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-foreground">{habit.hours}h</div>
                    <div className="text-sm text-muted-foreground">{habit.percentage}% of total time</div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {Math.round(habit.hours / (selectedPeriod === 'this-week' || selectedPeriod === 'last-week' ? 7 : 30))}h/day
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;

