import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getAnalyticsOverview,
  getCollegeAnalytics,
  getDepartmentAnalytics,
  getUserContributions,
  getActivityTimeline,
  getDeadlineAnalytics,
  getWorkflowAnalytics,
  getSubmissionsByUser,
  getSubmissionsTimeline,
  exportAnalyticsCSV,
  type AnalyticsOverview,
  type CollegeAnalytics,
  type DepartmentAnalytics,
  type UserContributions,
  type ActivityTimeline,
  type DeadlineAnalytics,
  type WorkflowAnalytics,
  type UserSubmissions,
  type SubmissionsTimeline,
  type AnalyticsFilters as FiltersType,
} from "../../../api/analytics";
import {
  FaSpinner,
  FaChartBar,
  FaUsers,
  FaBuilding,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTasks,
  FaFileAlt,
} from "react-icons/fa";

// Modular components
import StatCard from "./StatCard";
import AnalyticsFilters from "./AnalyticsFilters";
import CollegePerformanceChart from "./CollegePerformanceChart";
import CollegeCompletionTable from "./CollegeCompletionTable";
import DepartmentPerformanceChart from "./DepartmentPerformanceChart";
import TopContributorsList from "./TopContributorsList";
import ActivityTimelineChart from "./ActivityTimelineChart";
import StatusDistributionChart from "./StatusDistributionChart";
import MonthlyTrendsChart from "./MonthlyTrendsChart";
import DeadlineOverview from "./DeadlineOverview";
import WorkflowChart from "./WorkflowChart";
import SubmissionsTimelineChart from "./SubmissionsTimelineChart";
import UserSubmissionsList from "./UserSubmissionsList";
import ExportButton from "../ExportButton";

