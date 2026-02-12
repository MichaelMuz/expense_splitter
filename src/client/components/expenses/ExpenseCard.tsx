/**
 * ExpenseCard component - displays a single expense in a card format with modern design
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { Expense } from '../../hooks/useExpenses';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { hoverLift, hoverGlow } from '../../lib/animations';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasBreakdown = expense.taxAmount || expense.tipAmount;

  return (
    <motion.div
      className="bg-white shadow-sm rounded-xl p-5 border border-neutral-200 overflow-hidden"
      whileHover={{
        ...hoverLift,
        boxShadow:
          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-primary-500 mt-1">
            <Receipt size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-neutral-800 mb-1">
              {expense.name}
            </h3>
            <p className="text-sm text-neutral-500">
              {formatDate(expense.createdAt)} • Paid by{' '}
              {expense.payers.map((p) => p.groupMember.name).join(', ')}
            </p>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold font-mono text-neutral-800">
            {formatCurrency(expense.totalAmount)}
          </p>
        </div>
      </div>

      {/* Description */}
      {expense.description && (
        <p className="text-sm text-neutral-600 mb-4 pb-4 border-b border-neutral-100">
          {expense.description}
        </p>
      )}

      {/* Breakdown (Collapsible) */}
      {hasBreakdown && (
        <div className="mb-4">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors mb-2"
          >
            {showBreakdown ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
            BREAKDOWN
          </button>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 pl-6 pb-4 border-b border-neutral-100"
            >
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Base:</span>
                <span className="font-mono font-medium text-neutral-800">
                  {formatCurrency(expense.baseAmount)}
                </span>
              </div>
              {expense.taxAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    Tax (
                    {expense.taxType === 'PERCENTAGE'
                      ? `${expense.taxAmount / 100}%`
                      : 'Fixed'}
                    ):
                  </span>
                  <span className="font-mono font-medium text-neutral-800">
                    {expense.taxType === 'PERCENTAGE'
                      ? formatCurrency(
                          Math.round(
                            (expense.baseAmount * expense.taxAmount) / 10000
                          )
                        )
                      : formatCurrency(expense.taxAmount)}
                  </span>
                </div>
              )}
              {expense.tipAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    Tip (
                    {expense.tipType === 'PERCENTAGE'
                      ? `${expense.tipAmount / 100}%`
                      : 'Fixed'}
                    ):
                  </span>
                  <span className="font-mono font-medium text-neutral-800">
                    {expense.tipType === 'PERCENTAGE'
                      ? formatCurrency(
                          Math.round(
                            (expense.baseAmount * expense.tipAmount) / 10000
                          )
                        )
                      : formatCurrency(expense.tipAmount)}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Split Between */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
          Split Between
        </h4>
        <div className="space-y-2">
          {expense.owers.map((ower) => (
            <div
              key={ower.groupMemberId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Avatar name={ower.groupMember.name} size="sm" />
                <span className="text-sm text-neutral-700">
                  {ower.groupMember.name}
                </span>
              </div>
              <span className="font-mono font-semibold text-sm text-neutral-800">
                {formatCurrency(ower.calculatedAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-4 border-t border-neutral-100">
          {onEdit && (
            <Button
              onClick={onEdit}
              variant="ghost"
              size="sm"
              leftIcon={<Edit2 size={16} />}
              className="flex-1"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={16} />}
              className="flex-1 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
