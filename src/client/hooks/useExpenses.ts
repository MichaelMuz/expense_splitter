/**
 * React Query hooks for expense CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../../shared/schemas/expense';

// API response types
export interface ExpensePayer {
  groupMemberId: string;
  groupMember: {
    id: string;
    name: string;
    userId: string | null;
  };
  splitMethod: 'EVEN' | 'FIXED' | 'PERCENTAGE';
  splitValue: number | null;
  calculatedAmount: number;
}

export interface ExpenseOwer {
  groupMemberId: string;
  groupMember: {
    id: string;
    name: string;
    userId: string | null;
  };
  splitMethod: 'EVEN' | 'FIXED' | 'PERCENTAGE';
  splitValue: number | null;
  calculatedAmount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  name: string;
  description: string;
  baseAmount: number;
  taxAmount: number | null;
  taxType: 'FIXED' | 'PERCENTAGE' | null;
  tipAmount: number | null;
  tipType: 'FIXED' | 'PERCENTAGE' | null;
  totalAmount: number;
  createdAt: string;
  payers: ExpensePayer[];
  owers: ExpenseOwer[];
}

const API_BASE_URL = '/api';

import { TOKEN_KEY } from '../lib/auth';

// Helper to get auth token (assumes it's stored in localStorage)
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// API call functions
async function fetchExpenses(groupId: string): Promise<Expense[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }

  const data = await response.json();
  return data.expenses;
}

async function fetchExpense(
  groupId: string,
  expenseId: string
): Promise<Expense> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch expense');
  }

  const data = await response.json();
  return data.expense;
}

async function createExpense(
  groupId: string,
  input: CreateExpenseInput
): Promise<Expense> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create expense');
  }

  const data = await response.json();
  return data.expense;
}

async function updateExpense(
  groupId: string,
  expenseId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update expense');
  }

  const data = await response.json();
  return data.expense;
}

async function deleteExpense(
  groupId: string,
  expenseId: string
): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete expense');
  }
}

// React Query hooks

/**
 * Fetch all expenses for a group
 */
export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => fetchExpenses(groupId),
    enabled: !!groupId,
    refetchOnMount: true,
  });
}

/**
 * Fetch a single expense
 */
export function useExpense(
  groupId: string,
  expenseId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['expenses', groupId, expenseId],
    queryFn: () => fetchExpense(groupId, expenseId),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!groupId && !!expenseId,
    refetchOnMount: true,
  });
}

/**
 * Create a new expense
 */
export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(groupId, input),
    onSuccess: () => {
      // Invalidate and refetch expenses and balances
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}

/**
 * Update an expense
 */
export function useUpdateExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateExpenseInput) =>
      updateExpense(groupId, expenseId, input),
    onSuccess: () => {
      // Invalidate and refetch expenses and balances
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({
        queryKey: ['expenses', groupId, expenseId],
      });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}

/**
 * Delete an expense
 */
export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(groupId, expenseId),
    onSuccess: () => {
      // Invalidate and refetch expenses and balances
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
}
