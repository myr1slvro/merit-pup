import React from "react";
import { User } from "../../types/user";

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
  editForm: Partial<User>;
  handleEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleEditSave: () => void;
  handleEditCancel: () => void;
  handleDeleteUser: () => void;
  saving: boolean;
}) {
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
          <label className="block">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              name="email"
              value={editForm.email ?? ""}
              onChange={handleEditChange}
              className="mt-1 block w-full border rounded px-2 py-1"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Staff ID</span>
            <input
              type="text"
              name="staff_id"
              value={editForm.staff_id ?? ""}
              onChange={handleEditChange}
              className="mt-1 block w-full border rounded px-2 py-1"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Role</span>
            <select
              name="role"
              value={editForm.role ?? ""}
              onChange={handleEditChange}
              className="mt-1 block w-full border rounded px-2 py-1"
              required
            >
              <option value="">Select Role</option>
              <option value="Faculty">Faculty</option>
              <option value="Evaluator">Evaluator</option>
              <option value="UTLDO Admin">UTLDO Admin</option>
              <option value="Technical Admin">Technical Admin</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Password</span>
            <input
              type="text"
              name="password"
              value={editForm.password ?? ""}
              onChange={handleEditChange}
              className="mt-1 block w-full border rounded px-2 py-1"
              required
            />
          </label>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold"
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
              className="px-4 py-2 bg-meritYellow text-black rounded hover:bg-yellow-400 font-semibold"
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
