
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export const StatCard = ({ title, value, subtitle, icon, trend = "neutral" }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            trend === "up" && "text-green-600 bg-green-100",
            trend === "down" && "text-red-600 bg-red-100",
            trend === "neutral" && "text-blue-600 bg-blue-100"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
