/**
 * Create group page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const createGroup = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      const group = await createGroup.mutateAsync({ name: name.trim() });
      navigate(`/groups/${group.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16">
        <Card>
          <h1 className="text-3xl font-bold mb-6">Create New Group</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Group Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekend Trip, Apartment 4B"
              required
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/groups')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={createGroup.isPending}
              >
                Create Group
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
