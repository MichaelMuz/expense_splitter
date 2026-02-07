/**
 * React Query hooks for settlement operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSettlementInput } from '../../shared/schemas/settlement';
import {
  settlementResponseSchema,
  settlementsResponseSchema,
} from '../../shared/schemas/settlement';

// Re-export the Settlement type from settlementsResponseSchema
type SettlementsArray = ReturnType<typeof settlementsResponseSchema.parse>['settlements'];
export type Settlement = SettlementsArray[number];

const API_BASE_URL = '/api';

import { TOKEN_KEY } from '../lib/auth';

// Helper to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// API call functions
async function fetchSettlements(groupId: string): Promise<Settlement[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/settlements`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch settlements');
  }

  const data = await response.json();
  const validated = settlementsResponseSchema.parse(data);
  return validated.settlements;
}

async function createSettlement(
  groupId: string,
  input: CreateSettlementInput
): Promise<ReturnType<typeof settlementResponseSchema.parse>['settlement']> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/settlements`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create settlement');
  }

  const data = await response.json();
  const validated = settlementResponseSchema.parse(data);
  return validated.settlement;
}

async function deleteSettlement(
  groupId: string,
  settlementId: string
): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/settlements/${settlementId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete settlement');
  }
}

// React Query hooks

/**
 * Fetch all settlements for a group
 */
export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: () => fetchSettlements(groupId),
    enabled: !!groupId,
    refetchOnMount: true,
  });
}

/**
 * Create a new settlement (record payment)
 */
export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSettlementInput) =>
      createSettlement(groupId, input),
    onSuccess: () => {
      // Invalidate and refetch settlements and balances
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}

/**
 * Delete a settlement
 */
export function useDeleteSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementId: string) =>
      deleteSettlement(groupId, settlementId),
    onSuccess: () => {
      // Invalidate and refetch settlements and balances
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}
