import { login } from "../../api/auth";
import { getUserById } from "../../api/users";
import { User } from "../../types/user";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

type AuthContext = {
  authToken?: string | null;
  user?: User | null;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

type AuthProviderProps = PropsWithChildren;

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  function decodeJwtSub(token: string): number | null {
    try {
      const [, payload] = token.split(".");
      if (!payload) return null;
  let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const json = JSON.parse(atob(b64));
      const sub = json.sub ?? json.identity ?? json.user_id;
      const id = typeof sub === "string" ? parseInt(sub, 10) : sub;
      return Number.isFinite(id) ? (id as number) : null;
    } catch {
      return null;
    }
  }

  async function handleLogin(email: string, password: string) {
    try {
      const response = await login(email, password);
      if (response && response.access_token) {
        setAuthToken(response.access_token);
        // Try to resolve user id from JWT and load profile
        const id = decodeJwtSub(response.access_token);
        if (id != null) {
          const userProfile = await getUserById(id, response.access_token);
          setUser(userProfile);
          const roleToRoute: Record<string, string> = {
            "Technical Admin": "/technical-admin",
            "UTLDO Admin": "/utldo-admin",
            Evaluator: "/evaluator",
            Faculty: "/faculty",
          };
          if (userProfile?.role && roleToRoute[userProfile.role]) {
            navigate(roleToRoute[userProfile.role], { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          // Fallback if token can't be decoded
          setUser(null);
          navigate("/", { replace: true });
        }
      } else if (response && response.error) {
        throw new Error(response.error);
      } else if (response && response.error) {
        throw new Error(response.error);
      }
    } catch (err) {
      setAuthToken(null);
      setUser(null);
      throw err;
    }
  }

  async function handleLogout() {
    setAuthToken(null);
    setUser(null);
    navigate("/", { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used inside of a AuthProvider");
  }

  return context;
}
