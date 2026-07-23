import { create } from 'zustand';

export type AppModule = 'image' | 'video';

type ModuleState = {
  module: AppModule;
  /** Video is locked in v1 — always force image if something tries to set video. */
  setModule: (module: AppModule) => void;
};

export const useModuleStore = create<ModuleState>((set) => ({
  module: 'image',
  setModule: (module) => {
    if (module === 'video') {
      return;
    }
    set({ module: 'image' });
  },
}));
