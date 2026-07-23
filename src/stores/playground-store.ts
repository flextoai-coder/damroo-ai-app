import { create } from 'zustand';

import type { ComposerAttachment } from '@/stores/chat-composer-store';

export type UserTurn = {
  id: string;
  role: 'user';
  prompt: string;
  attachments: ComposerAttachment[];
  aspectRatio: string;
  modelId: string;
  createdAt: string;
};

export type AssistantTurn = {
  id: string;
  role: 'assistant';
  status: 'loading' | 'done' | 'error';
  aspectRatio: string;
  /** Durable preview URL when generation completes. */
  imageUrl: string | null;
  generationId: string | null;
  error: string | null;
  /** Links back to the user turn that spawned this response. */
  parentUserId: string;
  createdAt: string;
};

export type PlaygroundTurn = UserTurn | AssistantTurn;

type PlaygroundState = {
  turns: PlaygroundTurn[];
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  addUserTurn: (turn: Omit<UserTurn, 'role' | 'createdAt'> & { createdAt?: string }) => void;
  addAssistantTurn: (
    turn: Omit<AssistantTurn, 'role' | 'createdAt'> & { createdAt?: string },
  ) => void;
  patchAssistant: (id: string, patch: Partial<AssistantTurn>) => void;
  clear: () => void;
};

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  turns: [],
  conversationId: null,
  setConversationId: (conversationId) => set({ conversationId }),
  addUserTurn: (turn) =>
    set((s) => ({
      turns: [
        ...s.turns,
        {
          ...turn,
          role: 'user',
          createdAt: turn.createdAt ?? new Date().toISOString(),
        },
      ],
    })),
  addAssistantTurn: (turn) =>
    set((s) => ({
      turns: [
        ...s.turns,
        {
          ...turn,
          role: 'assistant',
          createdAt: turn.createdAt ?? new Date().toISOString(),
        },
      ],
    })),
  patchAssistant: (id, patch) =>
    set((s) => ({
      turns: s.turns.map((t) =>
        t.role === 'assistant' && t.id === id ? { ...t, ...patch } : t,
      ),
    })),
  clear: () => set({ turns: [], conversationId: null }),
}));
