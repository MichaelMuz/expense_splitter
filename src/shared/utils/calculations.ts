/**
 * Core calculation utilities for expense splitting.
 * All amounts are in cents (integers) for precision.
 */

import type { SplitMethod, TaxTipType } from '@prisma/client';
import type { ExpenseData, PayerInput, OwerInput } from '../schemas/expense';
import { assertUnreachable } from './type-helpers';

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
  }
  return expense.baseAmount + calc(expense.taxAmount, expense.taxType) + calc(expense.tipAmount, expense.tipType)
}

function distributeProportionally(totalAmount: number, weights: Map<string, number>) {
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

function percentageDistribute(totalAmount: number, participants: (PayerInput | OwerInput)[], splitType: Extract<SplitMethod, 'PERCENTAGE' | 'EVEN'>) {
  if (splitType == 'EVEN') {
    return distributeProportionally(totalAmount, new Map(participants.map(p => [p.groupMemberId, 1])));
  } else if (splitType == 'PERCENTAGE') {
    return distributeProportionally(totalAmount, new Map(participants.map(p => [p.groupMemberId, p.splitValue || 0])));
  } else { assertUnreachable(splitType) }
}

function calculateAmounts(
  totalAmount: number,
  participants: (PayerInput | OwerInput)[]
): Map<string, number> {
  // zod validation ensures all split methods are the same
  const firstMethod = participants[0]?.splitMethod;

  if (!firstMethod) {
    return new Map()
  } else if (firstMethod === 'EVEN' || firstMethod === 'PERCENTAGE') {
    return percentageDistribute(totalAmount, participants, firstMethod)
  } else if (firstMethod === 'FIXED') {
    // Fixed amounts - use as-is
    return new Map(participants.map(participant => [participant.groupMemberId, participant.splitValue || 0]));
  } else { assertUnreachable(firstMethod) }
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
      return 0
    } else if (type === 'PERCENTAGE') {
      return Math.round((expense.baseAmount * amount) / 10000);
    } else if (type === 'FIXED') {
      return amount;
    } else { assertUnreachable(type) }
  }
  const totalTaxTip = calcTaxTip(expense.taxAmount, expense.taxType) + calcTaxTip(expense.tipAmount, expense.tipType)
  // Step 3: Distribute tax and tip proportionally based on base amounts
  const taxTipAmounts = distributeProportionally(totalTaxTip, baseAmounts)
  return new Map(owers.map(o => [o.groupMemberId, (baseAmounts.get(o.groupMemberId) || 0) + (taxTipAmounts.get(o.groupMemberId) || 0)]))
}

/**
 * Calculate net balances for a group after all expenses and settlements
 * @param expenses - Array of expenses with payer and ower data
 * @param settlements - Array of settlements
 * @returns Map of "fromMemberId->toMemberId" to net amount owed in cents
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
    amount: number; // cents
  }>
): Map<string, number> {
  // Track debts: Map of "debtorId->creditorId" to amount
  const debts = new Map<string, number>();

  // Process each expense
  expenses.forEach(({ expense, payers, owers }) => {
    const payerAmounts = calculatePayerAmounts(expense, payers);
    const owerAmounts = calculateOwerAmounts(expense, owers);

    // Calculate total paid and total owed
    const totalPaid = Array.from(payerAmounts.values()).reduce((a, b) => a + b, 0);
    const totalOwed = Array.from(owerAmounts.values()).reduce((a, b) => a + b, 0);

    // For each ower, distribute their debt to payers proportionally
    owerAmounts.forEach((owedAmount, owerId) => {
      payerAmounts.forEach((paidAmount, payerId) => {
        if (owerId === payerId) {
          // If same person paid and owes, net it out
          const netAmount = owedAmount - paidAmount;
          if (netAmount > 0) {
            // They owe more than they paid
            // Distribute to other payers
            payerAmounts.forEach((otherPaidAmount, otherPayerId) => {
              if (otherPayerId !== owerId && totalPaid > 0) {
                const proportion = otherPaidAmount / totalPaid;
                const debtAmount = Math.round(netAmount * proportion);
                const key = `${owerId}->${otherPayerId}`;
                debts.set(key, (debts.get(key) || 0) + debtAmount);
              }
            });
          }
        } else {
          // Different people - ower owes payer
          const proportion = paidAmount / totalPaid;
          const debtAmount = Math.round(owedAmount * proportion);
          const key = `${owerId}->${payerId}`;
          debts.set(key, (debts.get(key) || 0) + debtAmount);
        }
      });
    });
  });

  // Apply settlements (reduce debts)
  settlements.forEach((settlement) => {
    const key = `${settlement.fromGroupMemberId}->${settlement.toGroupMemberId}`;
    debts.set(key, (debts.get(key) || 0) - settlement.amount);
  });

  // Net off mutual debts (A owes B, B owes A)
  const finalDebts = new Map<string, number>();
  const processed = new Set<string>();

  debts.forEach((amount, key) => {
    if (processed.has(key)) return;

    const [debtor, creditor] = key.split('->');
    const reverseKey = `${creditor}->${debtor}`;
    const reverseAmount = debts.get(reverseKey) || 0;

    processed.add(key);
    processed.add(reverseKey);

    const netAmount = amount - reverseAmount;
    if (netAmount > 0) {
      finalDebts.set(key, netAmount);
    } else if (netAmount < 0) {
      finalDebts.set(reverseKey, -netAmount);
    }
    // If netAmount === 0, debts cancel out completely
  });

  // Remove zero or negative balances
  finalDebts.forEach((amount, key) => {
    if (amount <= 0) {
      finalDebts.delete(key);
    }
  });

  return finalDebts;
}

/**
 * Get simplified balance summary per member
 * @param netBalances - Map of "fromId->toId" to amount
 * @returns Map of memberId to their net balance (positive = owed to them, negative = they owe)
 */
export function getMemberBalances(
  netBalances: Map<string, number>
): Map<string, number> {
  const balances = new Map<string, number>();

  netBalances.forEach((amount, key) => {
    const parts = key.split('->');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return;

    const debtor = parts[0];
    const creditor = parts[1];

    // Debtor owes money (negative balance)
    balances.set(debtor, (balances.get(debtor) || 0) - amount);

    // Creditor is owed money (positive balance)
    balances.set(creditor, (balances.get(creditor) || 0) + amount);
  });

  return balances;
}
