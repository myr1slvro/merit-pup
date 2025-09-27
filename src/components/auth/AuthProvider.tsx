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
  const [hydrating, setHydrating] = useState(true);
  const [userChecksum, setUserChecksum] = useState<string | null>(null);
  const logoutTimerRef = (window as any)._logoutTimerRef || { current: null };
  (window as any)._logoutTimerRef = logoutTimerRef;

  function sha256String(s: string) {
    // Light-weight hashing fallback; in production use SubtleCrypto.
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  }

  function computeUserChecksum(u: User | null) {
    if (!u) return null;
    // Pick stable fields only
    const stable = {
      id: u.id,
      email: u.email,
      role: (u as any).role,
      college_ids: (u as any).college_ids || [],
    };
    return sha256String(JSON.stringify(stable));
  }

  function scheduleAutoLogout(token: string) {
    try {
      const [, payload] = token.split(".");
      if (!payload) return;
      let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const json = JSON.parse(atob(b64));
      if (!json.exp) return;
      const expMs = json.exp * 1000;
      const now = Date.now();
      const fireAt = expMs - 30_000; // 30s before expiry
      const delay = fireAt - now;
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (delay > 0) {
        logoutTimerRef.current = setTimeout(() => {
          handleLogout();
        }, delay);
      } else {
        handleLogout();
      }
    } catch {
      /* ignore */
    }
  }
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
        localStorage.setItem("authToken", response.access_token);
        // Try to resolve user id from JWT and load profile
        const id = decodeJwtSub(response.access_token);
        if (id != null) {
          const userProfile = await getUserById(id, response.access_token);
          setUser(userProfile);
          setUserChecksum(computeUserChecksum(userProfile));
          scheduleAutoLogout(response.access_token);
          const roleToRoute: Record<string, string> = {
            "Technical Admin": "/technical-admin",
            "UTLDO Admin": "/utldo-admin",
            PIMEC: "/pimec",
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
      setUserChecksum(null);
      localStorage.removeItem("authToken");
      throw err;
    }
  }

  async function handleLogout() {
    setAuthToken(null);
    setUser(null);
    setUserChecksum(null);
    localStorage.removeItem("authToken");
    navigate("/", { replace: true });
  }

  // Persistence from refresh
  useEffect(() => {
    const stored = localStorage.getItem("authToken");
    if (!stored) {
      setHydrating(false);
      return;
    }

    // Basic exp check (not trusting only client side – server must still enforce)
    try {
      const [, payload] = stored.split(".");
      if (payload) {
        let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        const json = JSON.parse(atob(b64));
        if (json.exp && Date.now() / 1000 > json.exp) {
          localStorage.removeItem("authToken");
          setHydrating(false);
          return;
        }
      }
    } catch {
      // Malformed token; clear
      localStorage.removeItem("authToken");
      setHydrating(false);
      return;
    }

    setAuthToken(stored);
    const id = decodeJwtSub(stored);
    if (id != null) {
      getUserById(id, stored)
        .then((profile) => {
          setUser(profile);
          setUserChecksum(computeUserChecksum(profile));
          scheduleAutoLogout(stored);
          setHydrating(false);
        })
        .catch(() => {
          setAuthToken(null);
          setUser(null);
          setUserChecksum(null);
          localStorage.removeItem("authToken");
          setHydrating(false);
        });
    } else {
      setHydrating(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        handleLogin,
        handleLogout,
        // Expose hydrating if consumers need to block UI until ready
        // @ts-ignore optional consumer usage
        hydrating,
        // @ts-ignore expose checksum for optional integrity diagnostics
        userChecksum,
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
