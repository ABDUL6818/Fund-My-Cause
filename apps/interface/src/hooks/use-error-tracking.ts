import { errorTracker, ErrorContext } from '@packages/shared-utils';

/**
 * Error tracking hook for React components
 *
 * Thin wrapper around the shared error tracker from `@packages/shared-utils`.
 * All error-tracking logic lives in the shared package; this hook only
 * exposes it in a React-friendly shape.
 */

export function useErrorTracking() {
  const captureError = (error: Error | string, context?: ErrorContext) => {
    return errorTracker.captureError(error, context);
  };

  const setContext = (context: Partial<ErrorContext>) => {
    errorTracker.setContext(context);
  };

  const getErrors = () => {
    return errorTracker.getErrors();
  };

  const getAnalytics = () => {
    return errorTracker.getErrorAnalytics();
  };

  const reportErrors = (endpoint: string) => {
    return errorTracker.reportErrors(endpoint);
  };

  return {
    captureError,
    setContext,
    getErrors,
    getAnalytics,
    reportErrors,
  };
}