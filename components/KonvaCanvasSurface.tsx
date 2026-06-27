import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
} from 'react-konva';
import {
  Download,
  Image as ImageIcon,
  Layers3,
  LocateFixed,
  Plus,
  Sparkles,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type CanvasStatus = 'running' | 'done' | 'error';

interface CanvasAsset {
  id: string;
  status: CanvasStatus;
  modelLabel: string;
  family: string;
  medium: 'image' | 'video';
  prompt: string;
  url?: string;
  isVideo?: boolean;
  error?: string;
  price?: { dollars?: number } | null;
}

interface KonvaCanvasSurfaceProps {
  assets: CanvasAsset[];
  prompt: string;
  selectedAssetId: string | null;
  runningCount: number;
  totalCost: number;
  onSelectAsset: (id: string) => void;
  onGenerate: () => void;
  onAddModelsToNodes: () => void;
}

type Position = { x: number; y: number };
type Placement = Position & {
  width: number;
  height: number;
  rotation: number;
};

const pageW = 860;
const pageH = 540;

const templateSlots: Placement[] = [
  { x: 48, y: 76, width: 362, height: 278, rotation: -1.4 },
  { x: 450, y: 82, width: 330, height: 204, rotation: 1.2 },
  { x: 450, y: 318, width: 154, height: 146, rotation: -0.8 },
  { x: 626, y: 318, width: 154, height: 146, rotation: 0.9 },
  { x: 78, y: 382, width: 270, height: 92, rotation: 0 },
  { x: 364, y: 372, width: 184, height: 102, rotation: 1.1 },
];

const railItems = [
  { label: 'Design', icon: Layers3 },
  { label: 'Media', icon: ImageIcon },
  { label: 'Text', icon: Type },
  { label: 'AI', icon: Sparkles },
];

const priceLabel = (price?: { dollars?: number } | null) =>
  typeof price?.dollars === 'number' ? `$${price.dollars.toFixed(4)}` : 'tracking';

const truncate = (text: string, max = 96) =>
  text.length > max ? `${text.slice(0, max - 1)}...` : text;

const getCoverCrop = (image: HTMLImageElement, width: number, height: number) => {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  if (imageRatio > targetRatio) {
    const cropWidth = image.height * targetRatio;
    return {
      x: (image.width - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: image.height,
    };
  }

  const cropHeight = image.width / targetRatio;
  return {
    x: 0,
    y: (image.height - cropHeight) / 2,
    width: image.width,
    height: cropHeight,
  };
};

function useCanvasImage(src?: string, isVideo?: boolean) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src || isVideo) {
      setImage(null);
      return;
    }

    let alive = true;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (alive) setImage(img);
    };
    img.onerror = () => {
      if (alive) setImage(null);
    };
    img.src = src;

    return () => {
      alive = false;
    };
  }, [src, isVideo]);

  return image;
}

function SelectionFrame({
  width,
  height,
  label,
}: {
  width: number;
  height: number;
  label: string;
}) {
  const handlePoints = [
    [0, 0],
    [width / 2, 0],
    [width, 0],
    [0, height / 2],
    [width, height / 2],
    [0, height],
    [width / 2, height],
    [width, height],
  ];

  return (
    <>
      <Rect
        width={width}
        height={height}
        cornerRadius={10}
        stroke="#ff4ecb"
        strokeWidth={2}
        dash={[9, 6]}
        listening={false}
      />
      {handlePoints.map(([x, y], index) => (
        <Rect
          key={index}
          x={x - 5}
          y={y - 5}
          width={10}
          height={10}
          cornerRadius={3}
          fill="#fff1fb"
          stroke="#ff4ecb"
          strokeWidth={1.5}
          listening={false}
        />
      ))}
      <Rect
        x={0}
        y={-34}
        width={Math.min(220, Math.max(124, label.length * 7))}
        height={24}
        cornerRadius={6}
        fill="#581c87"
        shadowColor="#ff4ecb"
        shadowBlur={12}
        shadowOpacity={0.24}
        listening={false}
      />
      <Text
        x={10}
        y={-28}
        width={Math.min(200, Math.max(104, label.length * 7))}
        text={truncate(label, 26)}
        fill="#fff1fb"
        fontSize={11}
        fontStyle="bold"
        listening={false}
      />
    </>
  );
}

