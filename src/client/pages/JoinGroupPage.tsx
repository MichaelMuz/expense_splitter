import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoinGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';

export default function JoinGroupPage() {
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();
  const joinGroup = useJoinGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await joinGroup.mutateAsync(inviteCode.trim());
    navigate(`/groups/${result.group.id}`);
  };

  return (
    <Layout>
      <h1>Join a Group</h1>
      {joinGroup.isError && <p>{joinGroup.error.message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="inviteCode">Invite Code</label>
          <input id="inviteCode" type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
        </div>
        <button type="submit" disabled={joinGroup.isPending}>
          {joinGroup.isPending ? 'Joining...' : 'Join Group'}
        </button>
        <button type="button" onClick={() => navigate('/groups')}>Cancel</button>
      </form>
    </Layout>
  );
}
