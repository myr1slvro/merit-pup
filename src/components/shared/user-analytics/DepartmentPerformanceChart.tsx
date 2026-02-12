import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_CONFIG } from "./analyticsTheme";
import type {
  DepartmentAnalytics,
  CollegeAnalytics,
} from "../../../api/analytics";

interface DepartmentPerformanceChartProps {
  data: DepartmentAnalytics | null;
  collegeData: CollegeAnalytics | null;
  selectedCollegeId: number | null;
  onCollegeChange: (collegeId: number | null) => void;
}

export default function DepartmentPerformanceChart({
  data,
  collegeData,
  selectedCollegeId,
  onCollegeChange,
}: DepartmentPerformanceChartProps) {
  const sortedDepartments = data?.departments
    ?.slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Department Performance
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Instructional materials by department
          </p>
        </div>
        <select
          value={selectedCollegeId || ""}
          onChange={(e) =>
            onCollegeChange(e.target.value ? Number(e.target.value) : null)
          }
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-immsRed focus:border-immsRed"
        >
          <option value="">All Colleges</option>
          {collegeData?.colleges?.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedDepartments}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            style={{ fontSize: "11px" }}
          />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="count"
            fill={CHART_CONFIG.departments}
            name="IMs Created"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
