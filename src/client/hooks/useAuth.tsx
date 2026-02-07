/**
 * Auth context and hook for managing authentication state
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
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
  loginMutation: UseMutationResult<AuthResponse, Error, LoginInput, unknown>;
  signupMutation: UseMutationResult<AuthResponse, Error, SignupInput, unknown>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const queryKey = ['auth', 'me']

  // Fetch current user if token exists
  const { data: user = null, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        return null;
      }
      const response = await api.get<{ user: User }>('/auth/me');
      return response.data.user;
    },
    retry: false,
  });

  // Store the user in the query cache on login/signup as source of truth
  const onSuccess = (data: AuthResponse) => {
    setToken(data.token);
    queryClient.setQueryData(queryKey, data.user);
  };
  // Hit login endpoint and update the state cache
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess,
  });
  // Hit signup endpoint and update the state cache
  const signupMutation = useMutation({
    mutationFn: async (credentials: SignupInput) => {
      const response = await api.post<AuthResponse>('/auth/signup', credentials);
      return response.data;
    },
    onSuccess,
  });

  const logout = () => {
    removeToken();
    queryClient.clear();
    window.location.href = '/login';
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    signupMutation,
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
