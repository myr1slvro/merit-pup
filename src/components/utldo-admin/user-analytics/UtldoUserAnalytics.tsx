import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getAnalyticsOverview,
  getCollegeAnalytics,
  getDepartmentAnalytics,
  getUserContributions,
  getActivityTimeline,
  type AnalyticsOverview,
  type CollegeAnalytics,
  type DepartmentAnalytics,
  type UserContributions,
  type ActivityTimeline,
  type AnalyticsFilters as FiltersType,
} from "../../../api/analytics";
import { FaSpinner, FaChartBar, FaUsers, FaBuilding } from "react-icons/fa";

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

export default function UtldoUserAnalytics() {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states with proper types
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [collegeData, setCollegeData] = useState<CollegeAnalytics | null>(null);
  const [departmentData, setDepartmentData] =
    useState<DepartmentAnalytics | null>(null);
  const [contributors, setContributors] = useState<UserContributions | null>(
    null
  );
  const [timeline, setTimeline] = useState<ActivityTimeline | null>(null);

  // Global filter state
  const [filters, setFilters] = useState<FiltersType>({});

  // Department chart filter (separate from global)
  const [deptChartCollegeId, setDeptChartCollegeId] = useState<number | null>(
    null
  );
  const [timelineDays, setTimelineDays] = useState<number>(30);

  const loadAllAnalytics = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);
    try {
      const [overviewRes, collegeRes, deptRes, contribRes, timelineRes] =
        await Promise.all([
          getAnalyticsOverview(authToken, filters),
          getCollegeAnalytics(authToken, filters),
          getDepartmentAnalytics(authToken, filters.college_id),
          getUserContributions(authToken, 10, filters),
          getActivityTimeline(authToken, timelineDays, filters),
        ]);

      setOverview(overviewRes);
      setCollegeData(collegeRes);
      setDepartmentData(deptRes);
      setContributors(contribRes);
      setTimeline(timelineRes);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authToken, filters, timelineDays]);

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

  // Handle global filter change
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    // Reset department chart filter when global filter changes
    setDeptChartCollegeId(null);
  };

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
          <h1 className="text-3xl font-bold p-8 pb-4 text-meritRed">
            User Analytics Dashboard
          </h1>
          <div className="px-8 pb-4">
            <AnalyticsFilters
              authToken={authToken!}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Recent Activities"
              value={overview?.recent_activity_count || 0}
              subtitle="Last 30 days"
              icon={<FaChartBar />}
              gradient="red"
            />
            <StatCard
              title="Total Colleges"
              value={collegeData?.colleges?.length || 0}
              subtitle="Active colleges"
              icon={<FaBuilding />}
              gradient="blue"
            />
            <StatCard
              title="Active Contributors"
              value={contributors?.top_contributors?.length || 0}
              subtitle="Top performers"
              icon={<FaUsers />}
              gradient="green"
            />
          </div>

          {/* College Performance Chart */}
          <CollegePerformanceChart data={collegeData} />

          {/* College Completion Rates Table */}
          <CollegeCompletionTable data={collegeData} />

          {/* Department Performance Chart */}
          <DepartmentPerformanceChart
            data={departmentData}
            collegeData={collegeData}
            selectedCollegeId={deptChartCollegeId}
            onCollegeChange={setDeptChartCollegeId}
          />

          {/* Top Contributors List */}
          <TopContributorsList data={contributors} />

          {/* Activity Timeline Chart */}
          <ActivityTimelineChart
            data={timeline}
            days={timelineDays}
            onDaysChange={setTimelineDays}
          />

          {/* IM Status Distribution Chart */}
          <StatusDistributionChart data={overview} />

          {/* Monthly Trends Chart */}
          <MonthlyTrendsChart data={overview} />
        </div>
      </div>
    </div>
  );
}
