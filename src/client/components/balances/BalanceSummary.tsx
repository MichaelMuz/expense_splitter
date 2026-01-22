/**
 * BalanceSummary component - displays net balance for each member with progress bars
 */

import { CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { useBalances } from '../../hooks/useBalances';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonCard } from '../ui/Skeleton';
import { Card } from '../ui/Card';

interface BalanceSummaryProps {
  groupId: string;
}

export function BalanceSummary({ groupId }: BalanceSummaryProps) {
  const { data, isLoading, error } = useBalances(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="bordered" className="bg-danger-50 border-danger-200">
        <div className="flex items-center gap-3 text-danger-800">
          <AlertTriangle size={24} />
          <p className="font-medium">Failed to load balances. Please try again.</p>
        </div>
      </Card>
    );
  }

  if (!data || data.summary.length === 0) {
    return (
      <EmptyState
        icon={<Scale size={64} />}
        title="No balances yet"
        description="Add some expenses to see member balances"
      />
    );
  }

  const sortedSummary = [...data.summary].sort((a, b) => b.balance - a.balance);

  // Find the maximum absolute balance for progress bar scaling
  const maxBalance = Math.max(...sortedSummary.map(m => Math.abs(m.balance)));

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-neutral-800 mb-2">Member Balances</h3>
        <p className="text-sm text-neutral-500">
          Positive amounts are owed to the member, negative amounts are owed by the member
        </p>
      </div>

      <div className="space-y-5">
        {sortedSummary.map((memberBalance) => {
          const balance = memberBalance.balance;
          const isPositive = balance > 0;
          const isZero = balance === 0;
          const percentage = maxBalance > 0 ? (Math.abs(balance) / maxBalance) * 100 : 0;

          return (
            <div key={memberBalance.member.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar name={memberBalance.member.name} size="md" />
                  <span className="font-semibold text-neutral-800">
                    {memberBalance.member.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-mono font-bold ${
                      isZero
                        ? 'text-neutral-500'
                        : isPositive
                        ? 'text-success-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {isPositive && '+'}
                    {formatCurrency(balance)}
                  </span>
                  {isZero && <CheckCircle size={20} className="text-success-500" />}
                  {!isZero && !isPositive && <AlertTriangle size={20} className="text-danger-500" />}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isZero
                        ? 'bg-neutral-300'
                        : isPositive
                        ? 'bg-gradient-to-r from-success-400 to-success-600'
                        : 'bg-gradient-to-r from-danger-400 to-danger-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-neutral-500 w-16 text-right">
                  {isZero && 'Settled'}
                  {isPositive && `${percentage.toFixed(0)}%`}
                  {!isPositive && !isZero && `${percentage.toFixed(0)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
