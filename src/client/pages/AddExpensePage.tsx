import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  if (!groupId) return <Navigate to="/groups" replace />;

  const { data: group, isLoading } = useGroup(groupId);

  if (isLoading) return <Layout><p>Loading...</p></Layout>;
  if (!group) return <Layout><p>Group not found.</p></Layout>;

  return (
    <Layout>
      <h1>Add Expense to {group.name}</h1>
      <p>Expense form coming soon</p>
      <button onClick={() => navigate(`/groups/${groupId}`)}>Back</button>
    </Layout>
  );
}
