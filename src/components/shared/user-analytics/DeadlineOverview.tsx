import { THEME_COLORS } from "./analyticsTheme";
import type { DeadlineAnalytics } from "../../../api/analytics";
import {
  FaExclamationTriangle,
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
  FaQuestionCircle,
} from "react-icons/fa";

interface DeadlineOverviewProps {
  data: DeadlineAnalytics | null;
}

export default function DeadlineOverview({ data }: DeadlineOverviewProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Deadline Status
        </h3>
        <p className="text-gray-500">No deadline data available</p>
      </div>
    );
  }

  const { summary, overdue_ims, due_soon_ims } = data;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Deadline Status Overview
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="text-red-500" />
            <span className="text-sm font-medium text-red-700">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {summary?.overdue ?? 0}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">
              Due Soon (7d)
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {summary?.due_soon ?? 0}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaCalendarAlt className="text-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              Due This Month
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {summary?.due_this_month ?? 0}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaCheckCircle className="text-green-500" />
            <span className="text-sm font-medium text-green-700">On Track</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {summary?.on_track ?? 0}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaQuestionCircle className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              No Deadline
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-600">
            {summary?.no_deadline ?? 0}
          </p>
        </div>
      </div>

      {/* Overdue IMs List */}
      {overdue_ims && overdue_ims.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            <FaExclamationTriangle />
            Overdue IMs ({overdue_ims.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {overdue_ims.map((im) => (
              <div
                key={im.im_id}
                className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-2"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    IM-{im.im_id}
                  </span>
                  {im.subject && (
                    <span className="text-gray-600 ml-2">({im.subject})</span>
                  )}
                  {im.college && (
                    <span className="text-xs text-gray-500 ml-2">
                      • {im.college}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-red-600 font-semibold text-sm">
                    {im.days_overdue} days overdue
                  </span>
                  <p className="text-xs text-gray-500">{im.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Soon IMs List */}
      {due_soon_ims && due_soon_ims.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-yellow-600 mb-3 flex items-center gap-2">
            <FaClock />
            Due Soon ({due_soon_ims.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {due_soon_ims.map((im) => (
              <div
                key={im.im_id}
                className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-2"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    IM-{im.im_id}
                  </span>
                  {im.subject && (
                    <span className="text-gray-600 ml-2">({im.subject})</span>
                  )}
                  {im.college && (
                    <span className="text-xs text-gray-500 ml-2">
                      • {im.college}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold text-sm ${
                      im.days_remaining <= 2
                        ? "text-red-500"
                        : "text-yellow-600"
                    }`}
                  >
                    {im.days_remaining} days left
                  </span>
                  <p className="text-xs text-gray-500">{im.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overdue_ims.length === 0 && due_soon_ims.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          No IMs with upcoming deadlines
        </p>
      )}
    </div>
  );
}
