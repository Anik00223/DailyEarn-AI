import { create } from 'zustand';
import type { Idea } from '../types/api.types';

interface IdeasState {
  ideas: Idea[];
  savedIdeas: Idea[];
  isGenerating: boolean;
  generationsToday: number;
  maxGenerations: number;
  setIdeas: (ideas: Idea[]) => void;
  addIdeas: (ideas: Idea[]) => void;
  saveIdea: (id: string) => void;
  dismissIdea: (id: string) => void;
  setSavedIdeas: (ideas: Idea[]) => void;
  setGenerating: (v: boolean) => void;
  incrementGenerations: () => void;
  resetGenerations: () => void;
}

export const useIdeasStore = create<IdeasState>((set) => ({
  ideas: [],
  savedIdeas: [],
  isGenerating: false,
  generationsToday: 0,
  maxGenerations: 10,

  setIdeas: (ideas: Idea[]) => set({ ideas }),

  addIdeas: (newIdeas: Idea[]) =>
    set((state) => ({ ideas: [...newIdeas, ...state.ideas] })),

  saveIdea: (id: string) =>
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id ? { ...idea, isSaved: !idea.isSaved } : idea
      ),
      savedIdeas: state.ideas.find((i) => i.id === id && !i.isSaved)
        ? [...state.savedIdeas, state.ideas.find((i) => i.id === id)!]
        : state.savedIdeas.filter((i) => i.id !== id),
    })),

  dismissIdea: (id: string) =>
    set((state) => ({
      ideas: state.ideas.filter((idea) => idea.id !== id),
    })),

  setSavedIdeas: (savedIdeas: Idea[]) => set({ savedIdeas }),

  setGenerating: (isGenerating: boolean) => set({ isGenerating }),

  incrementGenerations: () =>
    set((state) => ({ generationsToday: state.generationsToday + 1 })),

  resetGenerations: () => set({ generationsToday: 0 }),
}));
