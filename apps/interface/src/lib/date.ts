/**
 * Centralized date/deadline formatting utilities.
 *
 * All formatting is timezone-aware and built on `Intl.DateTimeFormat` with an
 * explicit `timeZone` option. When no timezone is provided, the user's resolved
 * timezone is used (falling back to UTC when it cannot be determined).
 *
 * All helpers handle `null`, `undefined`, and invalid inputs gracefully by
 * returning an empty string (or a neutral fallback) rather than throwing.
 */

/** A value that can be coerced into a valid `Date`. */
export type DateInput = Date | string | number | null | undefined;

/** Options shared by the formatting helpers. */
export interface FormatOptions {
  /** IANA timezone name (e.g. `"America/New_York"`). Defaults to the resolved user timezone. */
  timezone?: string;
  /** BCP 47 locale tag (e.g. `"en-US"`). Defaults to the runtime locale. */
  locale?: string;
}

/** Options for {@link formatDeadline}. */
export interface DeadlineFormatOptions extends FormatOptions {
  /** Whether to include the time component in addition to the date. Defaults to `true`. */
  includeTime?: boolean;
}

const DEFAULT_TIMEZONE = 'UTC';

/**
 * Resolve the user's timezone from the runtime, falling back to UTC when it
 * cannot be determined (e.g. in non-browser environments).
 */
export function resolveTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Coerce an arbitrary input into a valid `Date`, or return `null` when the
 * input is missing or invalid.
 */
export function toValidDate(input: DateInput): Date | null {
  if (input === null || input === undefined) {
    return null;
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Build an `Intl.DateTimeFormat`, guarding against invalid timezone/locale
 * values by falling back to the resolved timezone and default locale.
 */
function createFormatter(
  options: Intl.DateTimeFormatOptions,
  { timezone, locale }: FormatOptions = {},
): Intl.DateTimeFormat {
  const timeZone = timezone || resolveTimezone();
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone });
  } catch {
    // Invalid timezone or locale: retry with safe defaults.
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: DEFAULT_TIMEZONE });
  }
}

/**
 * Format a date as a human-readable date string (e.g. `"Jan 5, 2025"`).
 * Returns an empty string for null/invalid input.
 */
export function formatDate(input: DateInput, options: FormatOptions = {}): string {
  const date = toValidDate(input);
  if (!date) {
    return '';
  }
  return createFormatter(
    { year: 'numeric', month: 'short', day: 'numeric' },
    options,
  ).format(date);
}

/**
 * Format a date as a human-readable time string (e.g. `"3:45 PM"`).
 * Returns an empty string for null/invalid input.
 */
export function formatTime(input: DateInput, options: FormatOptions = {}): string {
  const date = toValidDate(input);
  if (!date) {
    return '';
  }
  return createFormatter(
    { hour: 'numeric', minute: '2-digit' },
    options,
  ).format(date);
}

/**
 * Format a deadline as a human-readable string. By default includes both date
 * and time (e.g. `"Jan 5, 2025, 3:45 PM"`). Returns an empty string for
 * null/invalid input.
 */