function PageAsset({
  asset,
  placement,
  selected,
  onSelect,
  onMove,
}: {
  asset: CanvasAsset;
  placement: Placement;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, position: Position) => void;
}) {
  const image = useCanvasImage(asset.url, asset.isVideo);
  const crop = image ? getCoverCrop(image, placement.width, placement.height) : null;

  return (
    <Group
      x={placement.x}
      y={placement.y}
      rotation={placement.rotation}
      draggable
      onClick={() => onSelect(asset.id)}
      onTap={() => onSelect(asset.id)}
      onDragEnd={event => onMove(asset.id, { x: event.target.x(), y: event.target.y() })}
    >
      <Rect
        width={placement.width}
        height={placement.height}
        cornerRadius={12}
        fill="#3b1554"
        stroke={selected ? '#ff4ecb' : 'rgba(88,28,135,0.16)'}
        strokeWidth={selected ? 2 : 1}
        shadowColor={selected ? '#ff4ecb' : '#581c87'}
        shadowBlur={selected ? 24 : 14}
        shadowOpacity={selected ? 0.26 : 0.14}
        shadowOffsetY={10}
      />
      {asset.status === 'done' && image && crop && (
        <KonvaImage
          image={image}
          width={placement.width}
          height={placement.height}
          cornerRadius={12}
          crop={crop}
        />
      )}
      {asset.status === 'done' && asset.isVideo && (
        <>
          <Rect
            width={placement.width}
            height={placement.height}
            cornerRadius={12}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: placement.width, y: placement.height }}
            fillLinearGradientColorStops={[0, '#ff4ecb', 0.55, '#a855f7', 1, '#3b1554']}
          />
          <Circle
            x={placement.width / 2}
            y={placement.height / 2 - 12}
            radius={28}
            fill="rgba(255,241,251,0.24)"
            stroke="#fff1fb"
          />
          <Text
            x={0}
            y={placement.height / 2 + 28}
            width={placement.width}
            align="center"
            text="VIDEO"
            fill="#fff1fb"
            fontSize={13}
            fontStyle="bold"
          />
        </>
      )}
      {asset.status === 'running' && (
        <>
          <Rect
            x={14}
            y={14}
            width={placement.width - 28}
            height={placement.height - 28}
            cornerRadius={10}
            fill="rgba(255,78,203,0.16)"
            stroke="#e879f9"
            dash={[12, 10]}
          />
          <Text
            y={placement.height / 2 - 8}
            width={placement.width}
            align="center"
            text="rendering"
            fill="#fff1fb"
            fontSize={14}
            fontStyle="bold"
          />
        </>
      )}
      {asset.status === 'error' && (
        <Text
          x={18}
          y={placement.height / 2 - 22}
          width={placement.width - 36}
          text={asset.error ?? 'Generation failed'}
          fill="#ffd6f2"
          fontSize={13}
          align="center"
          lineHeight={1.25}
        />
      )}
      <Rect
        x={12}
        y={placement.height - 34}
        width={Math.min(placement.width - 24, 190)}
        height={22}
        cornerRadius={6}
        fill="rgba(88,28,135,0.74)"
      />
      <Text
        x={22}
        y={placement.height - 28}
        width={Math.min(placement.width - 44, 170)}
        text={`${asset.family} - ${priceLabel(asset.price)}`}
        fill="#fff1fb"
        fontSize={10}
        fontStyle="bold"
      />
      {selected && (
        <SelectionFrame width={placement.width} height={placement.height} label={asset.modelLabel} />
      )}
    </Group>
  );
}

