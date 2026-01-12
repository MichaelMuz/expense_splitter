/**
 * BalanceGraph component - shows who owes whom
 */

import { formatCurrency } from '../../../shared/utils/currency';
import { useBalances } from '../../hooks/useBalances';

interface BalanceGraphProps {
  groupId: string;
  onSettle?: (fromId: string, toId: string, amount: number) => void;
}

export function BalanceGraph({ groupId, onSettle }: BalanceGraphProps) {
  const { data, isLoading, error } = useBalances(groupId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading balance details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load balance details. Please try again.</p>
      </div>
    );
  }

  if (!data || data.balances.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800 font-medium">Everyone is settled up!</p>
        <p className="text-sm text-green-600 mt-1">No outstanding balances</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Who Owes Whom</h3>
        <p className="text-sm text-gray-500 mt-1">Outstanding balances between members</p>
      </div>

      <div className="divide-y divide-gray-200">
        {data.balances.map((balance, index) => (
          <div key={index} className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{balance.from.name}</span>
                  <span className="text-gray-500 mx-2">owes</span>
                  <span className="font-semibold">{balance.to.name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click "Record Payment" to mark this as paid
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(balance.amount)}
                </span>
                {onSettle && (
                  <button
                    onClick={() => onSettle(balance.from.id, balance.to.id, balance.amount)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
