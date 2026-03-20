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

import { motion } from "framer-motion";

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = false,
  className
}: StatsCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
      "p-5 rounded-lg bg-surface-1 border border-border transition-colors duration-150 hover:bg-surface-2",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
          gradient ? "bg-primary" : "bg-surface-2"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            gradient ? "text-primary-foreground" : "text-primary"
          )} />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground tabular-nums">{value}</span>
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};