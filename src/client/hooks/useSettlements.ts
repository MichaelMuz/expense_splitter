import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { CreateSettlementInput } from '../../shared/schemas/settlement';
import { settlementResponseSchema } from '../../shared/schemas/settlement';

export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSettlementInput) => {
      const response = await api.post(`/groups/${groupId}/settlements`, input);
      return settlementResponseSchema.parse(response.data).settlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}
