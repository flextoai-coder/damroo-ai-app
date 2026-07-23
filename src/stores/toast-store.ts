import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

type ToastState = {
  message: string | null;
  tone: ToastTone;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  show: (message, tone = 'info') => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, tone });
    hideTimer = setTimeout(() => {
      set({ message: null });
      hideTimer = null;
    }, 3200);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    set({ message: null });
  },
}));

export function toast(message: string, tone: ToastTone = 'info') {
  useToastStore.getState().show(message, tone);
}
