import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { withErrorBoundary } from './ErrorBoundary';

// A component that throws when rendered, to trigger the boundary.
const ThrowingChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
};

// Suppress React's expected error logging during error boundary tests.
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders the default fallback on error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    // Default fallback is ErrorState-based; it should surface the error message.
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('renders a custom fallback and passes the error and reset handler', () => {
    const fallback = vi.fn((error: Error, reset: () => void) => (
      <div>
        <span>Custom fallback: {error.message}</span>
        <button onClick={reset}>Reset</button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback: Test error')).toBeInTheDocument();
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(typeof fallback.mock.calls[0][1]).toBe('function');
  });

  it('resets and re-renders children after reset is called', () => {
    let shouldThrow = true;

    const ToggleChild: React.FC = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered content</div>;
    };

    const fallback = (_error: Error, reset: () => void) => (
      <button
        onClick={() => {
          shouldThrow = false;
          reset();
        }}
      >
        Reset
      </button>
    );

    render(
      <ErrorBoundary fallback={fallback}>
        <ToggleChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Reset')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Reset'));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('calls onError when an error is caught', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe('Test error');
  });
});

describe('withErrorBoundary', () => {
  it('wraps a component and renders it when no error occurs', () => {
    const Wrapped = withErrorBoundary(() => <div>Wrapped content</div>);

    render(<Wrapped />);

    expect(screen.getByText('Wrapped content')).toBeInTheDocument();
  });

  it('wraps a component and renders the fallback when it throws', () => {
    const Wrapped = withErrorBoundary(ThrowingChild);

    render(<Wrapped />);

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('forwards props to the wrapped component', () => {
    const Wrapped = withErrorBoundary(ThrowingChild);

    render(<Wrapped shouldThrow={false} />);

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});