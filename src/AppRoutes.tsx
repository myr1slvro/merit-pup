import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FacultyRoleContent from "./components/faculty/facultyRoleContent";
import ManagementSwitcher from "./components/technical-admin/ManagementSwitcher";
import EvaluatorRoleContent from "./components/evaluator/evaluatorRoleContent";
import EvaluatorEvaluatePage from "./components/evaluator/EvaluatorEvaluatePage";
import UtldoUserAnalytics from "./components/utldo-admin/utldoUserAnalytics";
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
    Evaluator: "/evaluator",
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
              "Evaluator",
              "UTLDO Admin",
              "Technical Admin",
            ]}
          >
            <FacultyRoleContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluator"
        element={
          <ProtectedRoute
            allowedRoles={["Evaluator", "UTLDO Admin", "Technical Admin"]}
          >
            <EvaluatorRoleContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluator/evaluate/:id"
        element={
          <ProtectedRoute
            allowedRoles={["Evaluator", "UTLDO Admin", "Technical Admin"]}
          >
            <EvaluatorEvaluatePage />
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
            <ManagementSwitcher />
          </ProtectedRoute>
        }
      />
      {/* Add more routes as needed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
