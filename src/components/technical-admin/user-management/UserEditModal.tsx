import React, { useEffect, useState } from "react";
import { User } from "../../../types/user";
import { getAllColleges } from "../../../api/college";

type EditFormType = Partial<User> & { colleges?: number[] };

export default function EditModal({
  editingUser,
  editForm,
  handleEditChange,
  handleEditSave,
  handleEditCancel,
  handleDeleteUser,
  saving,
}: {
  editingUser: User | null;
  editForm: EditFormType;
  handleEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleEditSave: () => void;
  handleEditCancel: () => void;
  handleDeleteUser: () => void;
  saving: boolean;
}) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);

  useEffect(() => {
    async function fetchAllColleges() {
      setCollegesLoading(true);
      const token = localStorage.getItem("authToken") || "";
      try {
        const res = await getAllColleges(token);
        const collegesList = res?.colleges || res?.data || [];
        setColleges(collegesList);
      } catch {
        setColleges([]);
      }
      setCollegesLoading(false);
    }
    fetchAllColleges();
  }, []);

  function handleCollegeCheck(id: number) {
    const selected = Array.isArray(editForm.colleges) ? editForm.colleges : [];
    let newValue: number[];
    if (selected.includes(id)) {
      newValue = selected.filter((c) => c !== id);
    } else {
      newValue = [...selected, id];
    }
    handleEditChange({
      target: { name: "colleges", value: newValue },
    } as any);
  }

  if (!editingUser) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 min-w-[350px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSave();
          }}
          className="space-y-3"
        >
          <div>
            <span className="text-xs text-gray-500">Colleges</span>
            {collegesLoading ? (
              <div className="text-sm text-gray-400">Loading colleges...</div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {colleges.map((college) => (
                  <label
                    key={college.id}
                    className="flex items-center gap-1 border rounded px-2 py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!(editForm.colleges || []).includes(college.id)}
                      onChange={() => handleCollegeCheck(college.id)}
                      className="accent-immsRed"
                    />
                    <span className="text-sm">
                      {college.name}{" "}
                      <span className="text-xs text-gray-500">
                        ({college.abbreviation})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* User ID (read-only) */}
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-gray-500">User ID</span>
              <input
                type="text"
                value={editingUser.id ?? ""}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Role</span>
              <select
                name="role"
                value={editForm.role ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
                required
              >
                <option value="">Select Role</option>
                <option value="Faculty">Faculty</option>
                <option value="PIMEC">PIMEC</option>
                <option value="UTLDO Admin">UTLDO Admin</option>
                <option value="Technical Admin">Technical Admin</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Academic Rank</span>
              <select
                name="rank"
                value={(editForm as any).rank ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                <option value="">Select Rank (optional)</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Instructor">Instructor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-gray-500">Last Name</span>
              <input
                type="text"
                name="last_name"
                value={editForm.last_name ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">First Name</span>
              <input
                type="text"
                name="first_name"
                value={editForm.first_name ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Middle Name</span>
              <input
                type="text"
                name="middle_name"
                value={editForm.middle_name ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-gray-500">Staff ID</span>
              <input
                type="text"
                name="staff_id"
                value={editForm.staff_id ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Email</span>
              <input
                type="email"
                name="email"
                value={editForm.email ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-gray-500">Phone</span>
              <input
                type="text"
                name="phone_number"
                value={editForm.phone_number ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Password</span>
              <input
                type="password"
                name="password"
                value={editForm.password ?? ""}
                onChange={handleEditChange}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>
          </div>
          {/* Read-only fields: birthdate, created/updated by/at */}
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <div className="flex-1">
              <span>Birthdate</span>
              <input
                type="text"
                value={editingUser.birth_date ?? ""}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <div className="flex-1">
              <span>Created At</span>
              <input
                type="text"
                value={editingUser.created_at ?? ""}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <div className="flex-1">
              <span>Created By</span>
              <input
                type="text"
                value={editingUser.created_by ?? ""}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <div className="flex-1">
              <span>Updated At</span>
              <input
                type="text"
                value={editingUser.updated_at ?? ""}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <div className="flex-1">
              <span>Updated By</span>
              <input
                type="text"
                value={editingUser.updated_by ?? ""}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-immsRed text-white rounded hover:bg-immsDarkRed font-semibold"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 font-semibold"
              onClick={handleEditCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-immsYellow text-black rounded hover:bg-yellow-400 font-semibold"
              onClick={handleDeleteUser}
              disabled={saving}
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
