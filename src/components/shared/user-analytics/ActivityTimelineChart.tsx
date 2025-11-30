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
import type { ActivityTimeline } from "../../../api/analytics";

interface ActivityTimelineChartProps {
  data: ActivityTimeline | null;
  days: number;
  onDaysChange: (days: number) => void;
}

export default function ActivityTimelineChart({
  data,
  days,
  onDaysChange,
}: ActivityTimelineChartProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Activity Timeline
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Daily CREATE and UPDATE actions
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-meritRed focus:border-meritRed"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data?.timeline}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            style={{ fontSize: "11px" }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="CREATE"
            stroke={CHART_CONFIG.created}
            strokeWidth={2}
            name="Created"
          />
          <Line
            type="monotone"
            dataKey="UPDATE"
            stroke={CHART_CONFIG.updated}
            strokeWidth={2}
            name="Updated"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
