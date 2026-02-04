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

function percentageDistribute(totalAmount: number, participants: (PayerInput | OwerInput)[], splitType: Extract<SplitMethod, 'PERCENTAGE' | 'EVEN'>) {
  let sortedPayers;
  let amountCalc;
  if (splitType == 'EVEN') {
    sortedPayers = participants
    // even split of total always
    const perPlayer = Math.floor(totalAmount / participants.length)
    amountCalc = (_: (PayerInput | OwerInput)) => perPlayer;
  } else if (splitType == 'PERCENTAGE') {
    // Make largest payer last so they handle remainder bc it is a smaller portion of their total
    sortedPayers = [...participants].sort((a, b) =>
      (b.splitValue || 0) - (a.splitValue || 0)
    );
    // splitValue is in basis points (0-10000 = 0%-100%)
    amountCalc = (payer: (PayerInput | OwerInput)) => Math.round((totalAmount * (payer.splitValue || 0)) / 10000);
  } else { assertUnreachable(splitType) }

  const results = new Map<string, number>();
  let remaining = totalAmount;
  sortedPayers.forEach((payer, index) => {
    if (index === sortedPayers.length - 1) {
      // Last payer gets remainder
      results.set(payer.groupMemberId, remaining);
    } else {
      const amount = amountCalc(payer)
      results.set(payer.groupMemberId, amount);
      remaining -= amount;
    }
  });
  return results
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
  const totalAmount = calculateTotalExpenseAmount(expense);

  // zod validation ensures all split methods are the same
  const firstMethod = payers[0]?.splitMethod;

  if (!firstMethod) {
    return new Map()
  } else if (firstMethod === 'EVEN' || firstMethod === 'PERCENTAGE') {
    return percentageDistribute(totalAmount, payers, firstMethod)
  } else if (firstMethod === 'FIXED') {
    // Fixed amounts - use as-is
    return new Map(payers.map(payer => [payer.groupMemberId, payer.splitValue || 0]))
  } else { assertUnreachable(firstMethod) }
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
  const results = new Map<string, number>();

  if (owers.length === 0) {
    return results;
  }

  // Step 1: Calculate base amounts for each ower
  const baseAmounts = new Map<string, number>();
  const firstMethod = owers[0]?.splitMethod;
  const allSameMethod = firstMethod ? owers.every((o) => o.splitMethod === firstMethod) : false;

  if (allSameMethod && firstMethod === 'EVEN') {
    // Even split of base
    const perOwer = Math.floor(expense.baseAmount / owers.length);
    const remainder = expense.baseAmount - perOwer * owers.length;

    owers.forEach((ower, index) => {
      // Give remainder to first ower to handle rounding
      const amount = index === 0 ? perOwer + remainder : perOwer;
      baseAmounts.set(ower.groupMemberId, amount);
    });
  } else if (allSameMethod && firstMethod === 'FIXED') {
    // Fixed amounts
    owers.forEach((ower) => {
      baseAmounts.set(ower.groupMemberId, ower.splitValue || 0);
    });
  } else if (allSameMethod && firstMethod === 'PERCENTAGE') {
    // Percentage split
    let remaining = expense.baseAmount;
    const sortedOwers = [...owers].sort((a, b) =>
      (b.splitValue || 0) - (a.splitValue || 0)
    );

    sortedOwers.forEach((ower, index) => {
      if (index === sortedOwers.length - 1) {
        // Last ower gets remainder to handle rounding
        baseAmounts.set(ower.groupMemberId, remaining);
      } else {
        // splitValue is in basis points (0-10000 = 0%-100%)
        const amount = Math.round((expense.baseAmount * (ower.splitValue || 0)) / 10000);
        baseAmounts.set(ower.groupMemberId, amount);
        remaining -= amount;
      }
    });
  }

  // Step 2: Calculate total base for proportions
  const totalBase = Array.from(baseAmounts.values()).reduce((a, b) => a + b, 0);

  if (totalBase === 0) {
    return results;
  }

  // Step 3: Calculate tax and tip amounts
  let taxAmount = 0;
  if (expense.taxAmount) {
    if (expense.taxType === 'PERCENTAGE') {
      taxAmount = Math.round((expense.baseAmount * expense.taxAmount) / 10000);
    } else {
      taxAmount = expense.taxAmount;
    }
  }

  let tipAmount = 0;
  if (expense.tipAmount) {
    if (expense.tipType === 'PERCENTAGE') {
      tipAmount = Math.round((expense.baseAmount * expense.tipAmount) / 10000);
    } else {
      tipAmount = expense.tipAmount;
    }
  }

  // Step 4: Distribute tax and tip proportionally based on base amounts
  let remainingTax = taxAmount;
  let remainingTip = tipAmount;
  const sortedMembers = Array.from(baseAmounts.entries()).sort((a, b) => b[1] - a[1]);

  sortedMembers.forEach(([groupMemberId, base], index) => {
    const proportion = base / totalBase;

    if (index === sortedMembers.length - 1) {
      // Last person gets remaining amounts to handle rounding
      const total = base + remainingTax + remainingTip;
      results.set(groupMemberId, total);
    } else {
      const tax = Math.round(taxAmount * proportion);
      const tip = Math.round(tipAmount * proportion);
      const total = base + tax + tip;
      results.set(groupMemberId, total);
      remainingTax -= tax;
      remainingTip -= tip;
    }
  });

  return results;
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
