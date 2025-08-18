import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  gradient?: boolean;
  className?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient = false,
  className 
}: StatsCardProps) => {
  return (
    <div className={cn(
      "p-6 rounded-xl border border-glass-border shadow-card transition-all duration-300 hover:shadow-glow",
      gradient 
        ? "bg-gradient-card backdrop-blur" 
        : "bg-card/50 backdrop-blur",
      className
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          gradient 
            ? "bg-gradient-primary shadow-glow" 
            : "bg-secondary/50"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            gradient ? "text-white" : "text-chart-blue"
          )} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </div>
    </div>
  );
};