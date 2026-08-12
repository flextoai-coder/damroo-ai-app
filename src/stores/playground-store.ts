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
  /** How many images were requested — sizes the loading skeleton before any results exist. */
  imageCount: number;
  /** Durable preview URLs once generation completes, in the order the provider returned them. */
  imageUrls: string[];
  generationId: string | null;
  error: string | null;
  /** Whether the brand kit (logo/name/colors) was actually used for this generation. */
  brandKitApplied: boolean;
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
