/**
 * SettlementForm component - record a payment between members
 */

import { useState } from 'react';
import { toCents, toDollars, formatCurrency } from '../../../shared/utils/currency';
import type { CreateSettlementInput } from '../../../shared/schemas/settlement.schema';

interface Member {
  id: string;
  name: string;
}

interface SettlementFormProps {
  members: Member[];
  currentMemberId: string;
  onSubmit: (data: CreateSettlementInput) => void;
  onCancel: () => void;
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: number; // in cents
  isSubmitting?: boolean;
}

export function SettlementForm({
  members,
  currentMemberId,
  onSubmit,
  onCancel,
  initialFrom,
  initialTo,
  initialAmount,
  isSubmitting = false,
}: SettlementFormProps) {
  const [fromMemberId, setFromMemberId] = useState(initialFrom || '');
  const [toMemberId, setToMemberId] = useState(initialTo || '');
  const [amount, setAmount] = useState(
    initialAmount ? toDollars(initialAmount).toFixed(2) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountCents = toCents(parseFloat(amount) || 0);

    const data: CreateSettlementInput = {
      fromGroupMemberId: fromMemberId,
      toGroupMemberId: toMemberId,
      amount: amountCents,
      recordedBy: currentMemberId,
    };

    onSubmit(data);
  };

  const isValid = fromMemberId && toMemberId && amount && fromMemberId !== toMemberId;
  const amountCents = toCents(parseFloat(amount) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
        <p className="text-sm text-gray-600">
          Record a payment that was made between group members to update balances.
        </p>
      </div>

      {/* From Member */}
      <div>
        <label htmlFor="fromMember" className="block text-sm font-medium text-gray-700 mb-1">
          From (Payer) *
        </label>
        <select
          id="fromMember"
          value={fromMemberId}
          onChange={(e) => setFromMemberId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select member...</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Who made the payment?</p>
      </div>

      {/* To Member */}
      <div>
        <label htmlFor="toMember" className="block text-sm font-medium text-gray-700 mb-1">
          To (Receiver) *
        </label>
        <select
          id="toMember"
          value={toMemberId}
          onChange={(e) => setToMemberId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select member...</option>
          {members.map((member) => (
            <option
              key={member.id}
              value={member.id}
              disabled={member.id === fromMemberId}
            >
              {member.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Who received the payment?</p>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount * ($)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="0.00"
        />
      </div>

      {/* Same person error */}
      {fromMemberId && toMemberId && fromMemberId === toMemberId && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">Cannot record payment to yourself</p>
        </div>
      )}

      {/* Preview */}
      {isValid && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">
              {members.find((m) => m.id === fromMemberId)?.name}
            </span>
            <span className="mx-2">paid</span>
            <span className="font-semibold">
              {members.find((m) => m.id === toMemberId)?.name}
            </span>
            <span className="mx-2">
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(amountCents)}
              </span>
            </span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
}
