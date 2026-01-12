/**
 * Groups list page
 */

import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function GroupsPage() {
  const { data: groups, isLoading, error } = useGroups();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Groups</h1>
          <div className="flex gap-3">
            <Link to="/groups/create">
              <Button>Create Group</Button>
            </Link>
            <Link to="/groups/join">
              <Button variant="secondary">Join Group</Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading groups...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Failed to load groups. Please try again.
          </div>
        )}

        {groups && groups.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You're not part of any groups yet.</p>
              <div className="flex gap-3 justify-center">
                <Link to="/groups/create">
                  <Button>Create Your First Group</Button>
                </Link>
                <Link to="/groups/join">
                  <Button variant="secondary">Join a Group</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {groups && groups.length > 0 && (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
                      <p className="text-gray-600 text-sm">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </p>
                      {group._count && (
                        <p className="text-gray-600 text-sm">
                          {group._count.expenses} expense{group._count.expenses !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
