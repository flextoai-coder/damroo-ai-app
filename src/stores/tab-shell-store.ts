import { create } from 'zustand';

type TabShellState = {
  fabOpen: boolean;
  /** Floating tab bar visible (hides on scroll-down). */
  tabBarVisible: boolean;
  setFabOpen: (open: boolean) => void;
  toggleFab: () => void;
  setTabBarVisible: (visible: boolean) => void;
};

export const useTabShellStore = create<TabShellState>((set) => ({
  fabOpen: false,
  tabBarVisible: true,
  setFabOpen: (fabOpen) => set({ fabOpen }),
  toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen })),
  setTabBarVisible: (tabBarVisible) => set({ tabBarVisible }),
}));
