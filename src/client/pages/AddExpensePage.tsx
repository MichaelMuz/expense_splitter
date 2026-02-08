/**
 * AddExpensePage - Create or edit an expense
 */

import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import {
  useExpense,
  useCreateExpense,
  useUpdateExpense,
} from '../hooks/useExpenses';
import { useGroup } from '../hooks/useGroups';
import type { CreateExpenseInput, UpdateExpenseInput, Expense } from '@/shared/schemas/expense';
import type { Group } from '@/shared/schemas/group';
import type { UseMutationResult } from '@tanstack/react-query';

// TODO: consolidate all loading states into shared lib component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

type ExpenseInput<E extends Expense | null> = E extends Expense ? UpdateExpenseInput : CreateExpenseInput;

function ExpenseFormView<E extends Expense | null>({ group, groupId, mutation, expense }: {
  group: Group;
  groupId: string;
  mutation: UseMutationResult<Expense, Error, ExpenseInput<E>>;
  expense: E;
}) {
  const navigate = useNavigate();

  const handleSubmit = (data: ExpenseInput<E>) => {
    mutation.mutate(data, {
      onSuccess: () => navigate(`/groups/${groupId}`),
    });
  };

  const handleCancel = () => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Back to {group.name}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Split expenses with {group.members?.length || 0} group members
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          {mutation.isError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {mutation.error?.message || `Failed to ${expense ? 'update' : 'create'} expense`}
            </div>
          )}
          <ExpenseForm
            members={group.members || []}
            initialData={expense ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={mutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

function CreateExpense({ groupId, group }: { groupId: string; group: Group }) {
  const createExpense = useCreateExpense(groupId);

  return <ExpenseFormView group={group} groupId={groupId} mutation={createExpense} expense={null} />;
}

function EditExpense({ groupId, expenseId, group }: { groupId: string; expenseId: string; group: Group }) {
  const { data: expense, isLoading: expenseLoading } = useExpense(groupId, expenseId);
  const updateExpense = useUpdateExpense(groupId, expenseId);

  if (expenseLoading) {
    return <LoadingScreen />;
  }

  if (!expense) {
    return <LoadingScreen />;
  }

  return <ExpenseFormView group={group} groupId={groupId} mutation={updateExpense} expense={expense} />;
}

export default function AddExpensePage() {
  const { groupId, expenseId } = useParams<{
    groupId: string;
    expenseId?: string;
  }>();
  const navigate = useNavigate();

  if (!groupId) {
    console.log('Expected a groupId');
    return <Navigate to="/groups" replace />;
  }

  const { data: group, isLoading: groupLoading } = useGroup(groupId);

  if (groupLoading) {
    return <LoadingScreen />;
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">Group not found</p>
          <button
            onClick={() => navigate('/groups')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return expenseId
    ? <EditExpense groupId={groupId} expenseId={expenseId} group={group} />
    : <CreateExpense groupId={groupId} group={group} />;
}
