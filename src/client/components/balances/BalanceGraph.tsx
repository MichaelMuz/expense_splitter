/**
 * BalanceGraph component - shows who owes whom with modern design
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { useBalances } from '../../hooks/useBalances';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonCard } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { fadeInUp } from '../../lib/animations';

interface BalanceGraphProps {
  groupId: string;
  onSettle?: (fromId: string, toId: string, amount: number) => void;
}

export function BalanceGraph({ groupId, onSettle }: BalanceGraphProps) {
  const { data, isLoading, error } = useBalances(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
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
          <p className="font-medium">
            Failed to load balance details. Please try again.
          </p>
        </div>
      </Card>
    );
  }

  if (!data || data.balances.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={64} className="text-success-500" />}
        title="Everyone is settled up!"
        description="No outstanding balances between members. All expenses are evenly distributed."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-neutral-800 mb-2">
          Who Owes Whom
        </h3>
        <p className="text-sm text-neutral-500">
          Outstanding balances between members
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {data.balances.map((balance, index) => (
          <motion.div
            key={`${balance.from.id}-${balance.to.id}`}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
          >
            <Card hover variant="bordered" className="p-5">
              <div className="flex items-center justify-between gap-4">
                {/* From Member */}
                <div className="flex items-center gap-3">
                  <Avatar name={balance.from.name} size="lg" />
                  <div>
                    <p className="font-semibold text-neutral-800">
                      {balance.from.name}
                    </p>
                    <p className="text-xs text-neutral-500">owes</p>
                  </div>
                </div>

                {/* Arrow and Amount */}
                <div className="flex flex-col items-center gap-1 px-4">
                  <ArrowRight size={24} className="text-primary-500" />
                  <span className="text-xl font-mono font-bold text-danger-600">
                    {formatCurrency(balance.amount)}
                  </span>
                </div>

                {/* To Member */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-neutral-800">
                      {balance.to.name}
                    </p>
                    <p className="text-xs text-neutral-500">receives</p>
                  </div>
                  <Avatar name={balance.to.name} size="lg" />
                </div>

                {/* Action Button */}
                {onSettle && (
                  <div className="ml-4">
                    <Button
                      onClick={() =>
                        onSettle(balance.from.id, balance.to.id, balance.amount)
                      }
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 size={16} />}
                    >
                      Record Payment
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
