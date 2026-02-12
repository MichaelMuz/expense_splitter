/**
 * React Query hooks for balance calculations
 */

import { useQuery } from '@tanstack/react-query';

// API response types
export interface BalanceDetail {
  from: {
    id: string;
    name: string;
  };
  to: {
    id: string;
    name: string;
  };
  amount: number; // in cents
}

export interface MemberBalance {
  member: {
    id: string;
    name: string;
  };
  balance: number; // in cents (positive = owed to them, negative = they owe)
}

export interface BalancesResponse {
  balances: BalanceDetail[];
  summary: MemberBalance[];
}

const API_BASE_URL = '/api';

import { TOKEN_KEY } from '../lib/auth';

// Helper to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// API call function
async function fetchBalances(groupId: string): Promise<BalancesResponse> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch balances');
  }

  return response.json();
}

// React Query hooks

/**
 * Fetch balances for a group
 * Refetches on mount to ensure latest data
 */
export function useBalances(groupId: string) {
  return useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => fetchBalances(groupId),
    enabled: !!groupId,
    refetchOnMount: true,
  });
}
