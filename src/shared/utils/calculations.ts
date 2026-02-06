/**
 * Core calculation utilities for expense splitting.
 * All amounts are in cents (integers) for precision.
 */

import type { TaxTipType } from '@prisma/client';
import type { ExpenseData, PayerInput, OwerInput } from '../schemas/expense';
import { assertUnreachable } from './type-helpers';
import assert from 'assert';

/**
 * Calculate the total expense amount including tax and tip
 * @param expense - Expense data with base, tax, and tip
 * @returns Total amount in cents
 */
export function calculateTotalExpenseAmount(expense: ExpenseData): number {
  const calc = (amount?: number | null, type?: TaxTipType | null) => {
    if (amount) {
      if (type === 'PERCENTAGE') {
        // tax/tip amount is in basis points (0-10000 = 0%-100%)
        return Math.round((expense.baseAmount * amount) / 10000);
      } else {
        // tax/tip amount is in cents
        return amount;
      }
    }
    return 0;
  };
  return (
    expense.baseAmount +
    calc(expense.taxAmount, expense.taxType) +
    calc(expense.tipAmount, expense.tipType)
  );
}

function distributeProportionally(
  totalAmount: number,
  weights: Map<string, number>
) {
  const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
  const sorted = Array.from(weights.entries()).sort((a, b) => b[1] - a[1]);

  const results = new Map<string, number>();
  let remaining = totalAmount;
  sorted.forEach(([id, weight], index) => {
    if (index === sorted.length - 1) {
      results.set(id, remaining);
    } else {
      const amount = Math.round((totalAmount * weight) / totalWeight);
      results.set(id, amount);
      remaining -= amount;
    }
  });

  return results;
}

function calculateAmounts(
  totalAmount: number,
  participants: (PayerInput | OwerInput)[]
): Map<string, number> {
  // zod validation ensures all split methods are the same
  const firstMethod = participants[0]?.splitMethod;

  if (!firstMethod) {
    return new Map();
  } else if (firstMethod === 'EVEN') {
    return distributeProportionally(
      totalAmount,
      new Map(participants.map((p) => [p.groupMemberId, 1]))
    );
  } else if (firstMethod === 'PERCENTAGE') {
    return distributeProportionally(
      totalAmount,
      new Map(participants.map((p) => [p.groupMemberId, p.splitValue || 0]))
    );
  } else if (firstMethod === 'FIXED') {
    return new Map(
      participants.map((participant) => [
        participant.groupMemberId,
        participant.splitValue || 0,
      ])
    );
  } else {
    assertUnreachable(firstMethod);
  }
}

/**
 * Calculate how much each payer paid
 * @param expense - Expense data
 * @param payers - Array of payer configurations
 * @returns Map of groupMemberId to amount paid in cents
 */
export function calculatePayerAmounts(
  expense: ExpenseData,
  payers: PayerInput[]
): Map<string, number> {
  // divide the total expense (including tax + tip) among all payers as per strategy
  return calculateAmounts(calculateTotalExpenseAmount(expense), payers);
}

/**
 * Calculate how much each ower owes (including proportional tax and tip)
 * @param expense - Expense data
 * @param owers - Array of ower configurations
 * @returns Map of groupMemberId to amount owed in cents
 */
export function calculateOwerAmounts(
  expense: ExpenseData,
  owers: OwerInput[]
): Map<string, number> {
  // Step 1: Calculate base amounts for each ower
  const baseAmounts = calculateAmounts(expense.baseAmount, owers);
  // Step 2: Calculate tax and tip amounts
  const calcTaxTip = (amount?: number | null, type?: TaxTipType | null) => {
    if (!amount || !type) {
      return 0;
    } else if (type === 'PERCENTAGE') {
      return Math.round((expense.baseAmount * amount) / 10000);
    } else if (type === 'FIXED') {
      return amount;
    } else {
      assertUnreachable(type);
    }
  };
  const totalTaxTip =
    calcTaxTip(expense.taxAmount, expense.taxType) +
    calcTaxTip(expense.tipAmount, expense.tipType);
  // Step 3: Distribute tax and tip proportionally based on base amounts
  const taxTipAmounts = distributeProportionally(totalTaxTip, baseAmounts);
  return new Map(
    owers.map((o) => [
      o.groupMemberId,
      (baseAmounts.get(o.groupMemberId) || 0) +
        (taxTipAmounts.get(o.groupMemberId) || 0),
    ])
  );
}

