import { Clock, TrendingUp, Target, BarChart3, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Chart } from 'chart.js/auto';
import { analyticsService, AnalyticsData } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";

const getColorValue = (color: string) => {
  if (color.startsWith('#')) return color;
  const map: Record<string, string> = {
    'deep-blue': '#6B8ADB', emerald: '#5BAD8A', violet: '#9B7FD4', amber: '#D4A847',
    rose: '#D47B8A', teal: '#5BA8A0', cyan: '#6BADC4', green: '#6BB87A',
    orange: '#D49A47', purple: '#9B7FD4',
  };
  return map[color] || '#6B8ADB';
};

export const MobileAnalytics = () => {
  const [period, setPeriod] = useState<'this-week' | 'last-week' | 'last-month' | 'all-time'>('this-week');
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { toast } = useToast();

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    try {
      setLoading(true);
      const d = await analyticsService.getAnalyticsData(period);
      setData(d);
      setTotalHours(d.reduce((s, i) => s + i.hours, 0));
    } catch { toast({ title: "Error", description: "Failed to load analytics.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(i => i.habit),
        datasets: [{
          data: data.map(i => i.hours),
          backgroundColor: data.map(i => getColorValue(i.color)),
          borderColor: 'oklch(4% 0 0)',
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => `${c.label}: ${c.parsed}h` },
            backgroundColor: 'oklch(15% 0 0)',
            titleColor: 'oklch(93% 0 0)',
            bodyColor: 'oklch(80% 0 0)',
          }
        }
      }
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const topHabit = data[0];

  return (
    <div className="space-y-5 pt-2 animate-fade-up">

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['this-week', 'last-month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-2 text-muted-foreground'
            }`}
          >
            {p === 'this-week' ? 'This Week' : 'Month'}
          </button>
        ))}
      </div>

      {/* Total focus time card */}
      <div className="bg-surface-1 border border-border rounded-2xl p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Focus Time</p>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-display font-bold text-foreground tabular-nums">{totalHours}</span>
          <span className="text-lg text-muted-foreground mb-1">Hrs</span>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-1 border border-border rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Active Habits</p>
          <p className="text-3xl font-display font-bold text-foreground tabular-nums">{data.length}</p>
        </div>
        <div className="bg-surface-1 border border-border rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Most Active</p>
          <p className="text-lg font-display font-bold text-foreground truncate">{topHabit?.habit || 'None'}</p>
          {topHabit && <p className="text-xs text-muted-foreground mt-0.5">🔥 {topHabit.hours}h total</p>}
        </div>
      </div>

      {/* Donut chart */}
      {data.length > 0 && (
        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          <h3 className="text-base font-display font-semibold text-foreground mb-4">Weekly Distribution</h3>
          <div className="relative h-56 flex items-center justify-center">
            <canvas ref={chartRef} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-display font-bold text-foreground tabular-nums">
                {data.length > 0 ? `${data[0].percentage}%` : ''}
              </span>
              <span className="text-xs text-muted-foreground uppercase">{data[0]?.habit || ''} leads</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {data.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColorValue(d.color) }} />
                <span className="text-xs text-muted-foreground">{d.habit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance details */}
      {data.length > 0 && (
        <div>
          <h3 className="text-base font-display font-semibold text-foreground mb-3">Performance Details</h3>
          <div className="space-y-3">
            {data.map((d, i) => (
              <div key={i}
                className="bg-surface-1 border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${getColorValue(d.color)}22`, color: getColorValue(d.color) }}
                >
                  {d.habit.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.habit}</p>
                  <p className="text-xs text-muted-foreground">Consistency: {d.percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">{d.hours}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
