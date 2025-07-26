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
  currentUser?: User | null;
  role?: User["role"] | null;
  handleLogin: (id: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

type AuthProviderProps = PropsWithChildren;

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authToken, setAuthToken] = useState<string | null>();
  const [currentUser, setCurrentUser] = useState<User | null>();
  const role = currentUser?.role ?? null;

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await getUser();
        const { authToken, user } = response[1];
        setAuthToken(authToken);
        setCurrentUser(user);
      } catch {
        setAuthToken(null);
        setCurrentUser(null);
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
        setCurrentUser(user);
      } else if (
        response &&
        typeof response === "object" &&
        "error" in response
      ) {
        throw new Error((response as any).error);
      }
    } catch (err) {
      setAuthToken(null);
      setCurrentUser(null);
      throw err;
    }
  }

  async function handleLogout() {
    setAuthToken(null);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        authToken,
        currentUser,
        role,
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
