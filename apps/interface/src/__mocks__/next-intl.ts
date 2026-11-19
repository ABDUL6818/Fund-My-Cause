// Mock for next-intl in Jest tests
// Loads the actual English messages so tests get real translation strings.
// Falls back to "namespace.key" if the key isn't found.
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const messages = require("../../messages/en.json") as Record<string, Record<string, string>>;

function resolveKey(namespace: string | undefined, key: string): string {
  if (!namespace) return key;
  const ns = messages[namespace];
  if (!ns) return `${namespace}.${key}`;
  // Support dot-separated nested keys (e.g. "stats.campaignsLaunched")
  const parts = key.split(".");
  let current: unknown = ns;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return `${namespace}.${key}`;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === "string") return current;
  // Contract error messages live under the "errors" namespace, keyed by
  // contract error code (e.g. t("CONTRACT_NOT_FOUND")). Resolve those too.
  const errors = messages.errors;
  if (errors && typeof errors[key] === "string") return errors[key];
  return `${namespace}.${key}`;
}

const useTranslations = (namespace?: string) => {
  const t = (key: string, values?: Record<string, unknown>) => {
    const template = resolveKey(namespace, key);
    if (!values) return template;
    return Object.entries(values).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
      template,
    );
  };
  t.raw = (key: string) => resolveKey(namespace, key);
  return t;
};

const useLocale = () => "en";

const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => children;

module.exports = { useTranslations, useLocale, NextIntlClientProvider };
