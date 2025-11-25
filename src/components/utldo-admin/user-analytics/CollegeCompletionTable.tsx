import type { CollegeAnalytics } from "../../../api/analytics";
import { THEME_COLORS } from "./analyticsTheme";

interface CollegeCompletionTableProps {
  data: CollegeAnalytics | null;
}

export default function CollegeCompletionTable({
  data,
}: CollegeCompletionTableProps) {
  const sortedColleges = data?.colleges
    ?.slice()
    .sort((a, b) => b.completion_rate - a.completion_rate);

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        College Completion Rates
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Percentage of certified instructional materials per college
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                College
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total IMs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Certified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedColleges?.map((college, idx) => (
              <tr
                key={college.id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {college.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {college.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {college.certified || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          college.completion_rate >= 75
                            ? "#10B981"
                            : college.completion_rate >= 50
                            ? THEME_COLORS.meritYellow
                            : THEME_COLORS.meritRed,
                      }}
                    >
                      {college.completion_rate}%
                    </span>
                    <div className="ml-3 w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${college.completion_rate}%`,
                          backgroundColor:
                            college.completion_rate >= 75
                              ? "#10B981"
                              : college.completion_rate >= 50
                              ? THEME_COLORS.meritYellow
                              : THEME_COLORS.meritRed,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