export default function UtldoUserAnalytics() {
  const { authToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref for PDF export
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Data states with proper types
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [collegeData, setCollegeData] = useState<CollegeAnalytics | null>(null);
  const [departmentData, setDepartmentData] =
    useState<DepartmentAnalytics | null>(null);
  const [contributors, setContributors] = useState<UserContributions | null>(
    null
  );
  const [timeline, setTimeline] = useState<ActivityTimeline | null>(null);
  const [deadlineData, setDeadlineData] = useState<DeadlineAnalytics | null>(
    null
  );
  const [workflowData, setWorkflowData] = useState<WorkflowAnalytics | null>(
    null
  );
  const [userSubmissions, setUserSubmissions] =
    useState<UserSubmissions | null>(null);
  const [submissionsTimeline, setSubmissionsTimeline] =
    useState<SubmissionsTimeline | null>(null);

  // Global filter state
  const [filters, setFilters] = useState<FiltersType>({});

  // Department chart filter (separate from global)
  const [deptChartCollegeId, setDeptChartCollegeId] = useState<number | null>(
    null
  );
  const [timelineDays, setTimelineDays] = useState<number>(30);
  const [submissionDays, setSubmissionDays] = useState<number>(30);

  const loadAllAnalytics = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);
    try {
      // Use Promise.allSettled so individual failures don't break everything
      const results = await Promise.allSettled([
        getAnalyticsOverview(authToken, filters),
        getCollegeAnalytics(authToken, filters),
        getDepartmentAnalytics(authToken, filters.college_id),
        getUserContributions(authToken, 10, filters),
        getActivityTimeline(authToken, timelineDays, filters),
        getDeadlineAnalytics(authToken, filters),
        getWorkflowAnalytics(authToken, filters),
        getSubmissionsByUser(authToken, 10, filters),
        getSubmissionsTimeline(authToken, submissionDays, filters),
      ]);

      // Extract values from settled promises, null for failures
      const getValue = <T,>(result: PromiseSettledResult<T>): T | null =>
        result.status === "fulfilled" ? result.value : null;

      setOverview(getValue(results[0]));
      setCollegeData(getValue(results[1]));
      setDepartmentData(getValue(results[2]));
      setContributors(getValue(results[3]));
      setTimeline(getValue(results[4]));
      setDeadlineData(getValue(results[5]));
      setWorkflowData(getValue(results[6]));
      setUserSubmissions(getValue(results[7]));
      setSubmissionsTimeline(getValue(results[8]));

      // Log any failures for debugging but don't block the UI
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        console.warn("Some analytics endpoints failed:", failures);
      }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authToken, filters, timelineDays, submissionDays]);

  const loadDepartmentData = useCallback(async () => {
    if (!authToken) return;

    try {
      // Use deptChartCollegeId for the department chart filter,
      // or fall back to global college filter
      const collegeId = deptChartCollegeId ?? filters.college_id;
      const deptRes = await getDepartmentAnalytics(authToken, collegeId);
      setDepartmentData(deptRes);
    } catch (e: unknown) {
      console.error("Failed to load department data:", e);
    }
  }, [authToken, deptChartCollegeId, filters.college_id]);

  const loadTimelineData = useCallback(async () => {
    if (!authToken) return;

    try {
      const timelineRes = await getActivityTimeline(
        authToken,
        timelineDays,
        filters
      );
      setTimeline(timelineRes);
    } catch (e: unknown) {
      console.error("Failed to load timeline data:", e);
    }
  }, [authToken, timelineDays, filters]);

  const loadSubmissionsTimeline = useCallback(async () => {
    if (!authToken) return;

    try {
      const subTimelineRes = await getSubmissionsTimeline(
        authToken,
        submissionDays,
        filters
      );
      setSubmissionsTimeline(subTimelineRes);
    } catch (e: unknown) {
      console.error("Failed to load submissions timeline:", e);
    }
  }, [authToken, submissionDays, filters]);

  // Initial load
  useEffect(() => {
    loadAllAnalytics();
  }, [loadAllAnalytics]);

  // Reload department data when chart filter changes
  useEffect(() => {
    if (!loading) {
      loadDepartmentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptChartCollegeId]);

  // Reload timeline when days change
  useEffect(() => {
    if (!loading) {
      loadTimelineData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineDays]);

  // Reload submissions timeline when days change
  useEffect(() => {
    if (!loading) {
      loadSubmissionsTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionDays]);

  // Handle global filter change
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    // Reset department chart filter when global filter changes
    setDeptChartCollegeId(null);
  };

  // Handle CSV export
  const handleExportCSV = useCallback(async () => {
    if (!authToken) return;
    await exportAnalyticsCSV(authToken, filters);
  }, [authToken, filters]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <FaSpinner className="animate-spin text-4xl text-meritRed" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-8 rounded-lg shadow-lg overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="flex items-center justify-between p-8 pb-4">
            <h1 className="text-3xl font-bold text-meritRed">
              User Analytics Dashboard
            </h1>
            <ExportButton
              targetRef={dashboardRef}
              onExportCSV={handleExportCSV}
              pdfFilename="analytics_dashboard"
            />
          </div>
          <div className="px-8 pb-4">
            <AnalyticsFilters
              authToken={authToken!}
              userId={user?.id || 0}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>

        <div ref={dashboardRef} className="p-8 space-y-8">
          {/* Overview Stats - Row 1: Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Active IMs"
              value={workflowData?.total_active || 0}
              subtitle="In progress"
              icon={<FaTasks />}
              gradient="yellow"
            />
            <StatCard
              title="Completed"
              value={workflowData?.total_completed || 0}
              subtitle="Certified + Published"
              icon={<FaCheckCircle />}
              gradient="green"
            />
            <StatCard
              title="Overdue"
              value={deadlineData?.summary?.overdue || 0}
              subtitle="Past deadline"
              icon={<FaExclamationTriangle />}
              gradient="red"
            />
            <StatCard
              title="Due Soon"
              value={deadlineData?.summary?.due_soon || 0}
              subtitle="Within 7 days"
              icon={<FaFileAlt />}
              gradient="blue"
            />
          </div>

          {/* Deadline Overview - Critical for monitoring */}
          <DeadlineOverview data={deadlineData} />

          {/* Workflow Pipeline - Shows where IMs are stuck */}
          <WorkflowChart data={workflowData} />

          {/* Two-column layout for submissions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submissions Timeline */}
            <SubmissionsTimelineChart
              data={submissionsTimeline}
              days={submissionDays}
              onDaysChange={setSubmissionDays}
            />

            {/* Top Submitters */}
            <UserSubmissionsList data={userSubmissions} />
          </div>

          {/* Activity Timeline Chart */}
          <ActivityTimelineChart
            data={timeline}
            days={timelineDays}
            onDaysChange={setTimelineDays}
          />

          {/* Two-column layout for status and trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* IM Status Distribution Chart */}
            <StatusDistributionChart data={overview} />

            {/* Monthly Trends Chart */}
            <MonthlyTrendsChart data={overview} />
          </div>

          {/* College Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* College Performance Chart */}
            <CollegePerformanceChart data={collegeData} />

            {/* College Completion Rates Table */}
            <CollegeCompletionTable data={collegeData} />
          </div>

          {/* Department Performance Chart */}
          <DepartmentPerformanceChart
            data={departmentData}
            collegeData={collegeData}
            selectedCollegeId={deptChartCollegeId}
            onCollegeChange={setDeptChartCollegeId}
          />

          {/* Top Contributors List */}
          <TopContributorsList data={contributors} />
        </div>
      </div>
    </div>
  );
}
