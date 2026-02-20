import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';

export default function GroupsPage() {
  const { data: groups, isLoading, error } = useGroups();

  return (
    <Layout>
      <h1>My Groups</h1>
      <nav>
        <Link to="/groups/create">Create Group</Link>
      </nav>

      {isLoading && <p>Loading groups...</p>}
      {error && <p>Failed to load groups.</p>}
      {groups && groups.length === 0 && <p>No groups yet.</p>}

      {groups && groups.length > 0 && (
        <ul>
          {groups.map((group) => (
            <li key={group.id}>
              <Link to={`/groups/${group.id}`}>
                {group.name} ({group.members.length} members)
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
