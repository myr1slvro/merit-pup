import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { updateUser, changePassword } from "../../../api/users";

export default function SettingsPage() {
  const { user, authToken } = useAuth();

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<boolean | null>(null);

  // Password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    if (!user || !authToken || typeof user.id !== "number")
      return setProfileMessage("Unable to save profile.");
    setSavingProfile(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
      };
      await updateUser(user.id as number, payload, authToken);
      setProfileMessage("Profile updated successfully.");
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileMessage("Failed to update profile.");
      setProfileSuccess(false);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (!user || !authToken || typeof user.id !== "number")
      return setPasswordMessage("Unable to change password.");
    if (!oldPassword || !newPassword)
      return setPasswordMessage("Please fill all fields.");
    if (newPassword !== confirmPassword)
      return setPasswordMessage("New passwords do not match.");
    if (newPassword.length < 8)
      return setPasswordMessage("New password must be at least 8 characters.");

    setChangingPassword(true);
    try {
      const res = await changePassword(
        user.id as number,
        oldPassword,
        newPassword,
        authToken
      );
      // API typically returns success boolean or object; be permissive
      if (res && (res.success || res.ok || !res.error)) {
        setPasswordMessage("Password changed successfully.");
        setPasswordSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else if (res && res.message) {
        setPasswordMessage(res.message);
        setPasswordSuccess(false);
      } else {
        setPasswordMessage("Failed to change password.");
        setPasswordSuccess(false);
      }
    } catch (err: any) {
      setPasswordMessage("Failed to change password.");
      setPasswordSuccess(false);
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  aria-label="First name"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-immsRed"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  aria-label="Last name"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-immsRed"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                aria-label="Email"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-immsRed"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll use this email for notifications.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              {profileMessage && (
                <div
                  className={`text-sm ${
                    profileSuccess ? "text-green-600" : "text-immsRed"
                  }`}
                >
                  {profileMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 bg-immsRed text-white rounded-md hover:bg-immsDarkRed disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current password
              </label>
              <input
                type="password"
                aria-label="Current password"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-immsRed"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  type="password"
                  aria-label="New password"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-immsRed"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters recommended.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <input
                  type="password"
                  aria-label="Confirm new password"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-immsRed"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {passwordMessage && (
                <div
                  className={`text-sm ${
                    passwordSuccess ? "text-green-600" : "text-immsRed"
                  }`}
                >
                  {passwordMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-immsRed text-white rounded-md hover:bg-immsDarkRed disabled:opacity-60"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
