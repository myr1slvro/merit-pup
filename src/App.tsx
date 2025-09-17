import { useAuth } from "./components/auth/AuthProvider";
import Navbar from "./components/navigation/Navbar";
import AppRoutes from "./AppRoutes";
import LoginForm from "./components/navigation/LoginForm";
import "./globals.css";

import "./globals.css";

export default function App() {
  const ctx: any = useAuth();
  const { authToken, hydrating } = ctx;

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Blurred background image */}
      <div
        className="fixed inset-0 -z-10 bg-[url(/pup.jpg)] bg-cover bg-center filter grayscale opacity-35"
        aria-hidden="true"
      />
      <Navbar />
      <main className="flex-1 flex flex-col items-stretch">
        {hydrating ? (
          <div className="flex flex-1 items-center justify-center p-8 animate-pulse text-sm text-gray-600">
            Restoring session...
          </div>
        ) : authToken ? (
          <AppRoutes />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <LoginForm />
          </div>
        )}
      </main>
    </div>
  );
}
