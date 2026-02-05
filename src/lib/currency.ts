/**
 * Currency utilities for monetary value normalization and formatting
 * Used to ensure consistent handling of Brazilian Real (BRL) values
 */

/**
 * Parses a Brazilian currency string (e.g., "R$ 1.234,50") to a numeric value
 * Handles various input formats and returns a pure decimal number
 * 
 * @param value - The currency string to parse
 * @returns The parsed numeric value, or 0 if invalid
 */
export const parseCurrency = (value: string): number => {
  if (!value || typeof value !== "string") return 0;
  
  // Remove currency symbol, spaces, and any non-numeric characters except comma and period
  let cleaned = value
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .trim();
  
  // Handle Brazilian format: 1.234,50 -> 1234.50
  // If there's a comma, it's likely the decimal separator
  if (cleaned.includes(",")) {
    // Remove thousand separators (periods before comma)
    cleaned = cleaned.replace(/\./g, "");
    // Convert comma to period for decimal
    cleaned = cleaned.replace(",", ".");
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a numeric value as Brazilian currency for display
 * 
 * @param value - The numeric value to format
 * @param includeSymbol - Whether to include "R$" prefix (default: true)
 * @returns The formatted currency string
 */
export const formatCurrency = (value: number, includeSymbol = true): string => {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  
  return includeSymbol ? `R$ ${formatted}` : formatted;
};

/**
 * Formats input for currency field (live formatting as user types)
 * Converts raw input to display format without currency symbol
 * 
 * @param value - The raw input value
 * @returns The formatted value for display in input field
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-digits
  const numbers = value.replace(/[^\d]/g, "");
  if (!numbers) return "";
  
  // Convert to decimal (last 2 digits are cents)
  const amount = parseInt(numbers) / 100;
  
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Validates that a monetary value is valid for saving
 * 
 * @param value - The parsed numeric value
 * @returns True if the value is valid (greater than 0)
 */
export const isValidCurrency = (value: number): boolean => {
  return typeof value === "number" && !isNaN(value) && value > 0;
};
