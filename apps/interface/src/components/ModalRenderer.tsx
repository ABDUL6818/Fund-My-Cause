"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useModalSlice } from "@/hooks/useUiSlice";
import type { ModalConfig } from "@/store/useModalStore";
import { Modal } from "@interface/components-lib";

function ModalItem({
  modal,
  index,
  total,
  onClose,
}: {
  modal: ModalConfig;
  index: number;
  total: number;
  onClose: () => void;
}) {
  const isTop = index === total - 1;
  const offset = (total - 1 - index) * 8;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isTop) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const dialog = dialogRef.current;
    const focusable = getFocusableElements(dialog);
    (focusable[0] ?? dialog)?.focus();

    return () => {
      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [isTop]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isTop) return;

    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    const focusable = getFocusableElements(dialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !dialog?.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !dialog?.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "animate-in fade-in duration-200",
      )}
      style={{ zIndex: 50 + index }}
      role="presentation"
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          isTop ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => modal.closeOnBackdropClick !== false && onClose()}
        aria-hidden="true"
      />
      <div
        className="relative w-full mx-4"
        style={{
          transform: `translateY(-${offset}px) scale(${1 - (total - 1 - index) * 0.02})`,
        }}
      >
        <Modal
          open
          onClose={onClose}
          title={modal.title}
          footer={modal.footer}
          size={modal.size ?? "md"}
          closeOnBackdropClick={false}
          showCloseButton
          className="mx-0"
        >
          {modal.content}
        </Modal>
      </div>
    </div>
  );
}

/**
 * Renders whatever useModal()'s openModal() has pushed onto the stack.
 * Mount this once near the app root — Zustand's store is a singleton so no
 * Provider wrapping is needed.
 */
export function ModalRenderer() {
  const { stack, closeModal } = useModalSlice();

  return (
    <>
      {stack.map((modal, index) => (
        <ModalItem
          key={modal.id}
          modal={modal}
          index={index}
          total={stack.length}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </>
  );
}
