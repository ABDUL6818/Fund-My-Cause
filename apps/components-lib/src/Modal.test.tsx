import { useRef, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with aria attributes when title is set', () => {
    render(
      <Modal open onClose={() => {}} title="My Title">
        <p>Content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');

    const labelledby = dialog.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const labelEl = document.getElementById(labelledby as string);
    expect(labelEl).toBeInTheDocument();
    expect(labelEl).toHaveTextContent('My Title');
  });

  it('moves focus into the dialog on open', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    render(
      <Modal open onClose={() => {}} title="Focus Test">
        <button>Inside</button>
      </Modal>,
    );

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it('cycles focus with Tab within the dialog', async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={() => {}} title="Tab Test">
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </Modal>,
    );

    const first = screen.getByText('First');
    const second = screen.getByText('Second');
    const third = screen.getByText('Third');

    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });

    first.focus();
    expect(document.activeElement).toBe(first);

    await user.tab();
    expect(document.activeElement).toBe(second);

    await user.tab();
    expect(document.activeElement).toBe(third);

    // Tab from last element wraps to first
    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it('cycles focus backwards with Shift+Tab within the dialog', async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={() => {}} title="Shift Tab Test">
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </Modal>,
    );

    const first = screen.getByText('First');
    const second = screen.getByText('Second');
    const third = screen.getByText('Third');

    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });

    first.focus();
    expect(document.activeElement).toBe(first);

    // Shift+Tab from first wraps to last
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(third);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(second);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(first);
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Escape Test">
        <button>Inside</button>
      </Modal>,
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    function Harness() {
      const [open, setOpen] = useState(true);
      const closeRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={closeRef} onClick={() => setOpen(false)}>
            Close
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Restore Test">
            <button>Inside</button>
          </Modal>
        </>
      );
    }

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });

    screen.getByText('Close').click();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Backdrop Test">
        <p>Content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement as HTMLElement;
    expect(backdrop).toBeTruthy();

    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog content', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Inside Click Test">
        <p>Content</p>
      </Modal>,
    );

    await user.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });
});