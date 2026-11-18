export const locales = ["en", "es", "fr", "ar", "he"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: Locale[] = ["ar", "he"];
export const localeNames = {
  en: "English",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  he: "עברית",
};

/**
 * Contract error message namespace.
 * Maps contract error codes to user-facing English strings so tests resolve
 * real messages instead of raw keys.
 */
export const contractErrors = {
  CONTRACT_NOT_FOUND: "The contract could not be found.",
  CONTRACT_INVALID_STATE: "The contract is in an invalid state for this action.",
  CONTRACT_UNAUTHORIZED: "You are not authorized to perform this action on the contract.",
  CONTRACT_EXPIRED: "This contract has expired.",
  CONTRACT_ALREADY_EXISTS: "A contract with this identifier already exists.",
  CONTRACT_INSUFFICIENT_FUNDS: "There are insufficient funds to complete this contract action.",
  CONTRACT_INVALID_ARGUMENT: "One or more arguments provided to the contract are invalid.",
  CONTRACT_EXECUTION_FAILED: "The contract execution failed. Please try again.",
  CONTRACT_TIMEOUT: "The contract operation timed out. Please try again.",
  CONTRACT_UNKNOWN_ERROR: "An unexpected contract error occurred.",
} as const;

export type ContractErrorCode = keyof typeof contractErrors;

/**
 * i18n-ready dictionary keyed by locale. English is fully populated; other
 * locales fall back to English until translations are provided.
 */
export const contractErrorMessages: Record<Locale, Record<ContractErrorCode, string>> = {
  en: contractErrors,
  es: contractErrors,
  fr: contractErrors,
  ar: contractErrors,
  he: contractErrors,
};

/**
 * Resolve a contract error code to a localized message, falling back to the
 * default locale and finally to a generic unknown-error message.
 */
export function getContractErrorMessage(code: string, locale: Locale = defaultLocale): string {
  const messages = contractErrorMessages[locale] ?? contractErrorMessages[defaultLocale];
  if (code in messages) {
    return messages[code as ContractErrorCode];
  }
  return messages.CONTRACT_UNKNOWN_ERROR;
}