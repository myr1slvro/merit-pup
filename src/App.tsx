import { useAuth } from "./components/auth/AuthProvider";
import Navbar from "./components/navigation/Navbar";
import AppRoutes from "./AppRoutes";
import LoginForm from "./components/navigation/LoginForm";
import "./globals.css";

import "./globals.css";

export default function App() {
  const { authToken, handleLogin } = useAuth();

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Blurred background image */}
      <div
        className="fixed inset-0 -z-10 bg-[url(/pup.jpg)] bg-cover bg-center filter grayscale opacity-35"
        aria-hidden="true"
      />
      {authToken ? (
        <>
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center">
            <AppRoutes />
          </main>
        </>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center">
          <LoginForm />
        </main>
      )}
    </div>
  );
}
