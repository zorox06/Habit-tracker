import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Time utility functions
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function calculateProgress(timeSpent: number, targetTime: number): number {
  if (targetTime <= 0) return 0;
  // Calculate actual percentage without capping at 100%
  return Math.round((timeSpent / targetTime) * 100);
}

export function parseTimeString(timeString: string): number {
  // Parse time strings like "1h 30m" or "45m" into minutes
  const hoursMatch = timeString.match(/(\d+)h/);
  const minutesMatch = timeString.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}
