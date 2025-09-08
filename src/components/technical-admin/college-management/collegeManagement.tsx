import React, { useEffect, useState, useCallback, useMemo } from "react";
import { College } from "../../../types/college";
import { Department } from "../../../types/department";
import { useAuth } from "../../auth/AuthProvider";
import {
  getAllColleges,
  createCollege,
  deleteCollege,
  updateCollege,
} from "../../../api/college";
import {
  getDepartmentsByCollegeId,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../api/department";
import CollegeCreationForm, {
  CollegeCreationData,
} from "./CollegeCreationForm";
import ConfirmationModal from "../ConfirmationModal";
import ToastContainer, { ToastMessage } from "../Toast";
import CollegeListTable from "./CollegeListTable";
import PaginationControls from "./PaginationControls";
import SearchBar from "./SearchBar";

interface CollegeManagementProps {
  onBack?: () => void;
}

const PAGE_SIZE = 10;

export default function CollegeManagement({ onBack }: CollegeManagementProps) {
  const { authToken, user } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [departments, setDepartments] = useState<Record<number, Department[]>>(
    {}
  );
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editCollegeId, setEditCollegeId] = useState<number | null>(null);
  const [editCollegeDraft, setEditCollegeDraft] = useState<{
    abbreviation: string;
    name: string;
  }>({
    abbreviation: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<
    | null
    | { action: "delete-college"; collegeId: number }
    | { action: "delete-department"; collegeId: number; depId: number }
  >(null);

  function pushToast(type: ToastMessage["type"], text: string) {
    setToasts((t) => [
      ...t,
      { id: Date.now() + Math.random(), type, text, duration: 4000 },
    ]);
  }
  function removeToast(id: number) {
    setToasts((t) => t.filter((m) => m.id !== id));
  }

  const fetchColleges = useCallback(async () => {
    if (!authToken) return;
    setLoadingColleges(true);
    try {
      const res = await getAllColleges(authToken);
      const list = res?.colleges || res?.data || [];
      setColleges(list);
    } catch {
      setColleges([]);
    }
    setLoadingColleges(false);
  }, [authToken]);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  async function toggleCollege(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!departments[id]) {
      await fetchDepartments(id);
    }
  }

  async function fetchDepartments(collegeId: number) {
    if (!authToken) return;
    try {
      const res = await getDepartmentsByCollegeId(collegeId, authToken);
      const list = Array.isArray(res)
        ? res
        : res?.departments || res?.data || [];
      setDepartments((d) => ({ ...d, [collegeId]: list }));
    } catch {
      setDepartments((d) => ({ ...d, [collegeId]: [] }));
    }
  }

  async function handleCreateCollege(data: CollegeCreationData) {
    if (!authToken) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        abbreviation: data.abbreviation,
        name: data.name,
        created_by: user?.staff_id || "",
        updated_by: user?.staff_id || "",
      };
      const res = await createCollege(payload, authToken);
      const collegeId = res?.id;
      if (collegeId && data.departments.length) {
        for (const dep of data.departments) {
          try {
            await createDepartment(
              {
                college_id: collegeId,
                abbreviation: dep.abbreviation,
                name: dep.name,
                created_by: user?.staff_id || "",
                updated_by: user?.staff_id || "",
              },
              authToken
            );
          } catch {
            /* ignore individual department failures */
          }
        }
      }
      setShowCreate(false);
      await fetchColleges();
      pushToast("success", "College created");
    } catch (e: any) {
      setError(e?.message || "Failed to create college");
      pushToast("error", "Failed to create college");
    } finally {
      setSaving(false);
    }
  }

  function startEditCollege(college: College) {
    setEditCollegeId(college.id);
    setEditCollegeDraft({
      abbreviation: college.abbreviation,
      name: college.name,
    });
  }

  async function saveEditCollege(id: number) {
    if (!authToken) return;
    setSaving(true);
    try {
      await updateCollege(
        id,
        { ...editCollegeDraft, updated_by: user?.staff_id || "" },
        authToken
      );
      setEditCollegeId(null);
      await fetchColleges();
      pushToast("success", "College updated");
    } finally {
      setSaving(false);
    }
  }

  function requestRemoveCollege(id: number) {
    setConfirmState({ action: "delete-college", collegeId: id });
  }
  async function performRemoveCollege(id: number) {
    if (!authToken) return;
    setSaving(true);
    try {
      setColleges((c) => c.filter((col) => col.id !== id)); // optimistic
      await deleteCollege(id, authToken);
      pushToast("success", "College deleted");
      await fetchColleges();
    } catch {
      pushToast("error", "Failed to delete college");
      await fetchColleges();
    } finally {
      setSaving(false);
    }
  }

  function startEditDepartment(collegeId: number, dep: Department) {
    setDepartments((d) => ({
      ...d,
      [collegeId]: d[collegeId].map((r) =>
        r.id === dep.id ? ({ ...r, __editing: true } as any) : r
      ),
    }));
  }

  function updateDepartmentDraft(
    collegeId: number,
    depId: number,
    field: string,
    value: string
  ) {
    setDepartments((d) => ({
      ...d,
      [collegeId]: d[collegeId].map((r) =>
        r.id === depId ? { ...r, [field]: value } : r
      ),
    }));
  }
  async function saveDepartment(collegeId: number, dep: any) {
    if (!authToken) return;
    setSaving(true);
    try {
      await updateDepartment(
        dep.id,
        {
          abbreviation: dep.abbreviation,
          name: dep.name,
          updated_by: user?.staff_id || "",
        },
        authToken
      );
      await fetchDepartments(collegeId);
      pushToast("success", "Department updated");
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteDepartment(collegeId: number, depId: number) {
    setConfirmState({ action: "delete-department", collegeId, depId });
  }
  async function performDeleteDepartment(collegeId: number, depId: number) {
    if (!authToken) return;
    setSaving(true);
    try {
      setDepartments((d) => ({
        ...d,
        [collegeId]: (d[collegeId] || []).filter((dep) => dep.id !== depId),
      }));
      await deleteDepartment(depId, authToken);
      pushToast("success", "Department deleted");
      await fetchDepartments(collegeId);
    } catch {
      pushToast("error", "Failed to delete department");
      await fetchDepartments(collegeId);
    } finally {
      setSaving(false);
    }
  }

  async function addNewDepartmentRow(collegeId: number) {
    setDepartments((d) => ({
      ...d,
      [collegeId]: [
        ...(d[collegeId] || []),
        { id: -Date.now(), abbreviation: "", name: "", __new: true } as any,
      ],
    }));
  }
  async function saveNewDepartment(collegeId: number, dep: any) {
    if (!authToken) return;
    if (!dep.abbreviation.trim() || !dep.name.trim()) return;
    setSaving(true);
    try {
      await createDepartment(
        {
          college_id: collegeId,
          abbreviation: dep.abbreviation,
          name: dep.name,
          created_by: user?.staff_id || "",
          updated_by: user?.staff_id || "",
        },
        authToken
      );
      await fetchDepartments(collegeId);
      pushToast("success", "Department created");
    } finally {
      setSaving(false);
    }
  }

  const filteredColleges = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return colleges;
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.abbreviation.toLowerCase().includes(term)
    );
  }, [colleges, search]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredColleges.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filteredColleges.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredColleges, currentPage]
  );
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg h-full">
        <div className="flex flex-wrap items-center justify-between gap-4 p-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
              >
                ← User Management
              </button>
            )}
            <h1 className="text-3xl font-bold">College Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <button
              className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow"
              onClick={() => setShowCreate(true)}
            >
              + Create College
            </button>
          </div>
        </div>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="p-4 overflow-y-auto">
          {loadingColleges ? (
            <div>Loading colleges...</div>
          ) : (
            <CollegeListTable
              colleges={paginated}
              expanded={expanded}
              editCollegeId={editCollegeId}
              editCollegeDraft={editCollegeDraft}
              departments={departments}
              onExpand={toggleCollege}
              onEdit={startEditCollege}
              onSave={saveEditCollege}
              onCancel={() => setEditCollegeId(null)}
              onDelete={requestRemoveCollege}
              onStartEditDepartment={startEditDepartment}
              onAddDepartment={addNewDepartmentRow}
              onUpdateDepartmentDraft={updateDepartmentDraft}
              onSaveDepartment={saveDepartment}
              onDeleteDepartment={requestDeleteDepartment}
              onSaveNewDepartment={saveNewDepartment}
              onFetchDepartments={fetchDepartments}
            />
          )}
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredColleges.length}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg p-6 min-w-[400px] max-w-[90vw] z-10">
            <button
              className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setShowCreate(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Create College</h2>
            <CollegeCreationForm
              onSubmit={handleCreateCollege}
              onCancel={() => setShowCreate(false)}
              saving={saving}
              existingAbbreviations={colleges.map((c) => c.abbreviation)}
            />
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>
        </div>
      )}
      <ToastContainer messages={toasts} remove={removeToast} />
      <ConfirmationModal
        open={!!confirmState}
        title={
          confirmState?.action === "delete-college"
            ? "Delete College"
            : "Delete Department"
        }
        message={
          confirmState?.action === "delete-college"
            ? "Are you sure you want to delete this college? This may affect related departments."
            : "Are you sure you want to delete this department?"
        }
        confirmText="Delete"
        onCancel={() => setConfirmState(null)}
        loading={saving}
        onConfirm={async () => {
          if (!confirmState) return;
          if (confirmState.action === "delete-college")
            await performRemoveCollege(confirmState.collegeId);
          else
            await performDeleteDepartment(
              confirmState.collegeId,
              confirmState.depId
            );
          setConfirmState(null);
        }}
      />
    </div>
  );
}