function EmptyTemplate({ prompt }: { prompt: string }) {
  return (
    <>
      <Text
        x={56}
        y={52}
        width={190}
        text="PIXIO CANVAS"
        fill="#581c87"
        fontSize={12}
        fontStyle="bold"
      />
      <Text
        x={56}
        y={106}
        width={358}
        text={truncate(prompt, 84)}
        fill="#3a0b48"
        fontSize={37}
        fontStyle="bold"
        lineHeight={0.96}
      />
      <Rect
        x={474}
        y={58}
        width={310}
        height={356}
        cornerRadius={18}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 310, y: 356 }}
        fillLinearGradientColorStops={[0, '#ff4ecb', 0.52, '#a855f7', 1, '#581c87']}
        shadowColor="#ff4ecb"
        shadowBlur={28}
        shadowOpacity={0.22}
        shadowOffsetY={12}
      />
      <Rect
        x={504}
        y={90}
        width={250}
        height={214}
        cornerRadius={14}
        fill="rgba(255,241,251,0.16)"
        stroke="#fff1fb"
        dash={[14, 10]}
      />
      <Text
        x={522}
        y={176}
        width={214}
        align="center"
        text="Generate"
        fill="#fff1fb"
        fontSize={25}
        fontStyle="bold"
      />
      <Text
        x={522}
        y={211}
        width={214}
        align="center"
        text="then arrange the AI outputs here"
        fill="#ffd6f2"
        fontSize={13}
        lineHeight={1.3}
      />
      <Rect x={58} y={394} width={130} height={18} cornerRadius={9} fill="#ff8fcf" />
      <Rect x={58} y={424} width={292} height={12} cornerRadius={6} fill="#e879f9" opacity={0.75} />
      <Rect x={58} y={448} width={226} height={12} cornerRadius={6} fill="#a855f7" opacity={0.68} />
      <Rect x={504} y={334} width={86} height={30} cornerRadius={8} fill="#fff1fb" />
      <Rect x={604} y={334} width={122} height={30} cornerRadius={8} fill="#ffd6f2" />
    </>
  );
}

