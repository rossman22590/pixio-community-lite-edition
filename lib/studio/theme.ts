// ──────────────────────────────────────────────────────────────────────────
// Pixio · Accent system
// 20 curated accent combos. Each maps onto the accent-related CSS variables so
// the whole app (shell + node + canvas chrome, both light & dark) recolors live.
// ──────────────────────────────────────────────────────────────────────────

export interface Accent {
  id: string;
  name: string;
  c1: string; // primary
  c2: string; // secondary
}

export const ACCENTS: Accent[] = [
  { id: 'pixio', name: 'Pixio', c1: '#ff5fb7', c2: '#8b5cf6' },
  { id: 'sunset', name: 'Sunset', c1: '#fb7185', c2: '#f59e0b' },
  { id: 'ocean', name: 'Ocean', c1: '#38bdf8', c2: '#3b82f6' },
  { id: 'aurora', name: 'Aurora', c1: '#34d399', c2: '#22d3ee' },
  { id: 'grape', name: 'Grape', c1: '#a855f7', c2: '#6366f1' },
  { id: 'flamingo', name: 'Flamingo', c1: '#f472b6', c2: '#fb7185' },
  { id: 'citrus', name: 'Citrus', c1: '#f59e0b', c2: '#ef4444' },
  { id: 'mint', name: 'Mint', c1: '#34d399', c2: '#14b8a6' },
  { id: 'royal', name: 'Royal', c1: '#6366f1', c2: '#8b5cf6' },
  { id: 'coral', name: 'Coral', c1: '#ff7a59', c2: '#ff5fb7' },
  { id: 'lagoon', name: 'Lagoon', c1: '#06b6d4', c2: '#14b8a6' },
  { id: 'berry', name: 'Berry', c1: '#ec4899', c2: '#a855f7' },
  { id: 'ember', name: 'Ember', c1: '#ef4444', c2: '#f59e0b' },
  { id: 'sky', name: 'Sky', c1: '#38bdf8', c2: '#818cf8' },
  { id: 'lime', name: 'Lime', c1: '#84cc16', c2: '#22c55e' },
  { id: 'fuchsia', name: 'Fuchsia', c1: '#c026d3', c2: '#7c3aed' },
  { id: 'peach', name: 'Peach', c1: '#fda4af', c2: '#fb923c' },
  { id: 'neon', name: 'Neon', c1: '#d946ef', c2: '#22d3ee' },
  { id: 'rosegold', name: 'Rose Gold', c1: '#fb7185', c2: '#fbbf24' },
  { id: 'graphite', name: 'Graphite', c1: '#94a3b8', c2: '#64748b' },
];

export const getAccent = (id: string): Accent => ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
const rgba = (hex: string, a: number) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const lighten = (hex: string, amt: number) => {
  const [r, g, b] = hexToRgb(hex);
  const m = (v: number) => Math.round(v + (255 - v) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
};

/** CSS-variable overrides for an accent — spread onto the root element's style. */
export function accentVars(a: Accent): Record<string, string> {
  return {
    '--pink': a.c1,
    '--pink-soft': lighten(a.c1, 0.28),
    '--violet': a.c2,
    '--magenta': a.c1,
    // fold the old accent hues onto the chosen pair so only two colors show
    '--cyan': a.c2,
    '--mint': a.c1,
    '--accent': `linear-gradient(135deg, ${a.c1} 0%, ${a.c2} 100%)`,
    '--accent-soft': `linear-gradient(135deg, ${rgba(a.c1, 0.16)}, ${rgba(a.c2, 0.16)})`,
    '--line-strong': rgba(a.c1, 0.42),
    '--glow-accent': `0 8px 34px ${rgba(a.c1, 0.45)}, 0 0 60px ${rgba(a.c2, 0.22)}`,
  };
}
