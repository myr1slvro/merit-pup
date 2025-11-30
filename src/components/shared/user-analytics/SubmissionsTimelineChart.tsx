import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { THEME_COLORS } from "./analyticsTheme";
import type { SubmissionsTimeline } from "../../../api/analytics";

interface SubmissionsTimelineChartProps {
  data: SubmissionsTimeline | null;
  days: number;
  onDaysChange: (days: number) => void;
}

export default function SubmissionsTimelineChart({
  data,
  days,
  onDaysChange,
}: SubmissionsTimelineChartProps) {
  if (!data || !data.timeline?.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Submission Activity
        </h3>
        <p className="text-gray-500">No submission data available</p>
      </div>
    );
  }

  // Format dates for display
  const chartData = data.timeline.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  // Calculate totals
  const totalSubmissions = data.timeline.reduce(
    (acc, item) => acc + item.submissions,
    0
  );
  const avgPerDay = (totalSubmissions / days).toFixed(1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Submission Activity
          </h3>
          <p className="text-sm text-gray-500">
            {totalSubmissions} total submissions • {avgPerDay} avg/day
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-meritRed focus:border-meritRed"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="submissionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={THEME_COLORS.meritRed}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={THEME_COLORS.meritRed}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value, "Submissions"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="submissions"
              stroke={THEME_COLORS.meritRed}
              strokeWidth={2}
              fill="url(#submissionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
