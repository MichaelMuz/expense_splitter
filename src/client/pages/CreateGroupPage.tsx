import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const createGroup = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const group = await createGroup.mutateAsync({ name: name.trim() });
    navigate(`/groups/${group.id}`);
  };

  return (
    <Layout>
      <h1>Create New Group</h1>
      {createGroup.isError && <p>{createGroup.error.message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Group Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button type="submit" disabled={createGroup.isPending}>
          {createGroup.isPending ? 'Creating...' : 'Create Group'}
        </button>
        <button type="button" onClick={() => navigate('/groups')}>Cancel</button>
      </form>
    </Layout>
  );
}
