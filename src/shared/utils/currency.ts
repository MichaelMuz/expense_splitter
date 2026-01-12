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

/**
 * Parse currency string to cents
 * Handles formats like: "$10.50", "10.50", "$10", "10"
 * @param value - Currency string
 * @returns Amount in cents, or 0 if invalid
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[$,\s]/g, '');

  // Parse as float
  const dollars = parseFloat(cleaned);

  // Return 0 if invalid
  if (isNaN(dollars)) {
    return 0;
  }

  return toCents(dollars);
}
