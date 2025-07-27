import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FacultyRoleContent from "./components/faculty/facultyRoleContent";
import UserManagement from "./components/technical-admin/userManagement";
import EvaluatorDirectory from "./components/evaluator/evaluatorDirectory";
import UtldoUserAnalytics from "./components/utldo-admin/utldoUserAnalytics";
import React from "react";

// Placeholder for Evaluator role content
function EvaluatorRoleContent() {
  return (
    <div className="flex-1 flex w-full px-8 py-16">
      <EvaluatorDirectory />
    </div>
  );
}

// Placeholder for UTLDO Admin role content
function UtldoAdminRoleContent() {
  return (
    <div className="flex-1 flex w-full px-8 py-16">
      <UtldoUserAnalytics />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default dashboard for each role */}
      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={[
              "Faculty",
              "Evaluator",
              "UTLDO Admin",
              "Technical Admin",
            ]}
          >
            {/* You can redirect to a role-specific dashboard here if needed */}
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={["Faculty"]}>
            <FacultyRoleContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluator"
        element={
          <ProtectedRoute allowedRoles={["Evaluator"]}>
            <EvaluatorRoleContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utldo-admin"
        element={
          <ProtectedRoute allowedRoles={["UTLDO Admin"]}>
            <UtldoAdminRoleContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technical-admin"
        element={
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      {/* Add more routes as needed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
