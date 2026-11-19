"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export const TOAST_MAX = 5;
export const TOAST_DEFAULT_DURATION = 5000;

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  txHash?: string;
  duration: number;
}

export interface ToastOptions {
  type?: ToastType;
  txHash?: string;
  /** Auto-dismiss duration in ms. Use 0 to disable auto-dismiss. */
  duration?: number;
}

export interface ToastApi {
  toasts: Toast[];
  /** Show a toast. Accepts a message plus options, or a message and type. */
  show: (
    message: string,
    typeOrOptions?: ToastType | ToastOptions,
    txHash?: string,
  ) => string;
  /** Dismiss a toast by id. */
  dismiss: (id: string) => void;
  /** Dismiss all toasts. */
  dismissAll: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

function resolveOptions(
  typeOrOptions?: ToastType | ToastOptions,
  txHash?: string,
): Required<Pick<Toast, "type" | "duration">> & { txHash?: string } {
  if (typeof typeOrOptions === "string") {
    return {
      type: typeOrOptions,
      txHash,
      duration:
        typeOrOptions === "error" ? 0 : TOAST_DEFAULT_DURATION,
    };
  }
  const type = typeOrOptions?.type ?? "info";
  return {
    type,
    txHash: typeOrOptions?.txHash,
    duration:
      typeOrOptions?.duration ?? (type === "error" ? 0 : TOAST_DEFAULT_DURATION),
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (
      message: string,
      typeOrOptions?: ToastType | ToastOptions,
      txHash?: string,
    ) => {
      const { type, txHash: resolvedTxHash, duration } = resolveOptions(
        typeOrOptions,
        txHash,
      );
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => {
        const next = [
          ...prev,
          { id, message, type, txHash: resolvedTxHash, duration },
        ];
        return next.length > TOAST_MAX
          ? next.slice(next.length - TOAST_MAX)
          : next;
      });

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const fallbackToast: ToastApi = {
  toasts: [],
  show: () => "",
  dismiss: () => {},
  dismissAll: () => {},
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx || fallbackToast;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
=======

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="text-green-400" size={20} />,
    error: <AlertCircle className="text-red-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />,
    warning: <AlertTriangle className="text-yellow-400" size={20} />,
  };

  const borders = {
    success: "border-green-400/30",
    error: "border-red-400/30",
    info: "border-blue-400/30",
    warning: "border-yellow-400/30",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-[var(--color-surface)] rounded-lg border ${borders[toast.type]} shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-right`}
    >
      {icons[toast.type]}
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-primary)]">
          {toast.message}
        </p>
        {toast.txHash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View transaction on Stellar Expert (opens in new tab)"
            className="text-xs text-[var(--color-brand)] hover:underline mt-1 inline-block"
          >
            View on Stellar Expert →
          </a>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}
