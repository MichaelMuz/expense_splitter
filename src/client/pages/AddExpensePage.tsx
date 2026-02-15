import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Loading } from '../components/layout/Loading';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { useCreateExpense } from '../hooks/useExpenses';

function AddExpenseCore({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(groupId);
  const mutation = useCreateExpense(groupId)

  if (isLoading) return <Loading name="group" />;
  else if (!group) return <Navigate to="/groups" replace />;

  return (
    <Layout>
      {mutation.isError && <p>{mutation.error.message}</p>}
      <button onClick={() => navigate(`/groups/${groupId}`)}>Back</button>
      <h1>Add Expense to {group.name}</h1>
      <ExpenseForm members={group.members} isPending={mutation.isPending} onSubmit={(expense => mutation.mutate(expense))} />
    </Layout>
  );

}

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();

  if (!groupId) return <Navigate to="/groups" replace />;
  return <AddExpenseCore groupId={groupId} />
}
