/**
 * Color utility functions for consistent color generation and manipulation
 */

/**
 * Predefined color palette for avatars and group cards
 * Using vibrant, accessible colors that work well with white text
 */
const AVATAR_COLORS = [
  '#0ea5e9', // Sky blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7', // Violet
];

/**
 * Generate a consistent color from a string using hash
 * This ensures the same name always gets the same color
 *
 * @param str - The string to generate a color from (e.g., name, group name)
 * @returns A hex color code
 */
export function stringToColor(str: string): string {
  if (!str || str.trim() === '') {
    return AVATAR_COLORS[0]; // Default to first color
  }

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use modulo to select from our color palette
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Extract initials from a name
 * Handles various name formats:
 * - "John Doe" -> "JD"
 * - "Alice" -> "A"
 * - "Bob Smith Jr." -> "BS"
 * - "" -> "?"
 *
 * @param name - The name to extract initials from
 * @returns The initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name || name.trim() === '') {
    return '?';
  }

  const trimmed = name.trim();

  // Split by spaces and filter out empty strings
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    // Single word: return first character
    return parts[0][0].toUpperCase();
  }

  // Multiple words: return first character of first and last word
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * Generate a gradient background for group cards
 * Creates a subtle gradient from the base color to a lighter variant
 *
 * @param str - The string to generate a gradient from
 * @returns CSS gradient string
 */
export function stringToGradient(str: string): string {
  const baseColor = stringToColor(str);

  // For simplicity, we'll create a gradient using the base color
  // In a real implementation, you might want to lighten/darken the color
  return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`;
}

/**
 * Determine if a color is light or dark
 * Used to determine whether to use white or black text
 *
 * @param hexColor - The hex color to check
 * @returns true if the color is light (use dark text), false if dark (use light text)
 */
export function isLightColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  // Using W3C formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if light (threshold 0.5)
  return luminance > 0.5;
}
