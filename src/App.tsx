import { useAuth } from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import RoleContent from "./components/RoleContent";

import './globals.css';

export default function App() {
  const { authToken, handleLogin, handleLogout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {authToken && <Navbar />}
      <main className="flex-1 flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold">{}</h1>
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
