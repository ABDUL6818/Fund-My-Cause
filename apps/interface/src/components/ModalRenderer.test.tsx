import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the shared components-lib Modal so we can assert that the interface
// ModalRenderer delegates to it (issue #1654: "Use components-lib Modal
// everywhere").
jest.mock('@components-lib/Modal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      open,
      onClose,
      title,
      children,
      ...rest
    }: {
      open: boolean;
      onClose: () => void;
      title?: string;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => {
      if (!open) return null;
      return (
        <div role="dialog" aria-modal="true" data-testid="shared-modal" {...rest}>
          {title ? <h2>{title}</h2> : null}
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
          <div data-testid="shared-modal-body">{children}</div>
        </div>
      );
    },
  };
});

// Mock the shared ErrorBoundary / ErrorFallback from components-lib so we can
// assert the interface delegates to the single fallback contract (issue #1657).
jest.mock('@components-lib/ErrorBoundary', () => {
  const React = require('react');
  const ErrorFallback = ({
    error,
    resetErrorBoundary,
  }: {
    error?: Error;
    resetErrorBoundary?: () => void;
  }) => (
    <div role="alert" data-testid="shared-error-fallback">
      <span>{error?.message ?? 'Something went wrong'}</span>
      {resetErrorBoundary ? (
        <button type="button" onClick={resetErrorBoundary}>
          Try again
        </button>
      ) : null}
    </div>
  );

  class ErrorBoundary extends React.Component<
    { children?: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children?: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch() {
      // no-op for tests
    }

    render() {
      if (this.state.hasError) {
        return (
          this.props.fallback ?? (
            <ErrorFallback
              error={this.state.error}
              resetErrorBoundary={() => this.setState({ hasError: false })}
            />
          )
        );
      }
      return this.props.children;
    }
  }

  return {
    __esModule: true,
    default: ErrorBoundary,
    ErrorBoundary,
    ErrorFallback,
  };
});

// ---------------------------------------------------------------------------
// Imports under test (after mocks are declared)
// ---------------------------------------------------------------------------

import ModalRenderer from './ModalRenderer';
import InterfaceErrorBoundary from './ErrorBoundary';
import RouteError from './RouteError';

// ---------------------------------------------------------------------------
// ModalRenderer tests (issue #1654)
// ---------------------------------------------------------------------------

describe('ModalRenderer', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <p>Modal body content</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<ModalRenderer {...baseProps} open={false} />);
    expect(screen.queryByTestId('shared-modal')).not.toBeInTheDocument();
  });

  it('renders the shared components-lib Modal when open', () => {
    render(<ModalRenderer {...baseProps} />);
    const modal = screen.getByTestId('shared-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<ModalRenderer {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<ModalRenderer {...baseProps} onClose={onClose} />);
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal body', () => {
    const onClose = jest.fn();
    render(<ModalRenderer {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('shared-modal-body'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(<ModalRenderer {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports stacked modals and closes only the topmost one', () => {
    const onCloseFirst = jest.fn();
    const onCloseSecond = jest.fn();

    render(
      <>
        <ModalRenderer
          open
          onClose={onCloseFirst}
          title="First Modal"
          children={<p>First body</p>}
        />
        <ModalRenderer
          open
          onClose={onCloseSecond}
          title="Second Modal"
          children={<p>Second body</p>}
        />
      </>,
    );

    const modals = screen.getAllByTestId('shared-modal');
    expect(modals).toHaveLength(2);
    expect(screen.getByText('First Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();

    // Close the topmost (second) modal via its close button.
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    expect(onCloseSecond).toHaveBeenCalledTimes(1);
    expect(onCloseFirst).not.toHaveBeenCalled();
  });

  it('has no accessibility violations when open', async () => {
    const { container } = render(<ModalRenderer {...baseProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// Interface ErrorBoundary tests (issue #1657)
// ---------------------------------------------------------------------------

describe('Interface ErrorBoundary', () => {
  const Boom = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('boom');
    }
    return <div>All good</div>;
  };

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // React logs caught errors; silence them for clean test output.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <InterfaceErrorBoundary>
        <Boom shouldThrow={false} />
      </InterfaceErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('delegates to the shared ErrorFallback contract on error', () => {
    render(
      <InterfaceErrorBoundary>
        <Boom shouldThrow />
      </InterfaceErrorBoundary>,
    );
    const fallback = screen.getByTestId('shared-error-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('boom');
  });

  it('recovers when the shared fallback reset is triggered', async () => {
    render(
      <InterfaceErrorBoundary>
        <Boom shouldThrow />
      </InterfaceErrorBoundary>,
    );
    expect(screen.getByTestId('shared-error-fallback')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('shared-error-fallback')).not.toBeInTheDocument();
    });
  });

  it('has no accessibility violations in the fallback state', async () => {
    const { container } = render(
      <InterfaceErrorBoundary>
        <Boom shouldThrow />
      </InterfaceErrorBoundary>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// RouteError tests (issue #1657)
// ---------------------------------------------------------------------------

describe('RouteError', () => {
  it('renders the shared ErrorFallback for route errors', () => {
    const error = new Error('route failed');
    render(<RouteError error={error} resetErrorBoundary={jest.fn()} />);
    const fallback = screen.getByTestId('shared-error-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('route failed');
  });

  it('invokes resetErrorBoundary when retry is clicked', () => {
    const resetErrorBoundary = jest.fn();
    render(
      <RouteError error={new Error('route failed')} resetErrorBoundary={resetErrorBoundary} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('renders the shared fallback without an error object', () => {
    render(<RouteError />);
    expect(screen.getByTestId('shared-error-fallback')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RouteError error={new Error('route failed')} resetErrorBoundary={jest.fn()} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});