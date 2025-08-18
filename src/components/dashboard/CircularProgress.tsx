import { cn } from "@/lib/utils";

interface CircularProgressProps {
  progress: number;
  color: "cyan" | "green" | "orange" | "purple";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { size: 40, strokeWidth: 3, text: "text-xs" },
  md: { size: 60, strokeWidth: 4, text: "text-sm" },
  lg: { size: 80, strokeWidth: 5, text: "text-lg" }
};

const colorMap = {
  cyan: "hsl(var(--progress-cyan))",
  green: "hsl(var(--progress-green))", 
  orange: "hsl(var(--progress-orange))",
  purple: "hsl(var(--progress-purple))"
};

export const CircularProgress = ({ 
  progress, 
  color, 
  size = "md", 
  showText = true 
}: CircularProgressProps) => {
  const { size: circleSize, strokeWidth, text } = sizeMap[size];
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  // Cap the visual progress at 100% but show actual percentage in text
  const visualProgress = Math.min(100, progress);
  const strokeDashoffset = circumference - (visualProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={circleSize}
        height={circleSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--progress-bg))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="transparent"
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${colorMap[color]}40)`
          }}
        />
      </svg>
      {showText && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center font-bold text-foreground",
          text
        )}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};