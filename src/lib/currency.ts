import { useAppPreferences } from "@/hooks/useSettings";

// Currency mapping for Intl.NumberFormat
const currencyMap = {
  'USD': 'USD',
  'EUR': 'EUR', 
  'GBP': 'GBP'
} as const;

// Symbol mapping for fallback
const symbolMap = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£'
} as const;

// Locale mapping for proper formatting
const localeMap = {
  'USD': 'en-US',
  'EUR': 'de-DE', // or 'fr-FR' depending on preference
  'GBP': 'en-GB'
} as const;

/**
 * Hook to get currency formatting function based on user preferences
 */
export function useCurrencyFormatter() {
  const { data: preferences } = useAppPreferences();
  
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return "N/A";
    if (isNaN(amount)) return "N/A";
    
    const currency = preferences?.currency || 'USD';
    const locale = localeMap[currency as keyof typeof localeMap] || 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyMap[currency as keyof typeof currencyMap] || 'USD',
      }).format(amount);
    } catch (error) {
      // Fallback to symbol + number if Intl.NumberFormat fails
      const symbol = preferences?.default_currency_symbol || symbolMap[currency as keyof typeof symbolMap] || '$';
      return `${symbol}${amount.toLocaleString()}`;
    }
  };

  const formatCurrencyCompact = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return "N/A";
    if (isNaN(amount)) return "N/A";
    
    const currency = preferences?.currency || 'USD';
    const locale = localeMap[currency as keyof typeof localeMap] || 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyMap[currency as keyof typeof currencyMap] || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      // Fallback to symbol + number if Intl.NumberFormat fails
      const symbol = preferences?.default_currency_symbol || symbolMap[currency as keyof typeof symbolMap] || '$';
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
  };

  const getCurrencySymbol = (): string => {
    const currency = preferences?.currency || 'USD';
    return preferences?.default_currency_symbol || symbolMap[currency as keyof typeof symbolMap] || '$';
  };

  const getCurrency = (): string => {
    return preferences?.currency || 'USD';
  };

  return {
    formatCurrency,
    formatCurrencyCompact,
    getCurrencySymbol,
    getCurrency,
    preferences
  };
}

/**
 * Static currency formatter for use outside of React components
 * Note: This won't be reactive to preference changes
 */
export function formatCurrencyStatic(
  amount: number | null | undefined, 
  currency: string = 'USD',
  symbol?: string
): string {
  if (amount === null || amount === undefined) return "N/A";
  if (isNaN(amount)) return "N/A";
  
  const locale = localeMap[currency as keyof typeof localeMap] || 'en-US';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyMap[currency as keyof typeof currencyMap] || 'USD',
    }).format(amount);
  } catch (error) {
    // Fallback to symbol + number if Intl.NumberFormat fails
    const fallbackSymbol = symbol || symbolMap[currency as keyof typeof symbolMap] || '$';
    return `${fallbackSymbol}${amount.toLocaleString()}`;
  }
}
