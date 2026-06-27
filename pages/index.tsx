import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  KeyRound, Layers3, Moon, Play, Sparkles, Sun, Workflow as WorkflowIcon, Wand2,
} from 'lucide-react';
import { useStudio } from '../lib/studio/store';
import { useGenerate } from '../lib/studio/useGenerate';
import { ALL_MODELS } from '../lib/prodia/catalog';
import type { Surface } from '../lib/studio/types';
import ApiKeyModal from '../components/studio/ApiKeyModal';
import Sidebar from '../components/studio/Sidebar';
import RegularSurface from '../components/studio/RegularSurface';
import Inspector from '../components/studio/Inspector';

const NodeStudio = dynamic(() => import('../components/studio/nodes/NodeStudio'), {
  ssr: false,
  loading: () => <SurfacePlaceholder label="the node graph" />,
});

const CanvasStudio = dynamic(() => import('../components/studio/canvas/CanvasStudio'), {
  ssr: false,
  loading: () => <SurfacePlaceholder label="the AI canvas" />,
});

function SurfacePlaceholder({ label }: { label: string }) {
  return (
    <div className="surface-fill">
      <div className="surface-loading">
        <div className="spinner" />
        <div style={{ textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: 16, color: 'var(--text)' }}>Preparing {label}…</strong>
          <span style={{ fontSize: 13 }}>This module is initializing.</span>
        </div>
      </div>
    </div>
  );
}

const MODES: { key: Surface; label: string; icon: any }[] = [
  { key: 'studio', label: 'Studio', icon: Sparkles },
  { key: 'canvas', label: 'Canvas', icon: Layers3 },
  { key: 'nodes', label: 'Nodes', icon: WorkflowIcon },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const theme = useStudio((s) => s.theme);
  const toggleTheme = useStudio((s) => s.toggleTheme);
  const surface = useStudio((s) => s.surface);
  const setSurface = useStudio((s) => s.setSurface);
  const apiKey = useStudio((s) => s.apiKey);
  const assets = useStudio((s) => s.assets);
  const params = useStudio((s) => s.params);
  const trackCost = useStudio((s) => s.trackCost);
  const addAsset = useStudio((s) => s.addAsset);
  const runGenerate = useGenerate();

  useEffect(() => {
    useStudio.getState().hydrate();
    setMounted(true);
    if (!useStudio.getState().apiKey) setKeyOpen(true);
  }, []);

  const running = assets.filter((a) => a.status === 'running').length;

  const onGenerate = () => {
    if (!apiKey) { setKeyOpen(true); return; }
    setError(runGenerate() ?? '');
  };

  return (
    <div className="pixio" data-theme={theme}>
      <Head>
        <title>Pixio Studio — Open Source AI Canvas, Nodes & Generation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <div>
            <div className="brand-title"><span className="brand-grad">Pixio Studio</span></div>
            <div className="brand-sub">{ALL_MODELS.length} Prodia models · open source</div>
          </div>
        </div>

        <nav className="modes">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.key} className={`mode ${surface === m.key ? 'is-active' : ''}`} onClick={() => setSurface(m.key)}>
                <Icon size={15} /> {m.label}
              </button>
            );
          })}
        </nav>

        <div className="top-actions">
          {running > 0 && <div className="run-pill"><div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> {running} generating</div>}
          <button className="btn icon ghost" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button className="btn sm" onClick={() => setKeyOpen(true)}><KeyRound size={14} /> API key</button>
          {surface === 'studio' && (
            <button className="btn primary" onClick={onGenerate}>
              <Play size={15} /> Generate
            </button>
          )}
        </div>
      </header>

      <div className="workspace" data-surface={surface}>
        {surface === 'studio' && (
          <>
            <aside className="rail rail-left">
              <div className="rail-scroll"><Sidebar onGenerate={onGenerate} /></div>
              <div className="rail-foot">
                {error && <div className="notice">{error}</div>}
                <button className="btn primary" style={{ width: '100%', padding: 14 }} onClick={onGenerate}>
                  <Wand2 size={15} /> Generate
                </button>
              </div>
            </aside>
            <main className="stage"><RegularSurface onSelect={setSelectedId} /></main>
            <aside className="rail rail-right"><Inspector selectedId={selectedId} onSelect={setSelectedId} /></aside>
          </>
        )}

        {surface === 'canvas' && (
          <main className="stage">
            <div className="surface-fill">
              <CanvasStudio apiKey={apiKey} params={params} trackCost={trackCost} theme={theme} onAsset={addAsset} />
            </div>
          </main>
        )}
        {surface === 'nodes' && (
          <main className="stage">
            <div className="surface-fill">
              <NodeStudio apiKey={apiKey} params={params} trackCost={trackCost} theme={theme} onAsset={addAsset} />
            </div>
          </main>
        )}
      </div>

      {keyOpen && <ApiKeyModal onClose={() => setKeyOpen(false)} />}
    </div>
  );
}
