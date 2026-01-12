/**
 * ExpenseCard component - displays a single expense in a card format
 */

import { formatCurrency } from '../../../shared/utils/currency';
import type { Expense } from '../../hooks/useExpenses';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{expense.name}</h3>
          <p className="text-sm text-gray-500">{formatDate(expense.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(expense.totalAmount)}
          </p>
        </div>
      </div>

      {/* Description */}
      {expense.description && (
        <p className="text-sm text-gray-600 mb-3">{expense.description}</p>
      )}

      {/* Breakdown */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Base:</span>
          <span className="font-medium">{formatCurrency(expense.baseAmount)}</span>
        </div>
        {expense.taxAmount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Tax ({expense.taxType === 'PERCENTAGE' ? `${expense.taxAmount / 100}%` : 'Fixed'}):
            </span>
            <span className="font-medium">
              {expense.taxType === 'PERCENTAGE'
                ? formatCurrency(Math.round((expense.baseAmount * expense.taxAmount) / 10000))
                : formatCurrency(expense.taxAmount)}
            </span>
          </div>
        )}
        {expense.tipAmount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Tip ({expense.tipType === 'PERCENTAGE' ? `${expense.tipAmount / 100}%` : 'Fixed'}):
            </span>
            <span className="font-medium">
              {expense.tipType === 'PERCENTAGE'
                ? formatCurrency(Math.round((expense.baseAmount * expense.tipAmount) / 10000))
                : formatCurrency(expense.tipAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Payers */}
      <div className="border-t pt-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Paid by:</h4>
        <div className="space-y-1">
          {expense.payers.map((payer) => (
            <div key={payer.groupMemberId} className="flex justify-between text-sm">
              <span className="text-gray-600">{payer.groupMember.name}</span>
              <span className="font-medium text-green-600">
                {formatCurrency(payer.calculatedAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Owers */}
      <div className="border-t pt-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Split between:</h4>
        <div className="space-y-1">
          {expense.owers.map((ower) => (
            <div key={ower.groupMemberId} className="flex justify-between text-sm">
              <span className="text-gray-600">{ower.groupMember.name}</span>
              <span className="font-medium">{formatCurrency(ower.calculatedAmount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-3 border-t">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
