"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { COINGECKO_API_URL } from "@/lib/constants";
import { formatAmount } from "@fund-my-cause/shared-utils";

export type FiatCurrency = "USD" | "EUR" | "NGN" | "GBP" | "JPY";

export const FIAT_CURRENCIES: {
  code: FiatCurrency;
  label: string;
  symbol: string;
}[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
];

interface CurrencyContextType {
  currency: FiatCurrency;
  setCurrency: (c: FiatCurrency) => void;
  /** XLM price in the selected fiat currency; null if unavailable */
  xlmPrice: number | null;
  /** Convert XLM amount to fiat string, e.g. "$12.34" */
  formatFiat: (xlm: number) => string | null;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let ratesCache: { rates: Record<string, number>; at: number } | null = null;

async function fetchRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.at < CACHE_DURATION)
    return ratesCache.rates;
  try {
    const currencies = FIAT_CURRENCIES.map((f) => f.code.toLowerCase()).join(
      ",",
    );
    const res = await fetch(
      `${COINGECKO_API_URL}?ids=stellar&vs_currencies=${currencies}`,
    );
    if (!res.ok) return {};
    const json = await res.json();
    const raw = json?.stellar ?? {};
    const rates: Record<string, number> = {};
    for (const f of FIAT_CURRENCIES) {
      const v = raw[f.code.toLowerCase()];
      if (typeof v === "number" && v > 0) rates[f.code] = v;
    }
    ratesCache = { rates, at: Date.now() };
    return rates;
  } catch {
    return {};
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useLocalStorage<FiatCurrency>(
    "fmc:currency",
    "USD",
  );
  const [rates, setRates] = useState<Record<string, number>>({});

  const loadRates = useCallback(async () => {
    const r = await fetchRates();
    setRates(r);
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const xlmPrice = rates[currency] ?? null;

  const formatFiat = (xlm: number): string | null => {
    if (xlmPrice === null) return null;
    const fiatInfo = FIAT_CURRENCIES.find((f) => f.code === currency);
    return formatAmount(xlm * xlmPrice, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
      fallbackSymbol: fiatInfo?.symbol,
    });
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, xlmPrice, formatFiat }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
