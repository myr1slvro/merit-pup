import { getUser, login } from "../../api/auth";
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
  const [authToken, setAuthToken] = useState<string | null>();
  const [user, setUser] = useState<User | null>();
  // ...existing code...
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await getUser();
        const { authToken, user } = response[1];
        setAuthToken(authToken);
        setUser(user);
      } catch {
        setAuthToken(null);
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  async function handleLogin(email: string, password: string) {
    try {
      const response = await login(email, password);
      if (Array.isArray(response)) {
        const { authToken, user } = response[1];
        setAuthToken(authToken);
        setUser(user);
        // Redirect to appropriate role route
        const roleToRoute = {
          "Technical Admin": "/technical-admin",
          "UTLDO Admin": "/utldo-admin",
          Evaluator: "/evaluator",
          Faculty: "/faculty",
        };
        if (user.role && roleToRoute[user.role]) {
          navigate(roleToRoute[user.role], { replace: true });
        }
      } else if (
        response &&
        typeof response === "object" &&
        "error" in response
      ) {
        throw new Error((response as any).error);
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
