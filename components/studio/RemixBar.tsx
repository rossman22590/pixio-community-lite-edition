import {
  Columns2, Download, Eraser, Film, Maximize2, Shuffle, Trash2, Wand2, Workflow,
} from 'lucide-react';
import { useRemix } from '../../lib/studio/useRemix';
import { useStudio } from '../../lib/studio/store';
import type { StudioAsset } from '../../lib/studio/types';

function download(a: StudioAsset) {
  if (!a.url) return;
  const el = document.createElement('a');
  el.href = a.url;
  el.download = `pixio-${a.modelLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${a.isVideo ? 'mp4' : 'png'}`;
  el.click();
}

interface Props {
  asset: StudioAsset;
  variant?: 'overlay' | 'inline';
}

export default function RemixBar({ asset, variant = 'overlay' }: Props) {
  const { vary, upscale, removeBg, animate, toCanvas, toNodes } = useRemix();
  const toggleCompare = useStudio((s) => s.toggleCompare);
  const removeAsset = useStudio((s) => s.removeAsset);
  const inCompare = useStudio((s) => s.compareIds.includes(asset.id));
  const ready = asset.status === 'done' && !!asset.url;
  const img = ready && !asset.isVideo;

  const Btn = ({ icon, label, onClick, active, danger }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; danger?: boolean }) => (
    <button
      className={`remix-btn${active ? ' active' : ''}${danger ? ' danger' : ''}`}
      title={label}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {icon}
    </button>
  );

  return (
    <div className={`remix-bar ${variant}`} onClick={(e) => e.stopPropagation()}>
      {img && <Btn icon={<Shuffle size={15} />} label="Make variations" onClick={() => vary(asset)} />}
      {img && <Btn icon={<Wand2 size={15} />} label="Edit on canvas" onClick={() => toCanvas(asset)} />}
      {img && <Btn icon={<Maximize2 size={15} />} label="Upscale" onClick={() => upscale(asset)} />}
      {img && <Btn icon={<Eraser size={15} />} label="Remove background" onClick={() => removeBg(asset)} />}
      {img && <Btn icon={<Film size={15} />} label="Animate to video" onClick={() => animate(asset)} />}
      {img && <Btn icon={<Workflow size={15} />} label="Send to Nodes" onClick={() => toNodes(asset)} />}
      {ready && <Btn icon={<Columns2 size={15} />} label="Compare" active={inCompare} onClick={() => toggleCompare(asset.id)} />}
      {ready && <Btn icon={<Download size={15} />} label="Download" onClick={() => download(asset)} />}
      <Btn icon={<Trash2 size={15} />} label="Delete" danger onClick={() => removeAsset(asset.id)} />
    </div>
  );
}
