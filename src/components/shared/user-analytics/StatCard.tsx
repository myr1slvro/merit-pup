import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  gradient: "red" | "blue" | "green" | "yellow";
}

const gradientClasses = {
  red: "bg-gradient-to-br from-immsRed to-immsDarkRed",
  blue: "bg-gradient-to-br from-blue-500 to-blue-700",
  green: "bg-gradient-to-br from-green-500 to-green-700",
  yellow: "bg-gradient-to-br from-immsYellow to-yellow-600",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: StatCardProps) {
  return (
    <div
      className={`${gradientClasses[gradient]} text-white rounded-lg p-6 shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs opacity-75 mt-1">{subtitle}</p>
        </div>
        <div className="text-5xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}
