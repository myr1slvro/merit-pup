import { CHART_COLORS, THEME_COLORS } from "./analyticsTheme";
import type { UserContributions } from "../../../api/analytics";

interface TopContributorsListProps {
  data: UserContributions | null;
}

export default function TopContributorsList({
  data,
}: TopContributorsListProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Top Contributors
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Users with most activity on instructional materials
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.top_contributors?.map((contributor, idx) => (
          <div
            key={contributor.user_id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{
                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                }}
              >
                {idx + 1}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {contributor.name}
                </p>
                <p className="text-sm text-gray-500">
                  {contributor.role} · {contributor.college}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-2xl font-bold"
                style={{ color: THEME_COLORS.meritRed }}
              >
                {contributor.contributions}
              </p>
              <p className="text-xs text-gray-500">activities</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
