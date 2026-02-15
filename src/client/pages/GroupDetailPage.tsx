import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { useGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Loading } from '../components/layout/Loading';

type Tab = 'expenses' | 'balances' | 'members' | 'settlements';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const { data: group, isLoading, error } = useGroup(groupId!);

  if (isLoading) return <Loading name='group' />
  if (error || !group) return <Layout><p>Failed to load group.</p></Layout>;

  return (
    <Layout>
      <h1>{group.name}</h1>

      <nav>
        <button onClick={() => setActiveTab('expenses')} disabled={activeTab === 'expenses'}>Expenses</button>
        {' '}
        <button onClick={() => setActiveTab('settlements')} disabled={activeTab === 'settlements'}>Settlements</button>
        {' '}
        <button onClick={() => setActiveTab('balances')} disabled={activeTab === 'balances'}>Balances</button>
        {' '}
        <button onClick={() => setActiveTab('members')} disabled={activeTab === 'members'}>Members</button>
      </nav>

      {activeTab === 'expenses' && (
        <div>
          <button onClick={() => navigate(`/groups/${groupId}/expenses/new`)}>Add Expense</button>
          <ExpenseList groupId={groupId!} />
        </div>
      )}

      {activeTab === 'settlements' && (
        <div>
          <button onClick={() => navigate(`/groups/${groupId}/settlements/new`)}>Add Settlement</button>
          {/* Add a list of settlements like the expenses piece */}
        </div>
      )}

      {activeTab === 'balances' && <p>Balances view coming soon</p>}

      {activeTab === 'members' && (
        <div>
          <h2>Members</h2>
          <p>Invite code: {group.inviteCode}</p>
          <ul>
            {group.members.map((m) => (
              <li key={m.id}>
                {m.name}
                {m.role === 'owner' ? ' (owner)' : ''}
                {!m.userId ? ' (virtual)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  );
}
