import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { BsFillEyeFill, BsFillEyeSlashFill } from "react-icons/bs";

export default function LoginForm() {
  const { handleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleFormLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await handleLogin(email, password);
      console.log("Login successful for email:", email);
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
    <div className="flex-1 flex w-full items-center justify-center font-[Arial]">
      <div className="flex w-1/2 bg-white rounded-3xl shadow-xl overflow-hidden p-12 space-x-12">
        {/* Left: Form */}
        <div className="flex flex-col w-1/2 justify-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-meritGray">
              Enter your credentials to access your account
            </p>
            <hr className="border-t border-meritGray opacity-50" />
          </div>
          <form onSubmit={handleFormLogin} className="flex flex-col gap-2 py-4">
            <label className="text-sm font-medium">Email</label>
            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-meritGray rounded-lg px-4 py-2 placeholder:text-sm"
              required
            />
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-meritGray rounded-lg px-4 py-2 w-full placeholder:text-sm"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-meritGray"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <BsFillEyeSlashFill className="w-5 h-5" />
                ) : (
                  <BsFillEyeFill className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs mt-1 mb-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-meritRed" />
                Remember Me
              </label>
              <button type="button" className="text-meritRed hover:underline">
                Forgot Password?
              </button>
            </div>
            {error && (
              <div className="text-meritRed text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="bg-linear-to-r from-meritRed to-meritDarkRed rounded-md p-2 text-white mt-2 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
        {/* Right: Image */}
        <div className="w-1/2 flex items-center justify-center">
          <img
            src="/pup.jpg"
            alt="Campus"
            className="rounded-2xl object-cover w-full h-[500px]"
          />
        </div>
      </div>
    </div>
  );
}
