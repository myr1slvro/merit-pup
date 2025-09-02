import React, { useState, useEffect } from "react";
import { getAllColleges } from "../../api/college";

// Helper to get max birthdate (18 years before today)
function getMaxBirthdate() {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18);
  // Format as yyyy-mm-dd
  return today.toISOString().split("T")[0];
}

type UserCreationFormProps = {
  form: {
    role?: string;
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    staff_id?: string;
    email?: string;
    phone_number?: string;
    password?: string;
    birth_date?: string;
    colleges?: number[];
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
};

export default function UserCreationForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
}: UserCreationFormProps) {
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);

  // Fetch all colleges on mount
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
    const selected = Array.isArray(form.colleges) ? form.colleges : [];
    let newValue: number[];
    if (selected.includes(id)) {
      newValue = selected.filter((c) => c !== id);
    } else {
      newValue = [...selected, id];
    }
    // Always pass an array of numbers
    onChange({
      target: { name: "colleges", value: newValue },
    } as any);
  }

  // Regex for phone: 10-15 digits, may start with +
  const phonePattern = /^\+?\d{10,15}$/;
  // Regex for password: 8+ chars, 1 uppercase, 1 number, 1 special char
  const passwordPattern =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  function handlePhoneBlur() {
    if (form.phone_number && !phonePattern.test(form.phone_number)) {
      setPhoneError(
        "Phone number must be 10 to 15 digits, numbers only, may start with +."
      );
    } else {
      setPhoneError("");
    }
  }

  function handlePasswordBlur() {
    if (form.password && !passwordPattern.test(form.password)) {
      setPasswordError(
        "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character."
      );
    } else {
      setPasswordError("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (form.phone_number && !phonePattern.test(form.phone_number)) {
      setPhoneError(
        "Phone number must be 10 to 15 digits, numbers only, may start with +."
      );
      valid = false;
    }
    if (form.password && !passwordPattern.test(form.password)) {
      setPasswordError(
        "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character."
      );
      valid = false;
    }
    if (!valid) return;
    onSubmit();
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
                  checked={!!(form.colleges || []).includes(college.id)}
                  onChange={() => handleCollegeCheck(college.id)}
                  className="accent-meritRed"
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
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Role</span>
          <select
            name="role"
            value={form.role ?? ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            required
          >
            <option value="">Select Role</option>
            <option value="Faculty">Faculty</option>
            <option value="Evaluator">Evaluator</option>
            <option value="UTLDO Admin">UTLDO Admin</option>
            <option value="Technical Admin">Technical Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Last Name</span>
          <input
            type="text"
            name="last_name"
            value={form.last_name ?? ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-500">First Name</span>
          <input
            type="text"
            name="first_name"
            value={form.first_name ?? ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-500">Middle Name</span>
          <input
            type="text"
            name="middle_name"
            value={form.middle_name ?? ""}
            onChange={onChange}
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
            value={form.staff_id ?? ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-500">Email</span>
          <input
            type="email"
            name="email"
            value={form.email ?? ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-500">Birthdate</span>
          <input
            type="date"
            name="birth_date"
            value={form.birth_date ?? ""}
            onChange={onChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            max={getMaxBirthdate()}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Phone</span>
          <input
            type="tel"
            name="phone_number"
            value={form.phone_number ?? ""}
            onChange={onChange}
            onBlur={handlePhoneBlur}
            className="mt-1 block w-full border rounded px-2 py-1"
            inputMode="tel"
            required
          />
          {phoneError && (
            <div className="text-xs text-red-600 mt-1">{phoneError}</div>
          )}
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-500">Password</span>
          <input
            type="password"
            name="password"
            value={form.password ?? ""}
            onChange={onChange}
            onBlur={handlePasswordBlur}
            className="mt-1 block w-full border rounded px-2 py-1"
            required
            minLength={8}
          />
          {passwordError && (
            <div className="text-xs text-red-600 mt-1">{passwordError}</div>
          )}
        </div>
      </div>
      <div className="flex flex-row-reverse gap-2 mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold"
          disabled={saving}
        >
          {saving ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-meritGray font-semibold"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
