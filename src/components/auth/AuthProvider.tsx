import { getUser, login } from "../../api/auth";
import { User } from "../../types/user";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContext = {
  authToken?: string | null;
  user?: User | null;
  roles?: User["roles"] | null;
  handleLogin: (id: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

type AuthProviderProps = PropsWithChildren;

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authToken, setAuthToken] = useState<string | null>();
  const [user, setUser] = useState<User | null>();
  const roles = user?.roles ?? null;

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

  async function handleLogin(id: string, password: string) {
    try {
      const response = await login(id, password);
      if (Array.isArray(response)) {
        const { authToken, user } = response[1];
        setAuthToken(authToken);
        setUser(user);
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
  }

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        roles,
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
