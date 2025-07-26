import { cn } from "@/lib/utils";

interface ColoredProgressProps {
  value: number;
  className?: string;
  showValue?: boolean;
}

export function ColoredProgress({ value, className, showValue = false }: ColoredProgressProps) {
  // Determine color based on value
  const getColorClass = (val: number) => {
    if (val >= 90) return "bg-emerald-500";
    if (val >= 80) return "bg-green-500";
    if (val >= 70) return "bg-lime-500";
    if (val >= 60) return "bg-yellow-500";
    if (val >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getBackgroundColorClass = (val: number) => {
    if (val >= 90) return "bg-emerald-100 dark:bg-emerald-900/20";
    if (val >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (val >= 70) return "bg-lime-100 dark:bg-lime-900/20";
    if (val >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    if (val >= 50) return "bg-orange-100 dark:bg-orange-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={cn("relative w-full", className)}>
      <div className={cn("w-full h-2 rounded-full", getBackgroundColorClass(clampedValue))}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", getColorClass(clampedValue))}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showValue && (
        <span className="absolute right-0 top-2 text-xs text-muted-foreground">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}