import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_CONFIG } from "./analyticsTheme";
import type { AnalyticsOverview } from "../../../api/analytics";

interface MonthlyTrendsChartProps {
  data: AnalyticsOverview | null;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  const formattedData = data?.ims_by_month?.map((item) => ({
    name: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
    count: item.count,
  }));

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Monthly Creation Trends
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Instructional materials created per month (last 6 months)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke={CHART_CONFIG.monthly}
            strokeWidth={3}
            name="IMs Created"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
