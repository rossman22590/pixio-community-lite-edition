// ──────────────────────────────────────────────────────────────────────────
// Pixio · Shared studio types + design tokens
// Used across the classic studio, the node graph and the canvas editor.
// ──────────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';
export type Surface = 'studio' | 'canvas' | 'nodes';

/** A finished (or in-flight) generation, shareable across surfaces. */
export interface StudioAsset {
  id: string;
  status: 'running' | 'done' | 'error';
  url?: string;
  isVideo?: boolean;
  prompt: string;
  modelType: string;
  modelLabel: string;
  family: string;
  source: Surface;
  createdAt: number;
  price?: number | null;
  error?: string;
}

/** Canonical design tokens. Kept in JS so every surface (incl. Konva, which has
 *  no CSS) shares one palette. Mirrors the CSS custom properties in index.css. */
export const TOKENS = {
  bg: '#120716',
  panel: '#1b0a22',
  panel2: '#25102f',
  line: 'rgba(255,214,242,0.13)',
  lineStrong: 'rgba(255,214,242,0.26)',
  text: '#fff4fb',
  muted: 'rgba(255,229,247,0.66)',
  faint: 'rgba(255,229,247,0.40)',
  pink: '#ff4ecb',
  pinkSoft: '#ff8fcf',
  violet: '#a855f7',
  magenta: '#ec4899',
  cyan: '#22d3ee',
  mint: '#34d399',
  danger: '#fb7185',
  accent: 'linear-gradient(135deg,#ff5fb7,#a855f7)',
  radius: 14,
  radiusSm: 10,
  shadow: '0 18px 50px rgba(8,2,12,0.55)',
  font: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;
