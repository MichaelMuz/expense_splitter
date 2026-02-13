/**
 * Currency utilities for converting between dollars and cents.
 * All money is stored as integers (cents) in the database for precision.
 */

/**
 * Convert dollars to cents
 * @param dollars - Dollar amount (e.g., 10.50)
 * @returns Amount in cents (e.g., 1050)
 */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents (e.g., 1050)
 * @returns Dollar amount (e.g., 10.50)
 */
export function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 * @param cents - Amount in cents (e.g., 1050)
 * @returns Formatted string (e.g., "$10.50")
 */
export function formatCurrency(cents: number): string {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}