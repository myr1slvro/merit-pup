import { CHART_COLORS } from "./analyticsTheme";
import type { UserSubmissions } from "../../../api/analytics";
import { FaUser, FaTrophy } from "react-icons/fa";

interface UserSubmissionsListProps {
  data: UserSubmissions | null;
}

export default function UserSubmissionsList({
  data,
}: UserSubmissionsListProps) {
  if (!data || !data.user_submissions?.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top Submitters
        </h3>
        <p className="text-gray-500">No submission data available</p>
      </div>
    );
  }

  const maxSubmissions = Math.max(
    ...data.user_submissions.map((u) => u.submissions)
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaTrophy className="text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-800">Top Submitters</h3>
      </div>

      <div className="space-y-3">
        {data.user_submissions.map((user, index) => {
          const percentage = (user.submissions / maxSubmissions) * 100;
          const isTop3 = index < 3;

          return (
            <div
              key={user.user_id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Rank */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? "bg-yellow-400 text-yellow-900"
                    : index === 1
                    ? "bg-gray-300 text-gray-700"
                    : index === 2
                    ? "bg-orange-300 text-orange-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FaUser className="text-gray-400 text-sm" />
                  <span className="font-medium text-gray-800 truncate">
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-1.5 py-0.5 bg-gray-200 rounded">
                    {user.role}
                  </span>
                  <span>• {user.college}</span>
                </div>
              </div>

              {/* Progress Bar & Count */}
              <div className="w-32">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-700">
                    {user.submissions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
