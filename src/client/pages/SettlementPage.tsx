/**
 * SettlementPage - Record a settlement/payment between members
 */

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SettlementForm } from '../components/balances/SettlementForm';
import { useGroup } from '../hooks/useGroups';
import { useCreateSettlement } from '../hooks/useSettlements';
import { toDollars } from '@shared/utils/currency';

export default function SettlementPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get pre-filled values from URL params (from BalanceGraph "Settle" button)
  const fromMemberId = searchParams.get('from');
  const toMemberId = searchParams.get('to');
  const amountCents = searchParams.get('amount');
  const suggestedAmount = amountCents ? toDollars(parseInt(amountCents)) : undefined;

  const { data: group, isLoading: groupLoading } = useGroup(groupId!);
  const createSettlement = useCreateSettlement(groupId!);

  const handleSubmit = async (data: {
    fromGroupMemberId: string;
    toGroupMemberId: string;
    amount: number;
  }) => {
    try {
      await createSettlement.mutateAsync(data);
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Failed to record settlement:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/groups/${groupId}`);
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">Group not found</p>
          <button
            onClick={() => navigate('/groups')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Back to {group.name}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Record Settlement</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record a payment between group members
          </p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700">
                Recording a settlement reduces the debt between two members. Either party can
                record the payment - no confirmation needed.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <SettlementForm
            members={group.members || []}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createSettlement.isPending}
            defaultFrom={fromMemberId || undefined}
            defaultTo={toMemberId || undefined}
            suggestedAmount={suggestedAmount}
          />
        </div>
      </div>
    </div>
  );
}