/**
 * Calculate net balances for a group after all expenses and settlements
 * @param expenses - Array of expenses with payer and ower data
 * @param settlements - Array of settlements
 * @returns Map of owedMemberId to Map of owerMemberId to net amount owed in cents
 * TODO: I should make a an explicit money type that is in cents
 */
export function calculateNetBalances(
  expenses: Array<{
    expense: ExpenseData;
    payers: PayerInput[];
    owers: OwerInput[];
  }>,
  settlements: Array<{
    fromGroupMemberId: string;
    toGroupMemberId: string;
    amount: number;
  }>
): Map<string, Map<string, number>> {
  const owedToOwerToAmount = new Map<string, Map<string, number>>();

  const addToMapUnlessZero = (
    payerId: string,
    owerId: string,
    toAdd: number
  ) => {
    let owerToAmount = owedToOwerToAmount.get(payerId);
    if (!owerToAmount) {
      owerToAmount = new Map();
      owedToOwerToAmount.set(payerId, owerToAmount);
    }
    const amount = (owerToAmount.get(owerId) || 0) + toAdd;
    if (amount === 0) {
      owerToAmount.delete(owerId);
    } else {
      owerToAmount.set(owerId, amount);
    }
  };

  // Process each expense
  expenses.forEach(({ expense, payers, owers }) => {
    const pToPaid = calculatePayerAmounts(expense, payers);
    const pToOwes = calculateOwerAmounts(expense, owers);

    // Simplify members that both paid and partook
    new Set(pToPaid.keys()).intersection(new Set(pToOwes)).forEach((mId) => {
      const paid = pToPaid.get(mId) || 0;
      const owes = pToOwes.get(mId) || 0;
      const maxExch = Math.min(paid, owes);
      pToPaid.set(mId, paid - maxExch);
      pToOwes.set(mId, owes - maxExch);
    });

    // If we sort the list of payers by amount paid desc and owers by amount owed desc then we can two pointer
    const [paidIter, owesIter] = [pToPaid, pToOwes].map((p) =>
      Array.from(p.entries())
        .sort((a, b) => b[1] - a[1])
        .values()
    );

    const moveIter = (iter?: ArrayIterator<[string, number]>) =>
      iter?.next().value ?? [undefined, undefined];
    let [payerId, amountPaid] = moveIter(paidIter);
    let [owerId, amountOwed] = moveIter(owesIter);

    while (payerId && owerId && amountPaid && amountOwed) {
      const maxExch = Math.min(amountPaid, amountOwed);
      amountOwed -= maxExch;
      amountPaid -= maxExch;
      addToMapUnlessZero(payerId, owerId, maxExch);

      if (amountPaid == 0) {
        [payerId, amountPaid] = moveIter(paidIter);
      }
      if (amountOwed == 0) {
        [owerId, amountOwed] = moveIter(owesIter);
      }
    }
    assert(
      !payerId && !owerId && !amountPaid && !amountOwed,
      'Expected all to balance out'
    );
  });

  // Apply settlements (reduce debts)
  settlements.forEach((settlement) => {
    addToMapUnlessZero(
      settlement.toGroupMemberId,
      settlement.fromGroupMemberId,
      -settlement.amount
    );
  });

  return owedToOwerToAmount;
}

/**
 * Get simplified balance summary per member
 * @param netBalances - Map of owedMemberId to Map of owerMemberId to amount
 * @returns Map of memberId to their net balance (positive = owed to them, negative = they owe)
 * TODO: Not used right now. Can prob just have this take the same input as calculateNetBalances function otherwise this input is akward
 */
export function getMemberBalances(
  netBalances: Map<string, Map<string, number>>
): Map<string, number> {
  const balances = new Map<string, number>();

  netBalances.forEach((owerToAmount, owedId) => {
    owerToAmount.forEach((amount, owerId) => {
      // Ower owes money (negative balance)
      balances.set(owerId, (balances.get(owerId) || 0) - amount);

      // Owed is owed money (positive balance)
      balances.set(owedId, (balances.get(owedId) || 0) + amount);
    });
  });

  return balances;
}
