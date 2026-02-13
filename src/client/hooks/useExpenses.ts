import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { CreateExpenseInput, UpdateExpenseInput } from '../../shared/schemas/expense';
import { expenseResponseSchema, expensesResponseSchema, type Expense } from '../../shared/schemas/expense';

export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: ['expenses', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/expenses`);
      return expensesResponseSchema.parse(response.data).expenses;
    },
    enabled: !!groupId,
    refetchOnMount: true,
  });
}

export function useExpense(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: ['expenses', groupId, expenseId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/expenses/${expenseId}`);
      return expenseResponseSchema.parse(response.data).expense;
    },
    enabled: !!groupId && !!expenseId,
    refetchOnMount: true,
  });
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const response = await api.post(`/groups/${groupId}/expenses`, input);
      return expenseResponseSchema.parse(response.data).expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}

export function useUpdateExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      const response = await api.patch(`/groups/${groupId}/expenses/${expenseId}`, input);
      return expenseResponseSchema.parse(response.data).expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => api.delete(`/groups/${groupId}/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}
