import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import { FacultyPage, PimecPage, UserAnalyticsPage } from "./pages";

// Feature components (these could also be moved to pages if needed)
import PimecEvalPage from "./components/pimec/PimecEvalPage";
import UtldoEvaluationDirectory from "./components/utldo-admin/utldo-approval/UtldoEvaluationDirectory";
import UECApprovalPage from "./components/utldo-admin/utldo-approval/UECApprovalPage";
import CertificationPage from "./components/utldo-admin/certification/CertificationPage";
import UserManagement from "./components/technical-admin/user-management/UserManagement";
import SubjectManagement from "./components/technical-admin/subject-management/SubjectManagement";
import CollegeManagement from "./components/technical-admin/college-management/CollegeManagement";
import SettingsPage from "./components/navigation/settings/SettingsPage";

import { UserRole } from "./types/user";

export default function AppRoutes() {
  const { user } = useAuth();

  const roleToRoute: Record<UserRole, string> = {
    "Technical Admin": "/technical-admin",
    "UTLDO Admin": "/user-analytics",
    PIMEC: "/pimec",
    Faculty: "/faculty",
  };

  return (
    <Routes>
      {/* Redirect / to role-based default route */}
      <Route
        path="/"
        element={
          user && user.role ? (
            <Navigate to={roleToRoute[user.role]} replace />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <h1 className="text-3xl font-bold mb-4">No role assigned</h1>
              <p className="text-lg text-gray-700">
                Contact your administrator.
              </p>
            </div>
          )
        }
      />

      {/* Faculty */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Faculty",
              "PIMEC",
              "UTLDO Admin",
              "Technical Admin",
            ]}
          >
            <FacultyPage />
          </ProtectedRoute>
        }
      />

      {/* PIMEC */}
      <Route
        path="/pimec"
        element={
          <ProtectedRoute
            allowedRoles={["PIMEC", "UTLDO Admin", "Technical Admin"]}
          >
            <PimecPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pimec/evaluate/:id"
        element={
          <ProtectedRoute
            allowedRoles={["PIMEC", "UTLDO Admin", "Technical Admin"]}
          >
            <PimecEvalPage />
          </ProtectedRoute>
        }
      />

      {/* User Analytics - accessible by PIMEC, UTLDO Admin, Technical Admin */}
      <Route
        path="/user-analytics"
        element={
          <ProtectedRoute
            allowedRoles={["PIMEC", "UTLDO Admin", "Technical Admin"]}
          >
            <UserAnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* UTLDO Office */}
      <Route
        path="/utldo/approval"
        element={
          <ProtectedRoute allowedRoles={["UTLDO Admin", "Technical Admin"]}>
            <UtldoEvaluationDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utldo/approval/:id"
        element={
          <ProtectedRoute allowedRoles={["UTLDO Admin", "Technical Admin"]}>
            <UECApprovalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utldo/certification"
        element={
          <ProtectedRoute allowedRoles={["UTLDO Admin", "Technical Admin"]}>
            <CertificationPage />
          </ProtectedRoute>
        }
      />

      {/* Technical Admin */}
      <Route
        path="/technical-admin"
        element={
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <Navigate to="/technical-admin/users" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technical-admin/users"
        element={
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technical-admin/colleges"
        element={
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <CollegeManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technical-admin/subjects"
        element={
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <SubjectManagement />
          </ProtectedRoute>
        }
      />

      {/* Settings - all roles */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Faculty",
              "PIMEC",
              "UTLDO Admin",
              "Technical Admin",
            ]}
          >
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