export default function KonvaCanvasSurface({
  assets,
  prompt,
  selectedAssetId,
  runningCount,
  totalCost,
  onSelectAsset,
  onGenerate,
  onAddModelsToNodes,
}: KonvaCanvasSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const pageRef = useRef<Konva.Group | null>(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const [scale, setScale] = useState(0.82);
  const [stagePos, setStagePos] = useState({ x: 90, y: 58 });
  const [placements, setPlacements] = useState<Record<string, Placement>>({});

  const selectedId = selectedAssetId ?? assets[0]?.id ?? null;
  const selectedAsset = assets.find(asset => asset.id === selectedId);
  const promptHeadline = useMemo(() => truncate(prompt, 54), [prompt]);

  const fitScale = useMemo(() => {
    const widthFit = (size.width - 104) / pageW;
    const heightFit = (size.height - 92) / pageH;
    return Math.min(0.94, Math.max(0.5, Math.min(widthFit, heightFit)));
  }, [size.height, size.width]);

  const centerForScale = useCallback((nextScale: number) => ({
    x: Math.round((size.width - pageW * nextScale) / 2),
    y: Math.round((size.height - pageH * nextScale) / 2),
  }), [size.height, size.width]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setSize({
          width: Math.max(520, rect.width),
          height: Math.max(430, rect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setScale(fitScale);
    setStagePos(centerForScale(fitScale));
  }, [centerForScale, fitScale]);

  useEffect(() => {
    setPlacements(prev => {
      const next = { ...prev };
      assets.forEach((asset, index) => {
        if (!next[asset.id]) {
          next[asset.id] = templateSlots[index % templateSlots.length];
        }
      });
      return next;
    });
  }, [assets]);

  const resetView = () => {
    setScale(fitScale);
    setStagePos(centerForScale(fitScale));
  };

  const zoomBy = (amount: number) => {
    setScale(prev => Math.min(1.7, Math.max(0.42, prev + amount)));
  };

  const exportPage = () => {
    const url = pageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pixio-canvas-page.png';
    link.click();
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const oldScale = scale;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextScale = Math.min(1.7, Math.max(0.42, oldScale + direction * 0.08));
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setScale(nextScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    });
  };

  return (
    <div className="konva-shell">
      <div className="canvas-editor-topbar">
        <div className="canvas-editor-brand">
          <span>Pixio Canvas</span>
          <strong>Presentation 16:10</strong>
        </div>
        <div className="canvas-editor-toolbar" aria-label="Canvas tools">
          <button className="icon-button" onClick={() => zoomBy(-0.1)} title="Zoom out"><ZoomOut size={15} /></button>
          <span className="canvas-zoom-readout">{Math.round(scale * 100)}%</span>
          <button className="icon-button" onClick={() => zoomBy(0.1)} title="Zoom in"><ZoomIn size={15} /></button>
          <button className="icon-button" onClick={resetView} title="Fit page"><LocateFixed size={15} /></button>
          <button className="secondary-button" onClick={exportPage}><Download size={15} /> Export</button>
          <button className="secondary-button" onClick={onAddModelsToNodes}><Plus size={15} /> Nodes</button>
          <button className="primary-button" onClick={onGenerate}><Sparkles size={15} /> Compose</button>
        </div>
      </div>

      <div className="canvas-editor-body">
        <aside className="canvas-left-rail" aria-label="Canvas design rail">
          {railItems.map(item => {
            const Icon = item.icon;
            return (
              <button className="canvas-rail-tab" key={item.label} type="button" title={item.label}>
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="canvas-template-stack" aria-hidden="true">
            <div className="canvas-template-card hot" />
            <div className="canvas-template-card violet" />
            <div className="canvas-template-card blush" />
          </div>
        </aside>

        <div className="canvas-workbench" ref={containerRef}>
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            x={stagePos.x}
            y={stagePos.y}
            scaleX={scale}
            scaleY={scale}
            draggable
            onDragEnd={event => setStagePos({ x: event.target.x(), y: event.target.y() })}
            onWheel={handleWheel}
          >
            <Layer>
              <Rect x={-2400} y={-1800} width={5600} height={4200} fill="#16071d" />
              <Group ref={pageRef}>
                <Rect
                  width={pageW}
                  height={pageH}
                  cornerRadius={4}
                  fill="#fff1fb"
                  shadowColor="#581c87"
                  shadowBlur={34}
                  shadowOpacity={0.32}
                  shadowOffsetY={18}
                />
                <Rect x={0} y={0} width={pageW} height={64} fill="#ffd6f2" />
                <Rect
                  x={654}
                  y={0}
                  width={206}
                  height={pageH}
                  fillLinearGradientStartPoint={{ x: 654, y: 0 }}
                  fillLinearGradientEndPoint={{ x: 860, y: 540 }}
                  fillLinearGradientColorStops={[0, '#ff8fcf', 0.54, '#e879f9', 1, '#a855f7']}
                  opacity={0.92}
                />
                <Circle x={724} y={110} radius={78} fill="#fff1fb" opacity={0.24} />
                <Circle x={842} y={398} radius={132} fill="#581c87" opacity={0.14} />
                <Text
                  x={42}
                  y={24}
                  width={360}
                  text={promptHeadline}
                  fill="#581c87"
                  fontSize={13}
                  fontStyle="bold"
                />
                <Text
                  x={716}
                  y={25}
                  width={96}
                  text="AI layout"
                  fill="#fff1fb"
                  align="right"
                  fontSize={12}
                  fontStyle="bold"
                />

                {assets.length === 0 ? (
                  <EmptyTemplate prompt={prompt} />
                ) : (
                  assets.map(asset => (
                    <PageAsset
                      key={asset.id}
                      asset={asset}
                      placement={placements[asset.id] ?? templateSlots[0]}
                      selected={asset.id === selectedId}
                      onSelect={onSelectAsset}
                      onMove={(id, position) => setPlacements(prev => ({
                        ...prev,
                        [id]: {
                          ...(prev[id] ?? templateSlots[0]),
                          ...position,
                        },
                      }))}
                    />
                  ))
                )}
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>

      <div className="canvas-page-strip">
        <div className="canvas-page-thumb is-active">
          <span>1</span>
        </div>
        <button className="canvas-add-page" type="button" onClick={onGenerate}>
          <Plus size={14} /> Add AI page
        </button>
        <div className="canvas-status-bar">
          <strong>{assets.length} assets</strong>
          <strong>{runningCount} running</strong>
          <strong>${totalCost.toFixed(4)}</strong>
          {selectedAsset && <span>{truncate(selectedAsset.modelLabel, 34)}</span>}
        </div>
      </div>
    </div>
  );
}
