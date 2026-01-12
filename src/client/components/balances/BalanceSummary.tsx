/**
 * BalanceSummary component - displays net balance for each member
 */

import { formatCurrency } from '../../../shared/utils/currency';
import { useBalances } from '../../hooks/useBalances';

interface BalanceSummaryProps {
  groupId: string;
}

export function BalanceSummary({ groupId }: BalanceSummaryProps) {
  const { data, isLoading, error } = useBalances(groupId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading balances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load balances. Please try again.</p>
      </div>
    );
  }

  if (!data || data.summary.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No balance data available</p>
      </div>
    );
  }

  const sortedSummary = [...data.summary].sort((a, b) => b.balance - a.balance);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Member Balances</h3>
        <p className="text-sm text-gray-500 mt-1">
          Positive amounts are owed to the member, negative amounts are owed by the member
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedSummary.map((memberBalance) => {
          const balance = memberBalance.balance;
          const isPositive = balance > 0;
          const isZero = balance === 0;

          return (
            <div key={memberBalance.member.id} className="px-4 py-3 flex justify-between items-center">
              <span className="font-medium text-gray-900">{memberBalance.member.name}</span>
              <div className="text-right">
                <span
                  className={`text-lg font-semibold ${
                    isZero
                      ? 'text-gray-500'
                      : isPositive
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {isPositive && '+'}
                  {formatCurrency(balance)}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isZero && 'Settled up'}
                  {isPositive && 'is owed'}
                  {!isPositive && !isZero && 'owes'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
