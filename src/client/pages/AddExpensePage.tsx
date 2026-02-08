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

export default function AddExpensePage() {
  const { groupId, expenseId } = useParams<{
    groupId: string;
    expenseId?: string;
  }>();
  const isEditing = !!expenseId;
  const navigate = useNavigate();

  if (!groupId) {
    console.log('Expected a groupId');
    return <Navigate to='/groups' replace />
  }

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: expense, isLoading: expenseLoading } = useExpense(
    groupId,
    expenseId!,
  );
  const createExpense = useCreateExpense(groupId);
  const updateExpense = useUpdateExpense(groupId, expenseId!);

  const handleSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateExpense.mutateAsync(data);
      } else {
        await createExpense.mutateAsync(data);
      }
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/groups/${groupId}`);
  };

  if (groupLoading || (isEditing && expenseLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
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
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Split expenses with {group.members?.length || 0} group members
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <ExpenseForm
            members={group.members || []}
            initialData={expense}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createExpense.isPending || updateExpense.isPending}
          />
        </div>
      </div>
    </div>
  );
}
