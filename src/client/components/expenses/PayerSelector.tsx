/**
 * PayerSelector component - multi-select with split configuration for payers
 */

import { useState } from 'react';
import { toCents, toDollars } from '../../../shared/utils/currency';
import type { PayerInput } from '../../../shared/schemas/expense';

type SplitMethod = 'EVEN' | 'FIXED' | 'PERCENTAGE';

interface Member {
  id: string;
  name: string;
}

interface PayerSelectorProps {
  members: Member[];
  payers: PayerInput[];
  splitMethod: SplitMethod;
  totalAmount?: number; // Total expense amount in cents (for FIXED validation)
  onChange: (payers: PayerInput[]) => void;
}

export function PayerSelector({
  members,
  payers,
  splitMethod,
  totalAmount,
  onChange,
}: PayerSelectorProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const handleToggleMember = (memberId: string) => {
    const isSelected = payers.some((p) => p.groupMemberId === memberId);

    if (isSelected) {
      // Remove member
      onChange(payers.filter((p) => p.groupMemberId !== memberId));
    } else {
      // Add member with default values
      onChange([
        ...payers,
        {
          groupMemberId: memberId,
          splitMethod,
          splitValue: splitMethod === 'EVEN' ? null : 0,
        },
      ]);
    }
  };

  const handleUpdateValue = (memberId: string, value: string) => {
    const updatedPayers = payers.map((payer) => {
      if (payer.groupMemberId === memberId) {
        if (splitMethod === 'FIXED') {
          // Convert dollars to cents
          const cents = toCents(parseFloat(value) || 0);
          return { ...payer, splitValue: cents };
        } else if (splitMethod === 'PERCENTAGE') {
          // Store as basis points (0-10000 = 0%-100%)
          const percentage = parseFloat(value) || 0;
          const basisPoints = Math.round(percentage * 100);
          return { ...payer, splitValue: basisPoints };
        }
      }
      return payer;
    });
    onChange(updatedPayers);
    validateSplit(updatedPayers);
  };

  const validateSplit = (currentPayers: PayerInput[]) => {
    const newErrors: string[] = [];

    if (splitMethod === 'FIXED' && totalAmount) {
      const total = currentPayers.reduce(
        (sum, p) => sum + (p.splitValue || 0),
        0
      );
      if (total !== totalAmount) {
        newErrors.push(
          `Total must equal ${toDollars(totalAmount).toFixed(2)} (currently ${toDollars(total).toFixed(2)})`
        );
      }
    } else if (splitMethod === 'PERCENTAGE') {
      const total = currentPayers.reduce(
        (sum, p) => sum + (p.splitValue || 0),
        0
      );
      if (total !== 10000) {
        newErrors.push(
          `Percentages must total 100% (currently ${total / 100}%)`
        );
      }
    }

    setErrors(newErrors);
  };

  const getDisplayValue = (payer: PayerInput): string => {
    if (splitMethod === 'EVEN') return '';
    if (splitMethod === 'FIXED') {
      return payer.splitValue ? toDollars(payer.splitValue).toFixed(2) : '0.00';
    }
    if (splitMethod === 'PERCENTAGE') {
      return payer.splitValue ? (payer.splitValue / 100).toFixed(2) : '0.00';
    }
    return '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Paid by (select one or more):
      </label>

      {errors.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => {
          const payer = payers.find((p) => p.groupMemberId === member.id);
          const isSelected = !!payer;

          return (
            <div key={member.id} className="flex items-center gap-3">
              <label className="flex items-center flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleMember(member.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {member.name}
                </span>
              </label>

              {isSelected && splitMethod !== 'EVEN' && payer && (
                <div className="flex items-center gap-1">
                  {splitMethod === 'FIXED' && (
                    <span className="text-sm text-gray-500">$</span>
                  )}
                  <input
                    type="number"
                    step={splitMethod === 'FIXED' ? '0.01' : '0.01'}
                    min="0"
                    value={getDisplayValue(payer)}
                    onChange={(e) =>
                      handleUpdateValue(member.id, e.target.value)
                    }
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  {splitMethod === 'PERCENTAGE' && (
                    <span className="text-sm text-gray-500">%</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {payers.length === 0 && (
        <p className="mt-2 text-sm text-red-600">
          At least one payer is required
        </p>
      )}
    </div>
  );
}
