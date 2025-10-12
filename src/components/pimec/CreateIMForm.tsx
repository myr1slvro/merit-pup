import React, { useEffect, useMemo, useState } from "react";
import { createInstructionalMaterial } from "../../api/instructionalmaterial";
import {
  getAllDepartments,
  getDepartmentsByCollegeId,
} from "../../api/department";
import { getAllColleges } from "../../api/college";
import { getCollegesForUser } from "../../api/collegeincluded";
import { createUniversityIM } from "../../api/universityim";
import { createServiceIM } from "../../api/serviceim";
import { useAuth } from "../auth/AuthProvider";
import { IMType } from "../../types/instructionalmats";
import { createAuthor } from "../../api/author";
import AuthorsSelector from "../faculty/AuthorsSelector";
import IMTypeFields from "../faculty/UnivIMTypeFields";
import CollegeSelector from "../faculty/CollegeSelector";
import SubjectSelector from "../faculty/SubjectSelector";

type CreateIMFormProps = {
  selectedCollege?: any | null;
  onCancel: () => void;
  onCreated?: (newId?: number) => void;
};

export default function CreateIMForm({
  selectedCollege,
  onCancel,
  onCreated,
}: CreateIMFormProps) {
  const { authToken, user } = useAuth();

  const normalizeList = (res: any) =>
    Array.isArray(res)
      ? res
      : res?.subjects || res?.departments || res?.colleges || res?.data || [];

  const [imType, setImType] = useState<IMType>(IMType.university);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>("");

  // --- College & subject selection state ---
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | "">("");

  // Subjects depend on the effective college selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");

  const effectiveCollegeId = selectedCollegeId;

  // Conditional fields
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">(
    ""
  );
  const [yearLevel, setYearLevel] = useState<number | "">("");
  // Validity is now implicit; removed from the form but still sent with a sensible default
  const defaultValidity = useMemo(() => String(new Date().getFullYear()), []);

  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    (async function loadColleges() {
      setCollegesLoading(true);
      try {
        const res = await getAllColleges(authToken);
        if (!cancelled) setColleges(normalizeList(res));
      } catch {
        if (!cancelled) setColleges([]);
      } finally {
        if (!cancelled) setCollegesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // Subjects now fetched by SubjectSelector for UI; parent holds only selected id.

  // Load departments for the effective college or aggregate across user's colleges when "All colleges"
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    (async function loadDepartments() {
      try {
        if (effectiveCollegeId) {
          const res = await getDepartmentsByCollegeId(
            effectiveCollegeId as number,
            authToken
          );
          if (!cancelled) setDepartments(normalizeList(res));
        } else if (user?.id) {
          // Aggregate departments from all colleges the user belongs to
          const ciRes: any = await getCollegesForUser(
            user.id as number,
            authToken
          );
          const assocList: any[] = Array.isArray(ciRes)
            ? ciRes
            : ciRes?.data || [];
          const collegeIds: number[] = assocList
            .map((a: any) =>
              typeof a?.college_id === "string"
                ? parseInt(a.college_id, 10)
                : a?.college_id
            )
            .filter((id: any) => Number.isFinite(id));
          const seen = new Set<number>();
          const agg: any[] = [];
          for (const cid of collegeIds) {
            try {
              const res = await getDepartmentsByCollegeId(cid, authToken);
              const list: any[] = normalizeList(res);
              list.forEach((d: any) => {
                if (Number.isFinite(d?.id) && !seen.has(d.id)) {
                  seen.add(d.id);
                  agg.push(d);
                }
              });
            } catch {
              // continue other colleges
            }
          }
          if (!cancelled) setDepartments(agg);
        } else {
          if (!cancelled) setDepartments([]);
        }
      } catch {
        if (!cancelled) setDepartments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, effectiveCollegeId, user?.id]);

  // Authors fetched within AuthorsSelector

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    if (selectedAuthorIds.length === 0) {
      setError("Please select at least one author to assign the IM.");
      return;
    }
    setError("");
    setCreating(true);
    try {
      if (!selectedSubjectId) {
        throw new Error("Please select a subject.");
      }
      // Create subtype record first
      let subtypeId: number | string | undefined;
      // Ensure we send the chosen college id (dropdown preferred, otherwise prop)
      if (imType === IMType.university) {
        if (!effectiveCollegeId) throw new Error("No college selected.");
        if (!selectedDepartmentId) throw new Error("Select a department.");
        if (!yearLevel) throw new Error("Enter year level.");
        const uniPayload = {
          college_id: effectiveCollegeId,
          department_id: selectedDepartmentId,
          year_level: Number(yearLevel),
          subject_id: selectedSubjectId,
        };
        const uniRes = await createUniversityIM(uniPayload, authToken);
        if (uniRes?.error) throw new Error(uniRes.error);
        subtypeId = uniRes?.id;
      } else {
        if (!effectiveCollegeId) throw new Error("No college selected.");
        const svcPayload = {
          college_id: effectiveCollegeId,
          subject_id: selectedSubjectId,
        };
        const svcRes = await createServiceIM(svcPayload, authToken);
        if (svcRes?.error) throw new Error(svcRes.error);
        subtypeId = svcRes?.id;
      }

      // Create master IM without s3_link (assignment mode)
      const payload: any = {
        im_type: imType,
        status: "Assigned to Faculty", // Will be set automatically in backend
        validity: defaultValidity,
        created_by: user?.staff_id || "",
        updated_by: user?.staff_id || "",
        s3_link: null, // No file uploaded yet
        notes: "IM assigned to authors. Awaiting initial upload.",
        author_ids: selectedAuthorIds, // Send author IDs for email notifications
      };
      if (imType === IMType.university) {
        payload.university_im_id = subtypeId;
      } else {
        payload.service_im_id = subtypeId;
      }

      const res = await createInstructionalMaterial(payload, authToken);
      if (res?.error) throw new Error(res.error);
      const newImId = res?.id;

      // Create author associations if any were selected
      if (newImId && selectedAuthorIds.length) {
        for (const uid of selectedAuthorIds) {
          try {
            await createAuthor(newImId, uid, authToken);
          } catch (err) {
            // Non-blocking: log and continue
          }
        }
      }
      onCreated?.(res?.id);
      onCancel();
    } catch (e: any) {
      setError(e.message || "Failed to assign IM.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form
      onSubmit={handleAssign}
      className="space-y-5 max-h-[75vh] overflow-y-auto pr-1"
    >
      {/* Row 1: College (full width) with search */}
      <div className="grid grid-cols-1 gap-2">
        <CollegeSelector
          value={selectedCollegeId}
          onChange={(id) => {
            setSelectedCollegeId(id);
            setSelectedSubjectId("");
            setSelectedDepartmentId("");
            setSelectedAuthorIds([]);
          }}
        />
      </div>

      {/* Row 2: Subjects (2/3) + IM Type (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex flex-col">
          <SubjectSelector
            collegeId={effectiveCollegeId as number | ""}
            value={selectedSubjectId}
            onChange={(id) => setSelectedSubjectId(id)}
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            IM Type
          </label>
          <select
            value={imType}
            onChange={(e) => setImType(e.target.value as IMType)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-meritRed focus:ring-1 focus:ring-meritRed/30"
          >
            <option value={IMType.university}>University IM</option>
            <option value={IMType.service}>Service IM</option>
          </select>
        </div>
      </div>

      {/* Authors (filtered by selected college) */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Authors <span className="text-meritRed">*</span>
          </label>
          <div className="mt-2">
            <AuthorsSelector
              collegeId={effectiveCollegeId as number | ""}
              selectedIds={selectedAuthorIds}
              onChange={setSelectedAuthorIds}
              disabled={false}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Departments + Year Level via IMTypeFields */}
      <div className="grid grid-cols-1 gap-3">
        <div className="md:col-span-2">
          <IMTypeFields
            imType={imType}
            departments={departments}
            selectedDepartmentId={selectedDepartmentId}
            onDepartmentChange={setSelectedDepartmentId}
            yearLevel={yearLevel}
            onYearLevelChange={setYearLevel}
          />
        </div>
      </div>

      {error && <div className="text-meritRed text-sm">{error}</div>}

      <div className="flex flex-row-reverse gap-2 mt-4 items-center">
        <div className="flex-1 text-sm text-gray-600">
          <span className="text-xs text-gray-600">
            Assigning will notify the selected authors via email to upload the
            IM.
          </span>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-meritRed text-white rounded-md hover:bg-meritDarkRed font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={creating || selectedAuthorIds.length === 0}
        >
          {creating ? "Assigning..." : "Assign IM"}
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-meritGray font-semibold shadow-sm"
          onClick={onCancel}
          disabled={creating}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
