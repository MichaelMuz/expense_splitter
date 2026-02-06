/**
 * ExpenseList component - displays a list of expenses
 */

import { ExpenseCard } from './ExpenseCard';
import { useExpenses, useDeleteExpense } from '../../hooks/useExpenses';

interface ExpenseListProps {
  groupId: string;
  onEditExpense?: (expenseId: string) => void;
}

export function ExpenseList({ groupId, onEditExpense }: ExpenseListProps) {
  const { data: expenses, isLoading, error } = useExpenses(groupId);
  const deleteExpense = useDeleteExpense(groupId);

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense.mutateAsync(expenseId);
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading expenses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Failed to load expenses. Please try again.
        </p>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600 mb-2">No expenses yet</p>
        <p className="text-sm text-gray-500">
          Add your first expense to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEditExpense ? () => onEditExpense(expense.id) : undefined}
          onDelete={() => handleDelete(expense.id)}
        />
      ))}
    </div>
  );
}
