import React, { ReactNode, useState } from "react";
import Pagination from "../../shared/Pagination";
import SubjectListTable from "./SubjectListTable";
import SubjectCreationForm from "./SubjectCreationForm";
import { useAuth } from "../../auth/AuthProvider";
import { useEffect } from "react";
import { getAllColleges } from "../../../api/college";
import type { College } from "../../../types/college";
import SubjectFilters from "./SubjectFilters";

interface SubjectManagementProps {
  embedded?: boolean;
  headLeft?: ReactNode;
  collegeFilterId?: number;
}

export default function SubjectManagement({
  embedded = false,
  headLeft,
  collegeFilterId,
}: SubjectManagementProps) {
  const { authToken } = useAuth();
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | "">(
    typeof collegeFilterId === "number" ? collegeFilterId : ""
  );
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Keep internal selection in sync with prop from deep-link
  useEffect(() => {
    if (typeof collegeFilterId === "number") {
      setSelectedCollegeId(collegeFilterId);
    } else {
      setSelectedCollegeId("");
    }
  }, [collegeFilterId]);

  // Load colleges for dropdown
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function load() {
      setCollegesLoading(true);
      try {
        const res = await getAllColleges(authToken as string);
        const list: any[] = Array.isArray(res)
          ? res
          : res?.colleges || res?.data || [];
        if (!cancelled) setColleges(list as College[]);
      } catch {
        if (!cancelled) setColleges([]);
      } finally {
        if (!cancelled) setCollegesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Reset pagination when search or college changes
  useEffect(() => {
    setPage(1);
  }, [selectedCollegeId, search]);

  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg h-full">
        <div className="flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            {headLeft
              ? headLeft
              : !embedded && (
                  <h1 className="text-3xl font-bold">Subject Management</h1>
                )}
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <SubjectFilters
              collegeId={selectedCollegeId}
              onCollegeChange={setSelectedCollegeId}
              search={search}
              onSearchChange={setSearch}
            />
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow h-fit"
                onClick={() => setShowCreate(true)}
              >
                + Create Subject
              </button>
            </div>
          </div>
        </div>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="flex-grow">
          <SubjectListTable
            page={page}
            setHasNext={setHasNext}
            setHasPrev={setHasPrev}
            refreshKey={refreshKey}
            collegeFilterId={
              typeof selectedCollegeId === "number"
                ? selectedCollegeId
                : undefined
            }
            search={search}
          />
        </div>
        <div className="pb-8 px-8">
          <Pagination
            page={page}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-lg shadow-lg p-6 min-w-1/2 max-w-9/10 z-10">
              <button
                className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
                onClick={() => setShowCreate(false)}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Create Subject</h2>
              <SubjectCreationForm
                initialCollegeFilterId={
                  typeof selectedCollegeId === "number"
                    ? selectedCollegeId
                    : undefined
                }
                onCreated={() => {
                  setShowCreate(false);
                  setRefreshKey((k) => k + 1);
                }}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
