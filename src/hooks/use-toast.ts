import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

interface UseToastReturn {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToast = (): UseToastReturn => {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      ...props,
    };

    setState((prev) => ({
      toasts: [...prev.toasts, newToast],
    }));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
};