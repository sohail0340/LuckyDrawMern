import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, userApi, type ApiUser } from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { identifier: string; name?: string; password: string; referralCode?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cld_token"));
  const [loading, setLoading] = useState(!!localStorage.getItem("cld_token"));

  const refreshUser = useCallback(async () => {
    try {
      const u = await userApi.me();
      setUser(u);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("cld_token");
    }
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      refreshUser().finally(() => setLoading(false));
    }
  }, [token, refreshUser]);

  const login = async (identifier: string, password: string) => {
    const { token: t, user: u } = await authApi.login({ identifier, password });
    localStorage.setItem("cld_token", t);
    setToken(t);
    setUser(u);
  };

  const register = async (data: { identifier: string; name?: string; password: string; referralCode?: string }) => {
    const { token: t, user: u } = await authApi.register(data);
    localStorage.setItem("cld_token", t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("cld_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

