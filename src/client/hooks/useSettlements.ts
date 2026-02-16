import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { CreateSettlementInput } from '../../shared/schemas/settlement';
import { settlementResponseSchema, settlementsResponseSchema } from '../../shared/schemas/settlement';

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/settlements`);
      return settlementsResponseSchema.parse(response.data).settlements;
    },
    enabled: !!groupId,
    refetchOnMount: true,
  });
}

export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSettlementInput) => {
      const response = await api.post(`/groups/${groupId}/settlements`, input);
      return settlementResponseSchema.parse(response.data).settlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: [groupId] });
    },
  });
}

export function useDeleteSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementId: string) => api.delete(`/groups/${groupId}/settlements/${settlementId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: [groupId] });
    },
  });
}
