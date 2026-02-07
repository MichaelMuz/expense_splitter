/**
 * Authentication library for JWT token management
 */

export const TOKEN_KEY = 'authToken';

// TODO: Move User and AuthResponse interfaces to src/shared/schemas/auth.ts
// These types should be shared between frontend and backend for type safety
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Store JWT token in localStorage
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
