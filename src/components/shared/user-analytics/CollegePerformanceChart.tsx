import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_CONFIG } from "./analyticsTheme";
import type { CollegeAnalytics } from "../../../api/analytics";

interface CollegePerformanceChartProps {
  data: CollegeAnalytics | null;
}

export default function CollegePerformanceChart({
  data,
}: CollegePerformanceChartProps) {
  const sortedData = data?.colleges?.slice().sort((a, b) => b.count - a.count);

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        College Performance
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Instructional materials count and completion rates by college
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            style={{ fontSize: "12px" }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill={CHART_CONFIG.totalIMs} name="Total IMs" />
          <Bar
            dataKey="certified"
            fill={CHART_CONFIG.certifiedIMs}
            name="Certified IMs"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
