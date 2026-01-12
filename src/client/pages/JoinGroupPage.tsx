/**
 * Join group page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoinGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function JoinGroupPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const joinGroup = useJoinGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    try {
      const result = await joinGroup.mutateAsync(inviteCode.trim());
      navigate(`/groups/${result.group.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join group. Please check the invite code.');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16">
        <Card>
          <h1 className="text-3xl font-bold mb-6">Join a Group</h1>

          <p className="text-gray-600 mb-6">
            Enter the invite code shared with you to join an existing group.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Invite Code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
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
                isLoading={joinGroup.isPending}
              >
                Join Group
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
