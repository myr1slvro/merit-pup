import React, { useEffect, useMemo, useState } from "react";
import { FaFilter } from "react-icons/fa";
import { useAuth } from "../../auth/AuthProvider";
import {
  getAuditLogs,
  getActivityLogFilterMetadata,
  type ActivityLogFilterMetadata,
  type ActivityLogFilters,
} from "../../../api/activitylog";
import type { ActivityLog } from "../../../types/activitylog";
import Pagination from "../../shared/Pagination";

type FilterDraft = {
  userId: string;
  tableName: string;
  action: string;
  startDate: string;
  endDate: string;
  perPage: number;
};

const DEFAULT_FILTERS: FilterDraft = {
  userId: "",
  tableName: "",
  action: "",
  startDate: "",
  endDate: "",
  perPage: 10,
};

const DEFAULT_ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESTORE",
  "LOGIN",
  "LOGOUT",
  "ASSIGN",
  "UNASSIGN",
];

const EMPTY_FILTER_METADATA: ActivityLogFilterMetadata = {
  actions: [],
  table_names: [],
};

function toActivityLogFilters(
  draft: FilterDraft,
  keyword: string,
  page: number,
): ActivityLogFilters {
  const userIdNum = Number(draft.userId);

  return {
    page,
    per_page: draft.perPage,
    user_id:
      Number.isFinite(userIdNum) && userIdNum > 0 ? userIdNum : undefined,
    table_name: draft.tableName.trim() || undefined,
    action: draft.action.trim() || undefined,
    q: keyword.trim() || undefined,
    start_date: draft.startDate || undefined,
    end_date: draft.endDate || undefined,
  };
}

function hasActiveFilters(filters: FilterDraft, keyword: string): boolean {
  return Boolean(
    filters.userId ||
    filters.tableName ||
    filters.action ||
    filters.startDate ||
    filters.endDate ||
    keyword.trim(),
  );
}

