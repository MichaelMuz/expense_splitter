import { formatCurrency } from '../../../shared/utils/currency';
import { useExpenses, useDeleteExpense } from '../../hooks/useExpenses';
import { Loading } from '../layout/Loading';

export function ExpenseList({ groupId }: { groupId: string }) {
  const { data: expenses, isLoading, error } = useExpenses(groupId);
  const deleteExpense = useDeleteExpense(groupId);

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Delete this expense?')) {
      await deleteExpense.mutateAsync(expenseId);
    }
  };

  if (isLoading) return <Loading name='expenses' />
  if (error) return <p>Failed to load expenses.</p>;
  if (!expenses || expenses.length === 0) return <p>No expenses yet.</p>;

  return (
    <ul>
      {expenses.map((expense) => (
        <li key={expense.id}>
          {expense.name} — {formatCurrency(expense.totalAmount)}
          {' '}
          <button onClick={() => handleDelete(expense.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
