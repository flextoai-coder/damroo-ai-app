import { create } from 'zustand';

type TabShellState = {
  fabOpen: boolean;
  /** Floating tab bar visible (hides on scroll-down). */
  tabBarVisible: boolean;
  /**
   * Index (tab declaration order) of the currently focused tab screen —
   * sourced straight from React Navigation's own `state.index`. Each
   * screen's slide transition (`AppScreen`'s `tabIndex` prop) reads this
   * instead of the navigator's own Animated-driven scene interpolation,
   * which can get its shared value stuck mid-transition on interrupted
   * hops and leave a screen permanently off-screen.
   */
  activeTabIndex: number;
  setFabOpen: (open: boolean) => void;
  toggleFab: () => void;
  setTabBarVisible: (visible: boolean) => void;
  setActiveTabIndex: (index: number) => void;
};

export const useTabShellStore = create<TabShellState>((set) => ({
  fabOpen: false,
  tabBarVisible: true,
  activeTabIndex: 0,
  setFabOpen: (fabOpen) => set({ fabOpen }),
  toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen })),
  setTabBarVisible: (tabBarVisible) => set({ tabBarVisible }),
  setActiveTabIndex: (activeTabIndex) => set({ activeTabIndex }),
}));
