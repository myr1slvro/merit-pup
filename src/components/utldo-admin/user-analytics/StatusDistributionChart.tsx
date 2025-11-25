import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "./analyticsTheme";
import type { AnalyticsOverview } from "../../../api/analytics";

interface StatusDistributionChartProps {
  data: AnalyticsOverview | null;
}

export default function StatusDistributionChart({
  data,
}: StatusDistributionChartProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        IM Status Distribution
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Current status breakdown of all instructional materials
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data?.status_distribution}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data?.status_distribution?.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col justify-center space-y-3">
          {data?.status_distribution?.map((item, idx) => (
            <div
              key={item.status}
              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {item.status}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
