import UserManagementTable from "./UserManagementTable";
import Pagination from "../../shared/Pagination";
import { useState, ReactNode } from "react";
import UserCreationForm from "./UserCreationForm";
import { createUser } from "../../../api/users";
import { createAssociation } from "../../../api/collegeincluded";
import { useAuth } from "../../auth/AuthProvider";

interface UserManagementProps {
  embedded?: boolean;
  headLeft?: ReactNode; 
}

export default function UserManagement({
  embedded = false,
  headLeft,
}: UserManagementProps) {
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
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
    colleges: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { authToken, user } = useAuth();
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
      colleges: [],
    });
  }
  function handleCreateFormChange(
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: any } }
  ) {
    if (e.target.name === "colleges") {
      setCreateForm((f) => ({
        ...f,
        colleges: Array.isArray(e.target.value) ? e.target.value : [],
      }));
    } else {
      setCreateForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }
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
      // Remove colleges from payload for user creation
      const { colleges, ...userPayload } = payload;
      console.log("Creating user with:", userPayload);
      const response = await createUser(userPayload, authToken);
      // Debug: log response
      console.log("Create user response:", response);
      if (response && response.error) {
        setError(response.error || "Unknown error");
        alert(response.error || "Unknown error");
        setSaving(false);
        return;
      }
      // Step 2: create associations synchronously
      const userId = response?.id;
      if (userId && Array.isArray(createForm.colleges)) {
        for (const collegeId of createForm.colleges) {
          try {
            await createAssociation(
              { college_id: collegeId, user_id: userId },
              authToken
            );
          } catch (err) {
            // Optionally handle error
            console.error("Failed to create association", err);
          }
        }
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
        colleges: [],
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
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg h-full">
        {/* Header: left area shows provided slot or default title (hidden when embedded) */}
        <div className="flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            {headLeft
              ? headLeft
              : !embedded && (
                  <h1 className="text-3xl font-bold">User Management</h1>
                )}
          </div>
          <button
            className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow"
            onClick={handleCreateUser}
          >
            + Create User
          </button>
        </div>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="flex-grow">
          <UserManagementTable
            key={refreshKey}
            page={page}
            setPage={setPage}
            setHasNext={setHasNext}
            setHasPrev={setHasPrev}
          />
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred, darkened background overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              style={{ pointerEvents: "auto" }}
            />
            {/* Modal content */}
            <div className="relative bg-white rounded-lg shadow-lg p-6 min-w-1/2 max-w-9/10 z-10">
              <button
                className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
                onClick={handleCloseCreateModal}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
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
        <div className="pb-8 px-8">
          <Pagination
            page={page}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      </div>
    </div>
  );
}
