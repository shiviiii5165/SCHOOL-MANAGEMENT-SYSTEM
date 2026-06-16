import { create } from 'zustand';

interface ChatState {
  isOpen: boolean;
  sessionId: string | null;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  setSessionId: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  sessionId: null, // Generates dynamically or loads from API
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  setSessionId: (id) => set({ sessionId: id }),
}));
