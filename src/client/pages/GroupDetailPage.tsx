/**
 * GroupDetailPage - main view for a group showing expenses and balances
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { MemberList } from '../components/groups/MemberList';
import { InviteLink } from '../components/groups/InviteLink';
import { VirtualPersonClaim } from '../components/groups/VirtualPersonClaim';
import { useGroup } from '../hooks/useGroups';

type Tab = 'expenses' | 'balances' | 'members';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  const { data: group, isLoading, error } = useGroup(groupId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">
            Failed to load group. Please try again.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleAddExpense = () => {
    navigate(`/groups/${groupId}/expenses/new`);
  };

  const handleEditExpense = (expenseId: string) => {
    navigate(`/groups/${groupId}/expenses/${expenseId}/edit`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                ← Back to Groups
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            </div>
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'balances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Balances
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'expenses' && (
          <div>
            <ExpenseList groupId={groupId!} onEditExpense={handleEditExpense} />
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">Balances view coming soon</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <InviteLink inviteCode={group.inviteCode} />
            <VirtualPersonClaim members={group.members} />
            <MemberList
              members={group.members}
              currentUserId={undefined} // TODO: Get from auth context
              isOwner={false} // TODO: Check from group data
            />
          </div>
        )}
      </div>
    </div>
  );
}
