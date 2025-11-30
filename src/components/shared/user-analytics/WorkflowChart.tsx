import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { THEME_COLORS, CHART_COLORS } from "./analyticsTheme";
import type { WorkflowAnalytics } from "../../../api/analytics";
import { FaExclamationCircle } from "react-icons/fa";

interface WorkflowChartProps {
  data: WorkflowAnalytics | null;
}

// Define colors for each workflow stage
const STAGE_COLORS: Record<string, string> = {
  "Assigned to Faculty": "#fbbf24", // yellow
  "For IMER Evaluation": "#fb923c", // light orange
  "For PIMEC Evaluation": "#f97316", // orange
  "For UTLDO Evaluation": "#3b82f6", // blue
  "For Resubmission": "#ef4444", // red
  Certified: "#22c55e", // green
  Published: "#10b981", // emerald
};

export default function WorkflowChart({ data }: WorkflowChartProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Workflow Pipeline
        </h3>
        <p className="text-gray-500">No workflow data available</p>
      </div>
    );
  }

  const { stages, stuck_ims, total_active, total_completed } = data;

  // Filter out stages with 0 count for cleaner display
  const chartData = stages.filter((s) => s.count > 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Workflow Pipeline
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">
            Active: <span className="font-semibold">{total_active}</span>
          </span>
          <span className="text-green-600">
            Completed: <span className="font-semibold">{total_completed}</span>
          </span>
        </div>
      </div>

      {/* Workflow Bar Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [value, "IMs"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    STAGE_COLORS[entry.name] ||
                    CHART_COLORS[index % CHART_COLORS.length]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stuck IMs Warning */}
      {Object.values(stuck_ims).some((count) => count > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
            <FaExclamationCircle />
            Potential Bottlenecks (No activity in 14+ days)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stuck_ims).map(([stage, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={stage}
                  className="bg-white border border-orange-100 rounded px-3 py-2"
                >
                  <p className="text-xs text-gray-600 truncate">{stage}</p>
                  <p className="text-lg font-bold text-orange-600">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(STAGE_COLORS).map(([stage, color]) => (
          <div key={stage} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