function matchesLog(
  log: ActivityLog,
  filters: FilterDraft,
  keyword: string,
): boolean {
  const userIdNum = Number(filters.userId);
  if (
    Number.isFinite(userIdNum) &&
    userIdNum > 0 &&
    log.user_id !== userIdNum
  ) {
    return false;
  }

  if (
    filters.tableName &&
    !String(log.table_name || "")
      .toLowerCase()
      .includes(filters.tableName.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.action &&
    !String(log.action || "")
      .toLowerCase()
      .includes(filters.action.toLowerCase())
  ) {
    return false;
  }

  if (filters.startDate) {
    const start = new Date(`${filters.startDate}T00:00:00`);
    const created = new Date(log.created_at);
    if (created < start) return false;
  }

  if (filters.endDate) {
    const end = new Date(`${filters.endDate}T23:59:59.999`);
    const created = new Date(log.created_at);
    if (created > end) return false;
  }

  const q = keyword.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    log.description,
    log.table_name,
    log.action,
    String(log.user_id),
    String(log.record_id ?? ""),
    log.old_values || "",
    log.new_values || "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function formatDate(isoDate?: string) {
  if (!isoDate) return "-";
  try {
    return new Date(isoDate).toLocaleString();
  } catch {
    return isoDate;
  }
}

function compactValue(raw?: string | null, maxLen: number = 80): string {
  if (!raw) return "-";

  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    text = JSON.stringify(parsed);
  } catch {
    text = raw;
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen)}...`;
}

export default function AuditLogsPage() {
  const { authToken } = useAuth();

  const [draft, setDraft] = useState<FilterDraft>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterDraft>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ActivityLogFilterMetadata>(
    EMPTY_FILTER_METADATA,
  );
  const [isFallbackFiltering, setIsFallbackFiltering] = useState(false);

  const query = useMemo(
    () => toActivityLogFilters(appliedFilters, appliedKeyword, page),
    [appliedFilters, appliedKeyword, page],
  );

  const actionOptions = useMemo(() => {
    const merged = new Set<string>();
    DEFAULT_ACTION_OPTIONS.forEach((option) => merged.add(option));
    metadata.actions.forEach((option) => {
      const normalized = String(option || "").trim();
      if (normalized) merged.add(normalized.toUpperCase());
    });

    return Array.from(merged).sort();
  }, [metadata.actions]);

  const tableOptions = useMemo(() => {
    const merged = new Set<string>();
    metadata.table_names.forEach((tableName) => {
      const normalized = String(tableName || "").trim();
      if (normalized) merged.add(normalized);
    });

    return Array.from(merged).sort();
  }, [metadata.table_names]);

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    if (appliedKeyword.trim()) badges.push(`Search: ${appliedKeyword.trim()}`);
    if (appliedFilters.userId) badges.push(`User ID: ${appliedFilters.userId}`);
    if (appliedFilters.tableName.trim()) {
      badges.push(`Table: ${appliedFilters.tableName.trim()}`);
    }
    if (appliedFilters.action.trim()) {
      badges.push(`Action: ${appliedFilters.action.trim()}`);
    }
    if (appliedFilters.startDate || appliedFilters.endDate) {
      badges.push(
        `Date: ${appliedFilters.startDate || "Any"} to ${appliedFilters.endDate || "Any"}`,
      );
    }
    if (appliedFilters.perPage !== DEFAULT_FILTERS.perPage) {
      badges.push(`Per page: ${appliedFilters.perPage}`);
    }
    return badges;
  }, [appliedFilters, appliedKeyword]);

  useEffect(() => {
    if (!authToken) return;

    getActivityLogFilterMetadata(authToken)
      .then((res) => {
        setMetadata({
          actions: Array.isArray(res?.actions) ? res.actions : [],
          table_names: Array.isArray(res?.table_names) ? res.table_names : [],
        });
      })
      .catch(() => {
        setMetadata(EMPTY_FILTER_METADATA);
      });
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const res = await getAuditLogs(authToken, query);
      if (cancelled) return;

      const rows = Array.isArray(res?.logs) ? res.logs : [];
      const pages = Number(res?.pages || 1);
      const currentPerPage = Number(res?.per_page || query.per_page || 10);
      const hasFilters = hasActiveFilters(appliedFilters, appliedKeyword);

      const serverLooksUnfiltered =
        hasFilters &&
        rows.some((log) => !matchesLog(log, appliedFilters, appliedKeyword));

      if (!serverLooksUnfiltered) {
        setIsFallbackFiltering(false);
        setLogs(rows);
        setTotal(Number(res?.total || 0));
        setTotalPages(pages > 0 ? pages : 1);
        setPerPage(currentPerPage > 0 ? currentPerPage : 10);
        return;
      }

      // Fallback: fetch all pages and filter client-side when server-side filters are not applied.
      const fallbackPerPage = 100;
      const first = await getAuditLogs(authToken, {
        ...query,
        page: 1,
        per_page: fallbackPerPage,
      });
      const firstRows = Array.isArray(first?.logs) ? first.logs : [];
      const firstPages = Number(first?.pages || 1);

      const restPagePromises = [];
      for (let p = 2; p <= firstPages; p += 1) {
        restPagePromises.push(
          getAuditLogs(authToken, {
            ...query,
            page: p,
            per_page: fallbackPerPage,
          }),
        );
      }

      const restResponses = await Promise.all(restPagePromises);
      const merged = [...firstRows];
      restResponses.forEach((item) => {
        const itemRows = Array.isArray(item?.logs) ? item.logs : [];
        merged.push(...itemRows);
      });

      const filtered = merged.filter((log) =>
        matchesLog(log, appliedFilters, appliedKeyword),
      );

      const requestedPage = Math.max(1, Number(query.page || 1));
      const requestedPerPage = Math.max(1, Number(query.per_page || 10));
      const localPages = Math.max(
        1,
        Math.ceil(filtered.length / requestedPerPage),
      );
      const safePage = Math.min(requestedPage, localPages);
      const start = (safePage - 1) * requestedPerPage;
      const end = start + requestedPerPage;

      if (!cancelled && safePage !== requestedPage) {
        setPage(safePage);
      }

      if (!cancelled) {
        setIsFallbackFiltering(true);
        setLogs(filtered.slice(start, end));
        setTotal(filtered.length);
        setTotalPages(localPages);
        setPerPage(requestedPerPage);
      }
    })()
      .catch((err: any) => {
        if (cancelled) return;
        setLogs([]);
        setTotal(0);
        setTotalPages(1);
        setError(err?.message || "Failed to load audit logs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, query, appliedFilters, appliedKeyword]);

  function handleDraftChange<K extends keyof FilterDraft>(
    key: K,
    value: FilterDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(searchInput.trim());
  }

  function applyModalFilters(e: React.FormEvent) {
    e.preventDefault();

    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setError("Start date must be on or before end date.");
      return;
    }

    setError(null);
    setPage(1);
    setAppliedFilters(draft);
    setIsFilterModalOpen(false);
  }

  function clearAllFilters() {
    setDraft(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setAppliedKeyword("");
    setPage(1);
    setIsFilterModalOpen(false);
  }

  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg h-full">
        <div className="flex flex-wrap items-center justify-between gap-4 p-8">
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {loading ? "Loading..." : `Total records: ${total}`}
            </div>
            {isFallbackFiltering && (
              <div className="text-xs text-amber-700">
                Using local fallback filtering for this result set.
              </div>
            )}
          </div>
        </div>

        <hr className="h-1 rounded-full border-immsGray/50" />

        <form
          onSubmit={applySearch}
          className="px-6 pt-6 flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            placeholder="Search description/record"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-3 py-2 border rounded min-w-[22rem]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-immsRed text-white rounded hover:bg-immsDarkRed"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className="px-3 py-2 border rounded hover:bg-gray-100 flex items-center gap-2"
            title="Open filters"
          >
            <FaFilter className="text-gray-700" />
            Filters
          </button>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Clear
          </button>
        </form>

        <div className="px-6 py-3 flex flex-wrap gap-2">
          {activeFilterBadges.length === 0 ? (
            <span className="text-xs text-gray-500">No active filters.</span>
          ) : (
            activeFilterBadges.map((badge) => (
              <span
                key={badge}
                className="px-2 py-1 rounded-full bg-immsRed/10 text-immsRed text-xs"
              >
                {badge}
              </span>
            ))
          )}
        </div>

        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFilterModalOpen(false)}
            />
            <form
              onSubmit={applyModalFilters}
              className="relative bg-white rounded-lg shadow-lg p-6 min-w-[44rem] max-w-[90vw] z-10"
            >
              <button
                type="button"
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                onClick={() => setIsFilterModalOpen(false)}
                aria-label="Close filters"
              >
                &times;
              </button>

              <h2 className="text-xl font-bold mb-4">Filter Audit Logs</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    User ID
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Any user"
                    value={draft.userId}
                    onChange={(e) =>
                      handleDraftChange("userId", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Table Name
                  </label>
                  <input
                    list="audit-table-options"
                    type="text"
                    placeholder="Any table"
                    value={draft.tableName}
                    onChange={(e) =>
                      handleDraftChange("tableName", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                  <datalist id="audit-table-options">
                    {tableOptions.map((table) => (
                      <option key={table} value={table} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Action
                  </label>
                  <input
                    list="audit-action-options"
                    type="text"
                    placeholder="All actions"
                    value={draft.action}
                    onChange={(e) =>
                      handleDraftChange("action", e.target.value.toUpperCase())
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                  <datalist id="audit-action-options">
                    {actionOptions.map((action) => (
                      <option key={action} value={action} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Records per page
                  </label>
                  <select
                    value={draft.perPage}
                    onChange={(e) =>
                      handleDraftChange("perPage", Number(e.target.value) || 10)
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>

                <div className="md:col-span-2 border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Date Range
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        value={draft.startDate}
                        onChange={(e) =>
                          handleDraftChange("startDate", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="text-sm text-gray-500 pb-2 text-center">
                      to
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        value={draft.endDate}
                        onChange={(e) =>
                          handleDraftChange("endDate", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Date range applies to log Created At timestamps.
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Clear All
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-immsRed text-white rounded hover:bg-immsDarkRed"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="px-6 pb-6">
          {error && <div className="text-sm text-immsRed mb-3">{error}</div>}

          <div className="overflow-x-auto border border-gray-200 rounded shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Created At</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Table</th>
                  <th className="px-3 py-2 text-left">Record</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Old Values</th>
                  <th className="px-3 py-2 text-left">New Values</th>
                </tr>
              </thead>
              <tbody>
                {!loading && logs.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-gray-500" colSpan={9}>
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const oldValues = compactValue(log.old_values);
                    const newValues = compactValue(log.new_values);
                    return (
                      <tr key={log.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{log.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-3 py-2">{log.user_id}</td>
                        <td className="px-3 py-2">{log.action}</td>
                        <td className="px-3 py-2">{log.table_name}</td>
                        <td className="px-3 py-2">{log.record_id ?? "-"}</td>
                        <td
                          className="px-3 py-2 max-w-[22rem] truncate"
                          title={log.description}
                        >
                          {log.description}
                        </td>
                        <td
                          className="px-3 py-2 max-w-[14rem] truncate"
                          title={oldValues}
                        >
                          {oldValues}
                        </td>
                        <td
                          className="px-3 py-2 max-w-[14rem] truncate"
                          title={newValues}
                        >
                          {newValues}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4">
            <Pagination
              page={page}
              hasPrev={page > 1}
              hasNext={page < totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
            <div className="text-xs text-gray-500 mt-2">
              Page {page} of {totalPages} • {perPage} items per page
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
