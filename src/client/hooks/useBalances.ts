import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// TODO: add a zod schema for this in shared/schemas like the other endpoints
export interface BalanceDetail {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number; // in cents
}

export interface MemberBalance {
  member: { id: string; name: string };
  balance: number; // in cents (positive = owed to them, negative = they owe)
}

export interface BalancesResponse {
  balances: BalanceDetail[];
  summary: MemberBalance[];
}

export function useBalances(groupId: string) {
  return useQuery({
    queryKey: ['balances', groupId],
    queryFn: async () => {
      const response = await api.get<BalancesResponse>(`/groups/${groupId}/balances`);
      return response.data;
    },
    enabled: !!groupId,
    refetchOnMount: true,
  });
}
