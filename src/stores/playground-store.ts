import * as Sentry from '@sentry/react-native';
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
  addUserTurn: (turn) => {
    Sentry.addBreadcrumb({
      category: 'playground',
      message: 'user turn added',
      level: 'info',
      data: { turnId: turn.id },
    });
    set((s) => ({
      turns: [
        ...s.turns,
        {
          ...turn,
          role: 'user',
          createdAt: turn.createdAt ?? new Date().toISOString(),
        },
      ],
    }));
  },
  addAssistantTurn: (turn) => {
    Sentry.addBreadcrumb({
      category: 'playground',
      message: 'assistant turn added',
      level: 'info',
      data: { turnId: turn.id, parentUserId: turn.parentUserId, status: turn.status },
    });
    set((s) => ({
      turns: [
        ...s.turns,
        {
          ...turn,
          role: 'assistant',
          createdAt: turn.createdAt ?? new Date().toISOString(),
        },
      ],
    }));
  },
  // Breadcrumb trail (user turn added → assistant turn added → generation id
  // received → generation completed/failed) is the diagnostic path for
  // pinpointing which state transition preceded a render throw caught by
  // AppScreen's scoped error boundary — see plan notes in app-screen.tsx.
  patchAssistant: (id, patch) => {
    if (patch.generationId !== undefined) {
      Sentry.addBreadcrumb({
        category: 'playground',
        message: 'generation id received',
        level: 'info',
        data: { id, generationId: patch.generationId },
      });
    } else if (patch.status === 'done') {
      Sentry.addBreadcrumb({
        category: 'playground',
        message: 'generation completed',
        level: 'info',
        data: { id, imageCount: patch.imageUrls?.length },
      });
    } else if (patch.status === 'error') {
      Sentry.addBreadcrumb({
        category: 'playground',
        message: 'generation failed',
        level: 'warning',
        data: { id, error: patch.error },
      });
    } else if (patch.status === 'loading') {
      Sentry.addBreadcrumb({
        category: 'playground',
        message: 'generation (re)started',
        level: 'info',
        data: { id },
      });
    }
    set((s) => ({
      turns: s.turns.map((t) =>
        t.role === 'assistant' && t.id === id ? { ...t, ...patch } : t,
      ),
    }));
  },
  clear: () => set({ turns: [], conversationId: null }),
}));
