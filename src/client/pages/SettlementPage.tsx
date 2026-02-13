import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Loading } from '../components/layout/Loading';
import { useCreateSettlement } from '../hooks/useSettlements';
import { useState } from 'react';
import { toCents } from '@/shared/utils/currency';

function SettlementPageCore({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(groupId);
  const createSettlement = useCreateSettlement(groupId);
  const [fromGroupMemberId, setFromGroupMemberId] = useState('');
  const [toGroupMemberId, setToGroupMemberId] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSettlement.mutate({ fromGroupMemberId, toGroupMemberId, amount: toCents(parseFloat(amount)) }, {
      onSuccess: () => navigate(`/groups/${groupId}`)
    })
  }

  if (isLoading) return <Loading name='group' />
  if (!group) return <Layout><p>Group not found.</p></Layout>;

  return (
    <Layout>
      <h1>Record Settlement in {group.name}</h1>
      <button onClick={() => navigate(`/groups/${groupId}`)}>Back</button>

      <p> {createSettlement.isError && createSettlement.error.message}</p>

      <form onSubmit={handleSubmit}>

        <select value={fromGroupMemberId} onChange={e => setFromGroupMemberId(e.target.value)}>
          <option value=''> Choose a sender </option>
          {group.members.map(m =>
            <option key={m.id} value={m.id}> {m.name} </option>
          )}
        </select>

        <input type='number' placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />

        <select value={toGroupMemberId} onChange={e => setToGroupMemberId(e.target.value)}>
          <option value=''> Choose a receiver </option>
          {group.members.filter(m => m.id !== fromGroupMemberId).map(m =>
            <option key={m.id} value={m.id}> {m.name} </option>
          )}
        </select>

        <button type='submit' disabled={!fromGroupMemberId || !toGroupMemberId || !parseFloat(amount)}> Submit </button>
      </form>

    </Layout>
  );
}
export default function SettlementPage() {
  const { groupId } = useParams<{ groupId: string }>();

  if (!groupId) return <Navigate to="/groups" replace />;
  return <SettlementPageCore groupId={groupId} />
}
