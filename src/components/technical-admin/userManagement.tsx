import UserManagementTable from "./userManagementTable";
import { useState } from "react";
import UserCreationForm from "./UserCreationForm";
import { createUser } from "../../api/users";
import { useAuth } from "../auth/AuthProvider";

export default function userManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    role: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    staff_id: "",
    email: "",
    phone_number: "",
    password: "",
    birth_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { authToken, user } = useAuth();
  // For triggering table refresh
  const [refreshKey, setRefreshKey] = useState(0);

  function handleCreateUser() {
    setShowCreateModal(true);
  }
  function handleCloseCreateModal() {
    setShowCreateModal(false);
    setCreateForm({
      role: "",
      last_name: "",
      first_name: "",
      middle_name: "",
      staff_id: "",
      email: "",
      phone_number: "",
      password: "",
      birth_date: "",
    });
  }
  function handleCreateFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setCreateForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  async function handleCreateFormSubmit() {
    if (!authToken) return;
    setSaving(true);
    setError("");
    try {
      // Add created_by and updated_by using current user's staff_id
      const payload = {
        ...createForm,
        created_by: user?.staff_id || "",
        updated_by: user?.staff_id || "",
      };
      console.log("Creating user with:", payload);
      const response = await createUser(payload, authToken);
      // Debug: log response
      console.log("Create user response:", response);
      if (response && response.error) {
        setError(response.error || "Unknown error");
        alert(response.error || "Unknown error");
        setSaving(false);
        return;
      }
      setShowCreateModal(false);
      setCreateForm({
        role: "",
        last_name: "",
        first_name: "",
        middle_name: "",
        staff_id: "",
        email: "",
        phone_number: "",
        password: "",
        birth_date: "",
      });
      setRefreshKey((k) => k + 1); // trigger table refresh
    } catch (err) {
      setError("Failed to create user");
      alert("Failed to create user");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <button
            className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow"
            onClick={handleCreateUser}
          >
            + Create User
          </button>
        </div>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="">
          <UserManagementTable key={refreshKey} />
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 min-w-[350px] max-w-[90vw]">
              <h2 className="text-xl font-bold mb-4">Create User</h2>
              <UserCreationForm
                form={createForm}
                onChange={handleCreateFormChange}
                onSubmit={handleCreateFormSubmit}
                onCancel={handleCloseCreateModal}
                saving={saving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
