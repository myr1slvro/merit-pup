import React, { useState, useEffect } from "react";
import { getAllColleges } from "../../../api/college";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// Helper to get max birthdate (18 years before today)
function getMaxBirthdate() {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18);
  // Format as yyyy-mm-dd
  return today.toISOString().split("T")[0];
}

// Helper to get min birthdate (61 years before today)
function getMinBirthdate() {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 61);
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

  // Auto-select and lock all colleges for Technical Admin and UTLDO Admin
  useEffect(() => {
    const roleNorm = (form.role || "").toLowerCase();
    const isAdminRole =
      roleNorm === "technical admin" || roleNorm === "utldo admin";

    if (isAdminRole && colleges.length > 0) {
      // Select all colleges
      const allCollegeIds = colleges.map((c) => c.id);
      const currentSelection = form.colleges || [];

      // Only update if not already all selected
      if (
        currentSelection.length !== allCollegeIds.length ||
        !allCollegeIds.every((id) => currentSelection.includes(id))
      ) {
        onChange({
          target: { name: "colleges", value: allCollegeIds },
        } as any);
      }
    }
  }, [form.role, colleges, form.colleges, onChange]);

  function handleCollegeCheck(id: number) {
    // Prevent changing colleges for admin roles
    const roleNorm = (form.role || "").toLowerCase();
    const isAdminRole =
      roleNorm === "technical admin" || roleNorm === "utldo admin";

    if (isAdminRole) {
      return; // Don't allow changes
    }

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

  function handlePhoneChange(value: string) {
    // PhoneInput provides the value with country code
    onChange({
      target: { name: "phone_number", value },
    } as any);
    // Clear error when typing
    if (phoneError) setPhoneError("");
  }

  function handlePhoneBlur() {
    // Validate phone number (basic check - at least 10 digits)
    const digitsOnly = (form.phone_number || "").replace(/\D/g, "");
    if (form.phone_number && digitsOnly.length < 10) {
      setPhoneError("Phone number must have at least 10 digits.");
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

    // Validate phone number
    const digitsOnly = (form.phone_number || "").replace(/\D/g, "");
    if (form.phone_number && digitsOnly.length < 10) {
      setPhoneError("Phone number must have at least 10 digits.");
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
  // Clamp birthdate to min/max if out of range
  function handleBirthdateChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    const min = getMinBirthdate();
    const max = getMaxBirthdate();
    if (value < min) value = min;
    if (value > max) value = max;
    onChange({
      ...e,
      target: { ...e.target, value, name: "birth_date" },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <span className="text-xs text-gray-500">
          Colleges
          {((form.role || "").toLowerCase() === "technical admin" ||
            (form.role || "").toLowerCase() === "utldo admin") && (
            <span className="ml-2 text-xs text-immsRed font-semibold">
              (All colleges auto-selected for this role)
            </span>
          )}
        </span>
        {collegesLoading ? (
          <div className="text-sm text-gray-400">Loading colleges...</div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-1">
            {colleges.map((college) => {
              const roleNorm = (form.role || "").toLowerCase();
              const isLocked =
                roleNorm === "technical admin" || roleNorm === "utldo admin";

              return (
                <label
                  key={college.id}
                  className={`flex items-center gap-1 border rounded px-2 py-1 ${
                    isLocked
                      ? "bg-gray-100 cursor-not-allowed opacity-75"
                      : "cursor-pointer hover:border-immsRed"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!(form.colleges || []).includes(college.id)}
                    onChange={() => handleCollegeCheck(college.id)}
                    disabled={isLocked}
                    className="accent-immsRed"
                  />
                  <span className="text-sm">
                    {college.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({college.abbreviation})
                    </span>
                  </span>
                </label>
              );
            })}
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
            <option value="PIMEC">PIMEC</option>
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
            onChange={handleBirthdateChange}
            className="mt-1 block w-full border rounded px-2 py-1"
            min={getMinBirthdate()}
            max={getMaxBirthdate()}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Phone</span>
          <PhoneInput
            country={"ph"}
            value={form.phone_number ?? ""}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            inputClass="!w-full"
            containerClass="mt-1"
            inputStyle={{
              width: "100%",
              height: "36px",
              borderRadius: "4px",
            }}
            enableSearch
            disableSearchIcon
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
          className="px-4 py-2 bg-immsRed text-white rounded hover:bg-immsDarkRed font-semibold"
          disabled={saving}
        >
          {saving ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-immsGray font-semibold"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
