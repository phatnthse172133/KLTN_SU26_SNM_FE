/**
 * Normalizes a Vietnamese phone number:
 * - Truncates and removes spaces, dashes, dots, parentheses, and special characters.
 * - Converts "+84" prefix to "0".
 * - Returns empty string "" if input is null, undefined, or empty after cleaning.
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  
  // Remove all whitespace and common punctuation: -, ., (, ), /
  let cleaned = phone.replace(/[\s\-.()/]/g, "").trim();
  
  // Replace leading +84 or 84 (if 11 digits starting with 84 and next digit is 2,3,5,7,8,9) with 0
  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length === 11 && /^[235789]/.test(cleaned[2])) {
    cleaned = "0" + cleaned.slice(2);
  }
  
  return cleaned;
}

/**
 * Validates whether a phone number is a valid 10-digit Vietnamese phone number after normalization.
 * Valid prefixes in Vietnam: 03, 05, 07, 08, 09 (mobile) or 02 (landline).
 */
export function validatePhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  const phoneRegex = /^0[235789]\d{8}$/;
  return phoneRegex.test(normalized);
}
