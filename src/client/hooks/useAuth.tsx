/**
 * Auth context and hook for managing authentication state
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
  setToken,
  getToken,
  removeToken,
  type User,
  type AuthResponse,
} from '../lib/auth';
import type { LoginInput, SignupInput } from '@/shared/schemas/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  signup: (credentials: SignupInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Fetch current user if token exists
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        return null;
      }
      const response = await api.get<{ user: User }>('/auth/me');
      return response.data.user;
    },
    enabled: !!getToken(),
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (credentials: SignupInput) => {
      const response = await api.post<AuthResponse>(
        '/auth/signup',
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const login = async (credentials: LoginInput) => {
    await loginMutation.mutateAsync(credentials);
  };

  const signup = async (credentials: SignupInput) => {
    await signupMutation.mutateAsync(credentials);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    queryClient.clear();
    window.location.href = '/login';
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
