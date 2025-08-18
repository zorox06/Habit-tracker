import { useDailyStats } from "@/hooks/useHabits";
import { formatMinutes, calculateProgress } from "@/lib/utils";

interface TimeDebuggerProps {
  habitId: string;
  habitName: string;
  targetMinutes: number;
}

export const TimeDebugger = ({ habitId, habitName, targetMinutes }: TimeDebuggerProps) => {
  const { data: dailyStats } = useDailyStats();
  
  const timeSpent = dailyStats?.habitTimeSpent?.[habitId] || 0;
  const progress = calculateProgress(timeSpent, targetMinutes);
  
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-xs">
      <h4 className="font-bold mb-2">Debug: {habitName}</h4>
      <div className="space-y-1">
        <div>Target: {targetMinutes} minutes ({formatMinutes(targetMinutes)})</div>
        <div>Time Spent: {timeSpent} minutes ({formatMinutes(timeSpent)})</div>
        <div>Progress: {progress}%</div>
        <div>Raw Data: {JSON.stringify(dailyStats?.habitTimeSpent?.[habitId])}</div>
      </div>
    </div>
  );
};