export function formatDeadline(
  input: DateInput,
  options: DeadlineFormatOptions = {},
): string {
  const date = toValidDate(input);
  if (!date) {
    return '';
  }
  const { includeTime = true, ...formatOptions } = options;
  const intlOptions: Intl.DateTimeFormatOptions = includeTime
    ? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  return createFormatter(intlOptions, formatOptions).format(date);
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format a deadline relative to now (e.g. `"in 2 days"`, `"3 hours ago"`).
 * Returns an empty string for null/invalid input.
 *
 * @param input The deadline.
 * @param now Reference point for the comparison. Defaults to `new Date()`.
 */
export function formatRelativeDeadline(
  input: DateInput,
  now: DateInput = new Date(),
): string {
  const date = toValidDate(input);
  const reference = toValidDate(now);
  if (!date || !reference) {
    return '';
  }

  const diff = date.getTime() - reference.getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (abs < MINUTE) {
    return rtf.format(Math.round(diff / 1000), 'second');
  }
  if (abs < HOUR) {
    return rtf.format(Math.round(diff / MINUTE), 'minute');
  }
  if (abs < DAY) {
    return rtf.format(Math.round(diff / HOUR), 'hour');
  }
  if (abs < 30 * DAY) {
    return rtf.format(Math.round(diff / DAY), 'day');
  }
  if (abs < 365 * DAY) {
    return rtf.format(Math.round(diff / (30 * DAY)), 'month');
  }
  return rtf.format(Math.round(diff / (365 * DAY)), 'year');
}

/**
 * Format the time remaining until a deadline as a compact countdown
 * (e.g. `"2d 3h"`, `"45m"`, `"Overdue"`). Returns an empty string for
 * null/invalid input.
 *
 * @param input The deadline.
 * @param now Reference point for the comparison. Defaults to `new Date()`.
 */
export function formatTimeLeft(
  input: DateInput,
  now: DateInput = new Date(),
): string {
  const date = toValidDate(input);
  const reference = toValidDate(now);
  if (!date || !reference) {
    return '';
  }

  const diff = date.getTime() - reference.getTime();
  if (diff <= 0) {
    return 'Overdue';
  }

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return '<1m';
}
```

File: apps/interface/src/lib/date.test.ts

```ts
import {
  formatDate,
  formatDeadline,
  formatRelativeDeadline,
  formatTime,
  formatTimeLeft,
  resolveTimezone,
  toValidDate,
} from './date';

describe('date utils', () => {
  describe('toValidDate', () => {
    it('returns null for null/undefined', () => {
      expect(toValidDate(null)).toBeNull();
      expect(toValidDate(undefined)).toBeNull();
    });

    it('returns null for invalid input', () => {
      expect(toValidDate('not-a-date')).toBeNull();
      expect(toValidDate(Number.NaN)).toBeNull();
    });

    it('parses valid inputs', () => {
      expect(toValidDate('2025-01-05T00:00:00Z')?.toISOString()).toBe(
        '2025-01-05T00:00:00.000Z',
      );
      const d = new Date('2025-01-05T00:00:00Z');
      expect(toValidDate(d)).toBe(d);
    });
  });

  describe('resolveTimezone', () => {
    it('returns a non-empty string', () => {
      expect(typeof resolveTimezone()).toBe('string');
      expect(resolveTimezone().length).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    const date = '2025-01-05T12:00:00Z';

    it('formats in UTC', () => {
      expect(formatDate(date, { timezone: 'UTC', locale: 'en-US' })).toBe('Jan 5, 2025');
    });

    it('formats in a different timezone', () => {
      // 12:00 UTC is 07:00 in New York on Jan 5.
      expect(
        formatDate(date, { timezone: 'America/New_York', locale: 'en-US' }),
      ).toBe('Jan 5, 2025');
    });

    it('handles timezone day rollover', () => {
      // 23:30 UTC on Jan 5 is Jan 6 in Tokyo.
      expect(
        formatDate('2025-01-05T23:30:00Z', { timezone: 'Asia/Tokyo', locale: 'en-US' }),
      ).toBe('Jan 6, 2025');
    });

    it('returns empty string for null/invalid input', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid')).toBe('');
    });

    it('falls back gracefully for invalid timezone', () => {
      expect(formatDate(date, { timezone: 'Not/AZone', locale: 'en-US' })).toBe(
        'Jan 5, 2025',
      );
    });
  });

  describe('formatTime', () => {
    it('formats time in the given timezone', () => {
      const result = formatTime('2025-01-05T12:00:00Z', {
        timezone: 'UTC',
        locale: 'en-US',
      });
      expect(result).toMatch(/12:00/);
    });

    it('returns empty string for invalid input', () => {
      expect(formatTime(null)).toBe('');
    });
  });

  describe('formatDeadline', () => {
    const deadline = '2025-06-15T18:30:00Z';

    it('includes date and time by default', () => {
      const result = formatDeadline(deadline, { timezone: 'UTC', locale: 'en-US' });
      expect(result).toContain('Jun 15, 2025');
      expect(result).toMatch(/6:30/);
    });

    it('omits time when includeTime is false', () => {
      expect(
        formatDeadline(deadline, {
          timezone: 'UTC',
          locale: 'en-US',
          includeTime: false,
        }),
      ).toBe('Jun 15, 2025');
    });

    it('handles DST boundaries', () => {
      // US DST starts 2025-03-09. 07:00 UTC is 03:00 EDT (UTC-4).
      const result = formatDeadline('2025-03-09T07:00:00Z', {
        timezone: 'America/New_York',
        locale: 'en-US',
      });
      expect(result).toContain('Mar 9, 2025');
      expect(result).toMatch(/3:00/);
    });

    it('returns empty string for null/invalid input', () => {
      expect(formatDeadline(null)).toBe('');
      expect(formatDeadline('nope')).toBe('');
    });
  });

  describe('formatRelativeDeadline', () => {
    const now = new Date('2025-01-05T12:00:00Z');

    it('formats future deadlines', () => {
      expect(formatRelativeDeadline('2025-01-07T12:00:00Z', now)).toBe('in 2 days');
    });

    it('formats past deadlines', () => {
      expect(formatRelativeDeadline('2025-01-05T09:00:00Z', now)).toBe('3 hours ago');
    });

    it('formats near deadlines in minutes', () => {
      expect(formatRelativeDeadline('2025-01-05T12:30:00Z', now)).toBe('in 30 minutes');
    });

    it('returns empty string for invalid input', () => {
      expect(formatRelativeDeadline(null, now)).toBe('');
      expect(formatRelativeDeadline('2025-01-07T12:00:00Z', null)).toBe('');
    });
  });

  describe('formatTimeLeft', () => {
    const now = new Date('2025-01-05T12:00:00Z');

    it('formats days and hours', () => {
      expect(formatTimeLeft('2025-01-07T15:00:00Z', now)).toBe('2d 3h');
    });

    it('formats hours and minutes', () => {
      expect(formatTimeLeft('2025-01-05T14:30:00Z', now)).toBe('2h 30m');
    });

    it('formats minutes only', () => {
      expect(formatTimeLeft('2025-01-05T12:45:00Z', now)).toBe('45m');
    });

    it('formats sub-minute', () => {
      expect(formatTimeLeft('2025-01-05T12:00:30Z', now)).toBe('<1m');
    });

    it('marks past deadlines as overdue', () => {
      expect(formatTimeLeft('2025-01-05T11:00:00Z', now)).toBe('Overdue');
    });

    it('returns empty string for invalid input', () => {
      expect(formatTimeLeft(null, now)).toBe('');
    });
  });
});