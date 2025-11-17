import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chartData?: number[];
  chartColor?: "purple" | "green" | "blue" | "orange" | "red";
}

// Mini Sparkline Chart Component
function MiniChart({
  data,
  color = "purple",
}: {
  data: number[];
  color?: "purple" | "green" | "blue" | "orange" | "red";
}) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const colorClasses = {
    purple: "stroke-purple-500",
    green: "stroke-green-500",
    blue: "stroke-blue-500",
    orange: "stroke-orange-500",
    red: "stroke-red-500",
  };

  const fillClasses = {
    purple: "fill-purple-500/20",
    green: "fill-green-500/20",
    blue: "fill-blue-500/20",
    orange: "fill-orange-500/20",
    red: "fill-red-500/20",
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-12 mt-2"
      preserveAspectRatio="none"
    >
      {/* Filled area under the line */}
      <polygon
        points={`0,100 ${points} 100,100`}
        className={fillClasses[color]}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        className={colorClasses[color]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  chartData,
  chartColor = "purple",
}: StatsCardProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-purple-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs mt-1 font-medium ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </p>
        )}
        {chartData && chartData.length > 0 && (
          <div className="mt-2">
            <MiniChart data={chartData} color={chartColor} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
