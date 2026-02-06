/**
 * OwerSelector component - multi-select with split configuration for owers
 */

import { useState } from 'react';
import { toCents, toDollars } from '../../../shared/utils/currency';
import type { OwerInput } from '../../../shared/schemas/expense';

type SplitMethod = 'EVEN' | 'FIXED' | 'PERCENTAGE';

interface Member {
  id: string;
  name: string;
}

interface OwerSelectorProps {
  members: Member[];
  owers: OwerInput[];
  splitMethod: SplitMethod;
  baseAmount: number; // Base amount in cents (for FIXED validation)
  onChange: (owers: OwerInput[]) => void;
}

export function OwerSelector({
  members,
  owers,
  splitMethod,
  baseAmount,
  onChange,
}: OwerSelectorProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const handleToggleMember = (memberId: string) => {
    const isSelected = owers.some((o) => o.groupMemberId === memberId);

    if (isSelected) {
      // Remove member
      onChange(owers.filter((o) => o.groupMemberId !== memberId));
    } else {
      // Add member with default values
      onChange([
        ...owers,
        {
          groupMemberId: memberId,
          splitMethod,
          splitValue: splitMethod === 'EVEN' ? null : 0,
        },
      ]);
    }
  };

  const handleUpdateValue = (memberId: string, value: string) => {
    const updatedOwers = owers.map((ower) => {
      if (ower.groupMemberId === memberId) {
        if (splitMethod === 'FIXED') {
          // Convert dollars to cents
          const cents = toCents(parseFloat(value) || 0);
          return { ...ower, splitValue: cents };
        } else if (splitMethod === 'PERCENTAGE') {
          // Store as basis points (0-10000 = 0%-100%)
          const percentage = parseFloat(value) || 0;
          const basisPoints = Math.round(percentage * 100);
          return { ...ower, splitValue: basisPoints };
        }
      }
      return ower;
    });
    onChange(updatedOwers);
    validateSplit(updatedOwers);
  };

  const validateSplit = (currentOwers: OwerInput[]) => {
    const newErrors: string[] = [];

    if (splitMethod === 'FIXED') {
      const total = currentOwers.reduce(
        (sum, o) => sum + (o.splitValue || 0),
        0
      );
      if (total !== baseAmount) {
        newErrors.push(
          `Total must equal ${toDollars(baseAmount).toFixed(2)} (currently ${toDollars(total).toFixed(2)})`
        );
      }
    } else if (splitMethod === 'PERCENTAGE') {
      const total = currentOwers.reduce(
        (sum, o) => sum + (o.splitValue || 0),
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

  const getDisplayValue = (ower: OwerInput): string => {
    if (splitMethod === 'EVEN') return '';
    if (splitMethod === 'FIXED') {
      return ower.splitValue ? toDollars(ower.splitValue).toFixed(2) : '0.00';
    }
    if (splitMethod === 'PERCENTAGE') {
      return ower.splitValue ? (ower.splitValue / 100).toFixed(2) : '0.00';
    }
    return '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Split between (select one or more):
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
          const ower = owers.find((o) => o.groupMemberId === member.id);
          const isSelected = !!ower;

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

              {isSelected && splitMethod !== 'EVEN' && ower && (
                <div className="flex items-center gap-1">
                  {splitMethod === 'FIXED' && (
                    <span className="text-sm text-gray-500">$</span>
                  )}
                  <input
                    type="number"
                    step={splitMethod === 'FIXED' ? '0.01' : '0.01'}
                    min="0"
                    value={getDisplayValue(ower)}
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

      {owers.length === 0 && (
        <p className="mt-2 text-sm text-red-600">
          At least one person is required
        </p>
      )}
    </div>
  );
}
