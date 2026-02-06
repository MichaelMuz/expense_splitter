/**
 * ExpenseForm component - create/edit expense form
 */

import { useState, useEffect } from 'react';
import { toCents, toDollars } from '../../../shared/utils/currency';
import { SplitMethodPicker } from './SplitMethodPicker';
import { PayerSelector } from './PayerSelector';
import { OwerSelector } from './OwerSelector';
import type {
  CreateExpenseInput,
  PayerInput,
  OwerInput,
} from '../../../shared/schemas/expense';

type SplitMethod = 'EVEN' | 'FIXED' | 'PERCENTAGE';
type TaxTipType = 'FIXED' | 'PERCENTAGE';

interface Member {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  members: Member[];
  onSubmit: (data: CreateExpenseInput) => void;
  onCancel: () => void;
  initialData?: Partial<CreateExpenseInput>;
  isSubmitting?: boolean;
}

export function ExpenseForm({
  members,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}: ExpenseFormProps) {
  // Basic fields
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [baseAmount, setBaseAmount] = useState(
    initialData?.baseAmount ? toDollars(initialData.baseAmount).toFixed(2) : ''
  );

  // Tax fields
  const [includeTax, setIncludeTax] = useState(!!initialData?.taxAmount);
  const [taxType, setTaxType] = useState<TaxTipType>(
    initialData?.taxType || 'PERCENTAGE'
  );
  const [taxAmount, setTaxAmount] = useState(
    initialData?.taxAmount
      ? initialData.taxType === 'PERCENTAGE'
        ? (initialData.taxAmount / 100).toFixed(2)
        : toDollars(initialData.taxAmount).toFixed(2)
      : ''
  );

  // Tip fields
  const [includeTip, setIncludeTip] = useState(!!initialData?.tipAmount);
  const [tipType, setTipType] = useState<TaxTipType>(
    initialData?.tipType || 'PERCENTAGE'
  );
  const [tipAmount, setTipAmount] = useState(
    initialData?.tipAmount
      ? initialData.tipType === 'PERCENTAGE'
        ? (initialData.tipAmount / 100).toFixed(2)
        : toDollars(initialData.tipAmount).toFixed(2)
      : ''
  );

  // Split configuration
  const [payerSplitMethod, setPayerSplitMethod] = useState<SplitMethod>(
    (initialData?.payers?.[0]?.splitMethod as SplitMethod) || 'EVEN'
  );
  const [owerSplitMethod, setOwerSplitMethod] = useState<SplitMethod>(
    (initialData?.owers?.[0]?.splitMethod as SplitMethod) || 'EVEN'
  );
  const [payers, setPayers] = useState<PayerInput[]>(initialData?.payers || []);
  const [owers, setOwers] = useState<OwerInput[]>(initialData?.owers || []);

  // Update split methods when they change
  useEffect(() => {
    setPayers((prev) =>
      prev.map((p) => ({
        ...p,
        splitMethod: payerSplitMethod,
        splitValue: payerSplitMethod === 'EVEN' ? null : p.splitValue,
      }))
    );
  }, [payerSplitMethod]);

  useEffect(() => {
    setOwers((prev) =>
      prev.map((o) => ({
        ...o,
        splitMethod: owerSplitMethod,
        splitValue: owerSplitMethod === 'EVEN' ? null : o.splitValue,
      }))
    );
  }, [owerSplitMethod]);

  const calculateTotalAmount = (): number => {
    const base = toCents(parseFloat(baseAmount) || 0);
    let total = base;

    if (includeTax && taxAmount) {
      if (taxType === 'PERCENTAGE') {
        const percentage = parseFloat(taxAmount) || 0;
        total += Math.round((base * percentage) / 100);
      } else {
        total += toCents(parseFloat(taxAmount) || 0);
      }
    }

    if (includeTip && tipAmount) {
      if (tipType === 'PERCENTAGE') {
        const percentage = parseFloat(tipAmount) || 0;
        total += Math.round((base * percentage) / 100);
      } else {
        total += toCents(parseFloat(tipAmount) || 0);
      }
    }

    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseAmountCents = toCents(parseFloat(baseAmount) || 0);

    const data: CreateExpenseInput = {
      name,
      description,
      baseAmount: baseAmountCents,
      taxAmount:
        includeTax && taxAmount
          ? taxType === 'PERCENTAGE'
            ? Math.round(parseFloat(taxAmount) * 100) // Convert to basis points
            : toCents(parseFloat(taxAmount))
          : null,
      taxType: includeTax && taxAmount ? taxType : null,
      tipAmount:
        includeTip && tipAmount
          ? tipType === 'PERCENTAGE'
            ? Math.round(parseFloat(tipAmount) * 100) // Convert to basis points
            : toCents(parseFloat(tipAmount))
          : null,
      tipType: includeTip && tipAmount ? tipType : null,
      payers,
      owers,
    };

    onSubmit(data);
  };

  const totalAmount = calculateTotalAmount();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Expense Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Dinner at Restaurant"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Add any additional details..."
        />
      </div>

      {/* Amount */}
      <div>
        <label
          htmlFor="baseAmount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Base Amount * ($)
        </label>
        <input
          type="number"
          id="baseAmount"
          value={baseAmount}
          onChange={(e) => setBaseAmount(e.target.value)}
          required
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="0.00"
        />
      </div>

      {/* Tax */}
      <div className="border border-gray-200 rounded-md p-4">
        <label className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={includeTax}
            onChange={(e) => setIncludeTax(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Include Tax
          </span>
        </label>

        {includeTax && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTaxType('PERCENTAGE')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded border ${
                  taxType === 'PERCENTAGE'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setTaxType('FIXED')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded border ${
                  taxType === 'FIXED'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Fixed Amount
              </button>
            </div>
            <div className="flex items-center gap-2">
              {taxType === 'FIXED' && <span className="text-gray-500">$</span>}
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder={taxType === 'PERCENTAGE' ? '0.00' : '0.00'}
              />
              {taxType === 'PERCENTAGE' && (
                <span className="text-gray-500">%</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="border border-gray-200 rounded-md p-4">
        <label className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={includeTip}
            onChange={(e) => setIncludeTip(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Include Tip
          </span>
        </label>

        {includeTip && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipType('PERCENTAGE')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded border ${
                  tipType === 'PERCENTAGE'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setTipType('FIXED')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded border ${
                  tipType === 'FIXED'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Fixed Amount
              </button>
            </div>
            <div className="flex items-center gap-2">
              {tipType === 'FIXED' && <span className="text-gray-500">$</span>}
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder={tipType === 'PERCENTAGE' ? '0.00' : '0.00'}
              />
              {tipType === 'PERCENTAGE' && (
                <span className="text-gray-500">%</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">
            Total Amount:
          </span>
          <span className="text-2xl font-bold text-gray-900">
            ${toDollars(totalAmount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payers */}
      <div className="border border-gray-200 rounded-md p-4">
        <SplitMethodPicker
          value={payerSplitMethod}
          onChange={setPayerSplitMethod}
          label="How was this paid?"
        />
        <div className="mt-4">
          <PayerSelector
            members={members}
            payers={payers}
            splitMethod={payerSplitMethod}
            totalAmount={totalAmount}
            onChange={setPayers}
          />
        </div>
      </div>

      {/* Owers */}
      <div className="border border-gray-200 rounded-md p-4">
        <SplitMethodPicker
          value={owerSplitMethod}
          onChange={setOwerSplitMethod}
          label="How should this be split?"
        />
        <div className="mt-4">
          <OwerSelector
            members={members}
            owers={owers}
            splitMethod={owerSplitMethod}
            baseAmount={toCents(parseFloat(baseAmount) || 0)}
            onChange={setOwers}
          />
        </div>
      </div>

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
          disabled={
            isSubmitting ||
            !name ||
            !baseAmount ||
            payers.length === 0 ||
            owers.length === 0
          }
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Update Expense'
              : 'Create Expense'}
        </button>
      </div>
    </form>
  );
}
