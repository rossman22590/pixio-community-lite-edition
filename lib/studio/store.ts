// ──────────────────────────────────────────────────────────────────────────
// Pixio · Global studio store
// Shared app state across the three surfaces (studio / canvas / nodes):
// theme, api key, generation params, selected models, and the asset gallery.
// ──────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { createDefaultParams, type GenerationParams, type MediaMode } from '../prodia/types';
import type { StudioAsset, Surface, Theme } from './types';

const DEFAULT_PROMPT =
  'A translucent handheld AI canvas device on a glossy plum workbench, hot-pink light seams, violet glass reflections, cinematic studio lighting, editorial product photography, 8k';

interface StudioState {
  hydrated: boolean;
  theme: Theme;
  apiKey: string;
  surface: Surface;
  medium: MediaMode;
  trackCost: boolean;
  params: GenerationParams;
  selectedTypes: string[];
  assets: StudioAsset[];

  hydrate: () => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setApiKey: (k: string) => void;
  setSurface: (s: Surface) => void;
  setMedium: (m: MediaMode) => void;
  setTrackCost: (v: boolean) => void;
  patchParams: (patch: Partial<GenerationParams>) => void;
  resetParams: () => void;
  setSelectedTypes: (types: string[]) => void;
  toggleType: (type: string) => void;
  addAsset: (a: StudioAsset) => void;
  updateAsset: (id: string, patch: Partial<StudioAsset>) => void;
  clearAssets: () => void;
}

export const useStudio = create<StudioState>((set, get) => ({
  hydrated: false,
  theme: 'dark',
  apiKey: '',
  surface: 'studio',
  medium: 'image',
  trackCost: true,
  params: { ...createDefaultParams(), prompt: DEFAULT_PROMPT },
  selectedTypes: ['inference.flux-fast.schnell.txt2img.v2'],
  assets: [],

  hydrate: () => {
    if (typeof window === 'undefined' || get().hydrated) return;
    const theme = (localStorage.getItem('PIXIO_THEME') as Theme | null) ?? 'dark';
    const apiKey = localStorage.getItem('PIXIO_API_KEY') ?? '';
    const trackCost = localStorage.getItem('PIXIO_TRACK_COST');
    set({
      hydrated: true,
      theme,
      apiKey,
      trackCost: trackCost == null ? true : trackCost === '1',
    });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('PIXIO_THEME', theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  setApiKey: (apiKey) => {
    if (typeof window !== 'undefined') localStorage.setItem('PIXIO_API_KEY', apiKey);
    set({ apiKey });
  },

  setSurface: (surface) => set({ surface }),

  setMedium: (medium) =>
    set((state) => ({
      medium,
      selectedTypes:
        medium === 'video'
          ? ['inference.veo.fast.txt2vid.v2']
          : ['inference.flux-fast.schnell.txt2img.v2'],
      params: { ...state.params },
    })),

  setTrackCost: (trackCost) => {
    if (typeof window !== 'undefined') localStorage.setItem('PIXIO_TRACK_COST', trackCost ? '1' : '0');
    set({ trackCost });
  },

  patchParams: (patch) => set((state) => ({ params: { ...state.params, ...patch } })),
  resetParams: () => set({ params: { ...createDefaultParams(), prompt: DEFAULT_PROMPT } }),

  setSelectedTypes: (selectedTypes) => set({ selectedTypes }),
  toggleType: (type) =>
    set((state) => ({
      selectedTypes: state.selectedTypes.includes(type)
        ? state.selectedTypes.filter((t) => t !== type)
        : [...state.selectedTypes, type],
    })),

  addAsset: (asset) =>
    set((state) => {
      // Upsert by id so surfaces can stream the same asset through
      // running -> done/error without orphaning the "running" entry.
      const idx = state.assets.findIndex((a) => a.id === asset.id);
      if (idx === -1) return { assets: [asset, ...state.assets] };
      const next = state.assets.slice();
      next[idx] = { ...next[idx], ...asset };
      return { assets: next };
    }),
  updateAsset: (id, patch) =>
    set((state) => ({ assets: state.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  clearAssets: () => set({ assets: [] }),
}));
