/**
 * React Query hooks for settlement operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSettlementInput } from '../../shared/schemas/settlement';
import { settlementResponseSchema } from '../../shared/schemas/settlement';

const API_BASE_URL = '/api';

import { TOKEN_KEY } from '../lib/auth';

function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
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

/**
 * Create a new settlement (record payment)
 */
export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSettlementInput) =>
      createSettlement(groupId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}
