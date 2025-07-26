import { useAuth } from "./components/navigation/AuthProvider";
import Navbar from "./components/navigation/Navbar";
import RoleContent from "./components/navigation/RoleContent";

import './globals.css';

export default function App() {
  const { authToken, handleLogin, } = useAuth();

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Blurred background image */}
      <div
        className="fixed inset-0 -z-10 bg-[url(/pup.jpg)] bg-cover bg-center filter grayscale opacity-35"
        aria-hidden="true"
      />
      {authToken && <Navbar />}
      <main className="flex-1 flex flex-col items-center justify-center gap-6">
        {authToken ? (
          <>
            <RoleContent />
          </>
        ) : (
          <button onClick={handleLogin} className="rounded-lg px-4 py-2 bg-meritRed text-white">Login</button>
        )}
      </main>
    </div>
  );
}
