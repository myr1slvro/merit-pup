import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FacultyRoleContent from "./components/faculty/facultyRoleContent";
import UserManagement from "./components/technical-admin/user-management/UserManagement";
import SubjectManagement from "./components/technical-admin/subject-management/SubjectManagement";
import CollegeManagement from "./components/technical-admin/college-management/CollegeManagement";
import PimecRoleContent from "./components/pimec/PimecRoleContent";
import PimecEvalPage from "./components/pimec/PimecEvalPage";
import UtldoEvaluationDirectory from "./components/utldo-admin/utldo-approval/UtldoEvaluationDirectory";
import UECApprovalPage from "./components/utldo-admin/utldo-approval/UECApprovalPage";
import UtldoUserAnalytics from "./components/utldo-admin/user-analytics/utldoUserAnalytics";
import CertificationPage from "./components/utldo-admin/certification/CertificationPage";
import SettingsPage from "./components/navigation/settings/SettingsPage";

import { UserRole } from "./types/user";

// Placeholder for UTLDO Admin role content
function UtldoAdminRoleContent() {
  return (
    <div className="flex-1 flex w-full px-8 py-16">
      <UtldoUserAnalytics />
    </div>
  );
}

export default function AppRoutes() {
  const { user } = useAuth();
  const roleToRoute: Record<UserRole, string> = {
    "Technical Admin": "/technical-admin",
    "UTLDO Admin": "/utldo-admin",
    PIMEC: "/pimec",
    Faculty: "/faculty",
  };
  return (
    <Routes>
      {/* Redirect / to highest authority role route */}
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
            <FacultyRoleContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pimec"
        element={
          <ProtectedRoute
            allowedRoles={["PIMEC", "UTLDO Admin", "Technical Admin"]}
          >
            <PimecRoleContent />
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
      <Route
        path="/utldo-admin"
        element={
          <ProtectedRoute allowedRoles={["UTLDO Admin", "Technical Admin"]}>
            <UtldoAdminRoleContent />
          </ProtectedRoute>
        }
      />
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
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["UTLDO Admin", "Technical Admin", "PIMEC", "Faculty"]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      {/* Add more routes as needed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
