import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function LoginForm() {
  const { handleLogin } = useAuth();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFormLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // @ts-ignore
      await handleLogin(id, password);
      console.log("Login successful for ID:", id);
    } catch (err: any) {
      let message = "Login failed";
      if (err instanceof Error && err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleFormLogin}
      className="flex flex-col gap-4 bg-white bg-opacity-80 p-8 rounded-lg shadow-md min-w-[300px]"
    >
      <h2 className="text-xl font-bold text-center">Login</h2>
      <input
        type="text"
        placeholder="User ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
        required
      />
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="rounded-lg px-4 py-2 bg-meritRed text-white"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
