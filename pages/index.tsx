import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

type Mode = 'image' | 'video';
type Theme = 'dark' | 'light';
type ImgFamily = 'FLUX' | 'Google AI' | 'Stable Diffusion' | 'ByteDance' | 'Recraft';
type VidFamily = 'Google Veo' | 'Wan' | 'ByteDance' | 'Kling' | 'Sora 2';
type Family = ImgFamily | VidFamily;

interface Model { label: string; desc: string; type: string; family: Family; mode: Mode; badge?: string }
type SlotStatus = 'pending' | 'done' | 'error';
interface Slot { id: string; status: SlotStatus; url?: string; isVideo?: boolean; model: string; prompt: string; error?: string; family?: string }

const FAMILY_HUE: Record<string, string> = {
  'FLUX': '#ff2d9a', 'Google AI': '#a855f7', 'Stable Diffusion': '#6366f1',
  'ByteDance': '#f472b6', 'Recraft': '#8b5cf6',
  'Google Veo': '#a855f7', 'Wan': '#c084fc', 'Kling': '#f472b6', 'Sora 2': '#818cf8',
};

const IMAGE_MODELS: Model[] = [
  { label:'FLUX Schnell',     desc:'Fastest — great for quick previews',         type:'inference.flux-fast.schnell.txt2img.v2', family:'FLUX',             mode:'image', badge:'⚡ Fast' },
  { label:'FLUX Dev',         desc:'High quality, balanced speed',               type:'inference.flux.dev.txt2img.v2',          family:'FLUX',             mode:'image' },
  { label:'FLUX Pro 1.1',     desc:'Premium quality from Black Forest Labs',     type:'inference.flux.pro11.txt2img.v1',        family:'FLUX',             mode:'image', badge:'✦ Pro' },
  { label:'FLUX Pro Ultra',   desc:'Highest resolution & detail',                type:'inference.flux.pro11ultra.txt2img.v1',   family:'FLUX',             mode:'image', badge:'◆ Ultra' },
  { label:'FLUX 2 Dev',       desc:'Next-gen FLUX, excellent realism',           type:'inference.flux-2.dev.txt2img.v1',        family:'FLUX',             mode:'image', badge:'★ New' },
  { label:'FLUX 2 Pro',       desc:'FLUX 2 professional tier',                   type:'inference.flux-2.pro.txt2img.v1',        family:'FLUX',             mode:'image', badge:'★ New' },
  { label:'FLUX 2 Max',       desc:'Best quality in the FLUX 2 family',          type:'inference.flux-2.max.txt2img.v1',        family:'FLUX',             mode:'image', badge:'★ New' },
  { label:'FLUX Kontext Pro', desc:'Instruction-guided image generation',        type:'inference.flux-kontext.pro.txt2img.v2',  family:'FLUX',             mode:'image', badge:'✦ Pro' },
  { label:'FLUX Kontext Max', desc:'Max quality instruction-guided gen',         type:'inference.flux-kontext.max.txt2img.v2',  family:'FLUX',             mode:'image', badge:'◆ Max' },
  { label:'Gemini 3 Pro',     desc:'Up to 4K, multimodal reasoning',             type:'inference.gemini-3-pro.txt2img.v1',      family:'Google AI',        mode:'image', badge:'4K' },
  { label:'Gemini 3.1 Flash', desc:'Fast Gemini generation',                     type:'inference.gemini-3-1-flash.txt2img.v1', family:'Google AI',        mode:'image', badge:'⚡ Fast' },
  { label:'Nano Banana',      desc:'Google lightweight image model',             type:'inference.nano-banana.txt2img.v2',       family:'Google AI',        mode:'image' },
  { label:'SDXL',             desc:'Open-source, supports style presets',        type:'inference.sdxl.txt2img.v1',              family:'Stable Diffusion', mode:'image' },
  { label:'SD 1.5',           desc:'Classic Stable Diffusion',                   type:'inference.sd15.txt2img.v1',              family:'Stable Diffusion', mode:'image' },
  { label:'Seedream 5 Lite',  desc:'Latest ByteDance, high resolution',          type:'inference.seedream-5-0.lite.txt2img.v1', family:'ByteDance',        mode:'image', badge:'★ New' },
  { label:'Seedream 4.5',     desc:'Strong photorealism',                        type:'inference.seedream-4-5.txt2img.v1',      family:'ByteDance',        mode:'image' },
  { label:'Recraft V4 Pro',   desc:'Native text in images, 40+ styles',          type:'inference.recraft.v4.pro.txt2img.v1',   family:'Recraft',          mode:'image', badge:'✦ Pro' },
  { label:'Recraft V4',       desc:'Clean vector-friendly generation',           type:'inference.recraft.v4.txt2img.v1',        family:'Recraft',          mode:'image' },
];
const VIDEO_MODELS: Model[] = [
  { label:'Veo Fast (+ audio)', desc:'720p with audio gen, 4–8s',               type:'inference.veo.fast.txt2vid.v2',          family:'Google Veo',  mode:'video', badge:'⚡ Fast' },
  { label:'Veo Fast',           desc:'720p text-to-video, no audio',             type:'inference.veo.fast.txt2vid.v1',          family:'Google Veo',  mode:'video' },
  { label:'Veo Standard',       desc:'1080p high quality',                       type:'inference.veo.txt2vid.v2',               family:'Google Veo',  mode:'video', badge:'1080p' },
  { label:'Wan 2.2 Lightning',  desc:'Fast ~22s, great all-rounder',             type:'inference.wan2-2.lightning.txt2vid.v0',  family:'Wan',         mode:'video', badge:'⚡ Fast' },
  { label:'Seedance Lite',      desc:'ByteDance lightweight video',              type:'inference.seedance.lite.txt2vid.v1',     family:'ByteDance',   mode:'video' },
  { label:'Seedance Pro',       desc:'1080p up to 45s',                          type:'inference.seedance.pro.txt2vid.v1',      family:'ByteDance',   mode:'video', badge:'1080p' },
  { label:'Seedance Turbo',     desc:'1080p faster Pro variant',                 type:'inference.seedance.proturbo.txt2vid.v1', family:'ByteDance',   mode:'video', badge:'★ Fast' },
  { label:'Kling',              desc:'Camera control & motion masks',            type:'inference.kling.txt2vid.v1',             family:'Kling',       mode:'video' },
  { label:'Sora 2',             desc:'OpenAI video generation',                  type:'inference.sora-2.txt2vid.v1',            family:'Sora 2',      mode:'video' },
  { label:'Sora 2 Pro',         desc:'Synchronized audio, 12s',                  type:'inference.sora-2.pro.txt2vid.v1',        family:'Sora 2',      mode:'video', badge:'✦ Pro' },
];
const IMG_FAMILIES: ImgFamily[] = ['FLUX','Google AI','Stable Diffusion','ByteDance','Recraft'];
const VID_FAMILIES: VidFamily[] = ['Google Veo','Wan','ByteDance','Kling','Sora 2'];
const SDXL_STYLES = ['photographic','cinematic','digital-art','anime','3d-model','pixel-art','comic-book','fantasy-art','neon-punk'];
const PROHIBITED = ['nude','naked','pussy'];

function buildImageConfig(type: string, family: ImgFamily, o: any) {
  const c: any = { prompt: o.prompt };
  if (family === 'Stable Diffusion') {
    if (o.neg) c.negative_prompt = o.neg;
    c.steps = o.steps; c.guidance = o.guidance;
    if (o.seed !== -1) c.seed = o.seed;
    if (type.includes('sdxl')) { c.width = o.width; c.height = o.height; if (o.style) c.style_preset = o.style; }
  } else if (type.includes('flux') || type.includes('kontext')) {
    if (o.seed !== -1) c.seed = o.seed;
  }
  return c;
}
function buildVideoConfig(type: string, o: any) {
  const c: any = { prompt: o.prompt };
  if (o.neg) c.negative_prompt = o.neg;
  if (type.includes('veo')) {
    c.resolution = o.resolution; c.aspect_ratio = o.aspect_ratio; c.duration_seconds = o.duration;
    if (type.includes('v2')) c.generate_audio = o.audio;
  } else if (type.includes('wan')) {
    // wan only accepts prompt/negative_prompt
  } else if (type.includes('seedance') || type.includes('kling') || type.includes('sora')) {
    c.aspect_ratio = o.aspect_ratio;
  }
  return c;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function tokens(d: boolean) {
  return {
    bg:         d ? '#04000a'                                         : '#faf5ff',
    bgMain:     d ? 'rgba(0,0,0,0.2)'                                 : 'rgba(240,225,255,0.25)',
    surface:    d ? 'rgba(255,255,255,0.025)'                         : 'rgba(255,255,255,0.85)',
    surfaceHov: d ? 'rgba(255,255,255,0.05)'                          : 'rgba(255,255,255,1)',
    border:     d ? 'rgba(255,45,154,0.1)'                            : 'rgba(200,130,230,0.22)',
    borderStr:  d ? 'rgba(255,45,154,0.45)'                           : 'rgba(255,45,154,0.5)',
    text:       d ? '#ffffff'                                         : '#1a0a2e',
    textSub:    d ? 'rgba(255,255,255,0.5)'                           : 'rgba(26,10,46,0.58)',
    textMuted:  d ? 'rgba(255,255,255,0.22)'                          : 'rgba(26,10,46,0.32)',
    textAccent: d ? 'rgba(255,45,154,0.65)'                           : '#c026d3',
    inputBg:    d ? 'rgba(255,255,255,0.04)'                          : 'rgba(255,255,255,0.88)',
    inputBord:  d ? 'rgba(255,255,255,0.08)'                          : 'rgba(200,130,230,0.28)',
    sidebarBg:  d ? 'rgba(255,255,255,0.012)'                         : 'rgba(255,255,255,0.55)',
    headerBg:   d ? 'rgba(4,0,10,0.9)'                                : 'rgba(250,245,255,0.9)',
    cardPend:   d ? 'linear-gradient(135deg,#0c0018,#170028)'         : 'linear-gradient(135deg,#f5e8ff,#ede8ff)',
    cardPendBord: d ? 'rgba(255,45,154,0.18)'                         : 'rgba(200,130,220,0.35)',
    cardErr:    d ? 'rgba(40,0,15,0.85)'                              : 'rgba(255,242,248,0.97)',
    skA:        d ? 'rgba(139,43,226,0.07)'                           : 'rgba(210,170,240,0.25)',
    skB:        d ? 'rgba(255,45,154,0.18)'                           : 'rgba(255,150,220,0.45)',
    modeSel:    d ? 'linear-gradient(135deg,#ff2d9a,#8b2be2)'         : 'linear-gradient(135deg,#ff2d9a,#8b2be2)',
    modeUnsel:  d ? 'transparent'                                     : 'transparent',
    modeBg:     d ? 'rgba(255,255,255,0.05)'                          : 'rgba(200,130,230,0.1)',
    modeBord:   d ? 'rgba(255,255,255,0.08)'                          : 'rgba(200,130,230,0.22)',
    orb1:       d ? 'rgba(139,43,226,0.1)'                            : 'rgba(139,43,226,0.055)',
    orb2:       d ? 'rgba(255,45,154,0.09)'                           : 'rgba(255,45,154,0.05)',
    lbBg:       d ? 'rgba(4,0,10,0.97)'                               : 'rgba(250,245,255,0.97)',
    dividerL:   d ? 'rgba(255,45,154,0.3)'                            : 'rgba(255,45,154,0.25)',
    dividerR:   d ? 'rgba(139,43,226,0.3)'                            : 'rgba(139,43,226,0.2)',
    kbd:        d ? 'rgba(255,255,255,0.08)'                          : 'rgba(26,10,46,0.07)',
    kbdBord:    d ? 'rgba(255,255,255,0.12)'                          : 'rgba(26,10,46,0.14)',
    selOptBg:   d ? '#120020'                                         : '#f5e6ff',
  };
}

function buildCss(selOptBg: string) {
  return [
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    'html,body,#__next{height:100%;overflow:hidden}',
    "body{-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,sans-serif}",
    '::-webkit-scrollbar{width:3px}',
    '::-webkit-scrollbar-track{background:transparent}',
    '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2d9a,#8b2be2);border-radius:99px}',
    'input[type=range]{-webkit-appearance:none;height:3px;border-radius:99px;outline:none;width:100%}',
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#ff2d9a,#8b2be2);cursor:pointer;box-shadow:0 0 8px rgba(255,45,154,0.5)}',
    `select option{background:${selOptBg};color:inherit}`,
    '@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}',
    '@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}',
    '@keyframes ring-pulse{0%,100%{transform:scale(1);opacity:0.15}50%{transform:scale(1.08);opacity:0.3}}',
    '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}',
    '@keyframes fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
    '@keyframes card-pop{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}',
    '@keyframes glow-breathe{0%,100%{box-shadow:0 0 20px rgba(255,45,154,0.3),0 0 40px rgba(139,43,226,0.15)}50%{box-shadow:0 0 40px rgba(255,45,154,0.6),0 0 80px rgba(139,43,226,0.3)}}',
    '@keyframes skeleton{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '.shimmer-btn{background:linear-gradient(90deg,#ff2d9a,#c026d3,#8b2be2,#c026d3,#ff2d9a);background-size:300% 100%;animation:shimmer 3s linear infinite;transition:filter 0.2s,transform 0.15s}',
    '.shimmer-btn:hover:not(:disabled){filter:brightness(1.2);transform:translateY(-2px);box-shadow:0 8px 40px rgba(255,45,154,0.5)!important}',
    '.shimmer-btn:active:not(:disabled){transform:translateY(1px)}',
    '.card-pop{animation:card-pop 0.32s cubic-bezier(0.34,1.56,0.64,1) both}',
    '.img-hover .overlay{opacity:0;transition:opacity 0.22s}',
    '.img-hover:hover .overlay{opacity:1}',
    '.img-hover{transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s}',
    '.img-hover:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 20px 50px rgba(0,0,0,0.35)}',
    '.fade-up{animation:fade-up 0.35s ease both}',
    '.sidebar-scroll{overflow-y:auto;scrollbar-width:thin;scrollbar-color:#ff2d9a transparent}',
  ].join('\n');
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.75s linear infinite', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.12)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#spg)" strokeWidth="3" strokeLinecap="round"/>
      <defs><linearGradient id="spg" x1="0%" y1="0%" x2="100%"><stop stopColor="#ff2d9a"/><stop offset="1" stopColor="#8b2be2"/></linearGradient></defs>
    </svg>
  );
}
function Grad({ children }: { children: React.ReactNode }) {
  return <span style={{ background:'linear-gradient(90deg,#ff2d9a,#d946ef,#8b2be2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{children}</span>;
}
function Divider({ label, T }: { label: string; T: ReturnType<typeof tokens> }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'2px 0 6px' }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.dividerL},transparent)` }}/>
      <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase', color: T.textAccent }}>{label}</span>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${T.dividerR})` }}/>
    </div>
  );
}

function ThemeToggle({ theme, toggle, T }: { theme: Theme; toggle: () => void; T: ReturnType<typeof tokens> }) {
  return (
    <button onClick={toggle} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ width:34, height:34, borderRadius:10, background:T.surface, border:`1px solid ${T.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderStr; e.currentTarget.style.background=T.surfaceHov; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}>
      {theme === 'dark'
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffb3d9" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b21a8" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
    </button>
  );
}

function ApiKeyModal({ onSave, T }: { onSave: (k: string) => void; T: ReturnType<typeof tokens> }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:T.lbBg, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(16px)' }}>
      <div className="fade-up" style={{ width:440, padding:36, borderRadius:24, background:T.surface, border:`1px solid ${T.borderStr}`, boxShadow:'0 0 80px rgba(255,45,154,0.12),0 0 0 1px rgba(255,45,154,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,#ff2d9a,#8b2be2)', display:'flex', alignItems:'center', justifyContent:'center', animation:'glow-breathe 3s ease-in-out infinite', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize:22, fontWeight:900, lineHeight:1 }}><Grad>Pixio</Grad></div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:T.textMuted, marginTop:2 }}>Open Source</div>
          </div>
        </div>
        <h2 style={{ fontSize:19, fontWeight:800, marginBottom:8, color:T.text }}>Enter your Prodia API key</h2>
        <p style={{ fontSize:13, color:T.textSub, lineHeight:1.65, marginBottom:22 }}>
          Get a free key at{' '}
          <a href="https://app.prodia.com" target="_blank" rel="noreferrer" style={{ color:'#ff2d9a', textDecoration:'none', fontWeight:600 }}>app.prodia.com</a>.{' '}
          Stored only in your browser.
        </p>
        <input type="password" value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&val.trim()&&onSave(val.trim())}
          placeholder="eyJhbG…"
          style={{ width:'100%', background:T.inputBg, border:`1px solid ${T.inputBord}`, borderRadius:12, padding:'12px 16px', fontSize:13, color:T.text, marginBottom:14, outline:'none', transition:'border-color 0.2s' }}
          onFocus={e=>(e.currentTarget.style.borderColor=T.borderStr)}
          onBlur={e=>(e.currentTarget.style.borderColor=T.inputBord)}
          autoFocus/>
        <button onClick={()=>val.trim()&&onSave(val.trim())} className="shimmer-btn"
          style={{ width:'100%', padding:'13px', borderRadius:13, border:'none', cursor:'pointer', fontSize:14, fontWeight:800, color:'white', boxShadow:'0 4px 30px rgba(255,45,154,0.35)' }}>
          Start Creating ✦
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted]             = useState(false);
  const [theme, setTheme]                 = useState<Theme>('dark');
  const [apiKey, setApiKey]               = useState('');
  const [showKeyModal, setShowKeyModal]   = useState(false);
  const [mode, setMode]                   = useState<Mode>('image');
  const [prompt, setPrompt]               = useState('');
  const [neg, setNeg]                     = useState('');
  const [selTypes, setSelTypes]           = useState<string[]>(['inference.flux-fast.schnell.txt2img.v2']);
  const [activeFamily, setActiveFamily]   = useState<Family | 'All'>('All');
  const [steps, setSteps]                 = useState(25);
  const [guidance, setGuidance]           = useState(8);
  const [seed, setSeed]                   = useState(-1);
  const [width, setWidth]                 = useState(1024);
  const [height, setHeight]               = useState(1024);
  const [sdxlStyle, setSdxlStyle]         = useState('');
  const [resolution, setResolution]       = useState('720p');
  const [aspectRatio, setAspectRatio]     = useState('16:9');
  const [duration, setDuration]           = useState(4);
  const [genAudio, setGenAudio]           = useState(false);
  const [adv, setAdv]                     = useState(false);
  const [slots, setSlots]                 = useState<Slot[]>([]);
  const [err, setErr]                     = useState('');
  const [lbIdx, setLbIdx]                 = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const k = localStorage.getItem('PIXIO_API_KEY');
    if (k) setApiKey(k); else setShowKeyModal(true);
    const t = localStorage.getItem('PIXIO_THEME') as Theme | null;
    if (t) setTheme(t);
  }, []);

  const toggleTheme = () => setTheme(prev => {
    const next = prev === 'dark' ? 'light' : 'dark';
    localStorage.setItem('PIXIO_THEME', next);
    return next;
  });
  const saveKey = (k: string) => { localStorage.setItem('PIXIO_API_KEY', k); setApiKey(k); setShowKeyModal(false); };

  const T = tokens(theme === 'dark');

  const switchMode = (m: Mode) => {
    setMode(m); setActiveFamily('All');
    setSelTypes(m === 'image' ? ['inference.flux-fast.schnell.txt2img.v2'] : ['inference.veo.fast.txt2vid.v2']);
  };
  const allModels = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const families = (mode === 'image' ? IMG_FAMILIES : VID_FAMILIES) as Family[];
  const familyModels = (activeFamily as string) === 'All' ? allModels : allModels.filter(m => m.family === activeFamily);
  const toggleModel = useCallback((t: string) => setSelTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]), []);

  const isSafe = (t: string) => !PROHIBITED.some(w => t.toLowerCase().includes(w));
  const activeCount = slots.filter(s => s.status === 'pending').length;
  const showSdxl = mode === 'image' && selTypes.some(t => t.includes('sdxl') || t.includes('sd15'));
  const showVeoAudio = mode === 'video' && selTypes.some(t => t.includes('veo') && t.includes('v2'));

  const generate = () => {
    if (!apiKey) { setShowKeyModal(true); return; }
    if (!prompt.trim()) { setErr('Enter a prompt first.'); return; }
    if (!isSafe(prompt) || !isSafe(neg)) { setErr('Prompt contains prohibited content.'); return; }
    if (!selTypes.length) { setErr('Select at least one model.'); return; }
    setErr('');
    const newSlots: Slot[] = selTypes.map(type => ({
      id: Math.random().toString(36).slice(2),
      status: 'pending' as SlotStatus,
      model: allModels.find(m => m.type === type)?.label ?? type,
      prompt,
      family: allModels.find(m => m.type === type)?.family,
    }));
    setSlots(prev => [...newSlots, ...prev]);
    newSlots.forEach((slot, i) => {
      const type = selTypes[i];
      const m = allModels.find(x => x.type === type)!;
      const config = mode === 'image'
        ? buildImageConfig(type, m.family as ImgFamily, { prompt, neg, steps, guidance, seed, width, height, style: sdxlStyle })
        : buildVideoConfig(type, { prompt, neg, resolution, aspect_ratio: aspectRatio, duration, audio: genAudio });
      axios.post('/api/generateImage', { type, config, apiKey })
        .then(res => setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: 'done', url: res.data.url, isVideo: res.data.video } : s)))
        .catch((e: any) => {
          const msg = e.response?.data?.message ?? e.message ?? 'Failed';
          setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: 'error', error: msg } : s));
        });
    });
  };

  const doneSlots = slots.filter(s => s.status === 'done');
  if (!mounted) return null;

  const inputStyle = { width:'100%', background:T.inputBg, border:`1px solid ${T.inputBord}`, borderRadius:11, padding:'10px 12px', fontSize:12, color:T.text, outline:'none', transition:'border-color 0.2s,box-shadow 0.2s' };
  const inputFocus = (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor=T.borderStr; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(255,45,154,0.1)`; };
  const inputBlur  = (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor=T.inputBord; e.currentTarget.style.boxShadow='none'; };

  return (
    <>
      <Head><title>Pixio Open Source — AI Studio</title><meta name="viewport" content="width=device-width,initial-scale=1"/></Head>
      <style dangerouslySetInnerHTML={{ __html: buildCss(T.selOptBg) }}/>

      {showKeyModal && <ApiKeyModal onSave={saveKey} T={T}/>}

      {/* Ambient orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:800, height:800, borderRadius:'50%', background:`radial-gradient(circle,${T.orb1} 0%,transparent 70%)`, top:-300, left:-250, animation:'ring-pulse 7s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle,${T.orb2} 0%,transparent 70%)`, bottom:-200, right:-100, animation:'ring-pulse 9s ease-in-out infinite', animationDelay:'3s' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, height:'100vh', display:'flex', flexDirection:'column', background:T.bg, color:T.text, transition:'background 0.3s,color 0.2s' }}>

        {/* Header */}
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderBottom:`1px solid ${T.border}`, background:T.headerBg, backdropFilter:'blur(22px)', flexShrink:0, gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:33, height:33, borderRadius:10, background:'linear-gradient(135deg,#ff2d9a,#8b2be2)', display:'flex', alignItems:'center', justifyContent:'center', animation:'glow-breathe 3s ease-in-out infinite', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:900, lineHeight:1 }}><Grad>Pixio</Grad></div>
              <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:T.textMuted, marginTop:1 }}>Open Source</div>
            </div>
          </div>

          {/* Mode switcher */}
          <div style={{ display:'flex', gap:3, padding:4, borderRadius:13, background:T.modeBg, border:`1px solid ${T.modeBord}` }}>
            {(['image','video'] as Mode[]).map(m => (
              <button key={m} onClick={()=>switchMode(m)} style={{ padding:'7px 18px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.2s', textTransform:'capitalize',
                background: mode===m ? T.modeSel : T.modeUnsel,
                color: mode===m ? 'white' : T.textSub,
                boxShadow: mode===m ? '0 2px 14px rgba(255,45,154,0.4)' : 'none' }}>
                {m==='image' ? '🖼 Images' : '🎬 Videos'}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {activeCount > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:99, background:'rgba(255,45,154,0.08)', border:`1px solid rgba(255,45,154,0.2)` }}>
                <Spinner size={12}/>
                <span style={{ fontSize:11, fontWeight:700, color:'#ff2d9a' }}>{activeCount} running</span>
              </div>
            )}
            <ThemeToggle theme={theme} toggle={toggleTheme} T={T}/>
            {apiKey && (
              <button onClick={()=>setShowKeyModal(true)} style={{ fontSize:11, fontWeight:600, padding:'5px 11px', borderRadius:99, background:T.surface, border:`1px solid ${T.border}`, color:T.textSub, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderStr; e.currentTarget.style.color='#ff2d9a'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textSub; }}>
                🔑 Key
              </button>
            )}
            <a href="https://github.com/Tech-in-Schools-Inititaitive/pixio-community-lite-edition" target="_blank" rel="noreferrer"
              style={{ color:T.textMuted, textDecoration:'none', display:'flex', alignItems:'center', transition:'color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#ff2d9a')} onMouseLeave={e=>(e.currentTarget.style.color=T.textMuted)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.7.115 2.5.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/></svg>
            </a>
          </div>
        </header>

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Sidebar */}
          <aside style={{ width:290, flexShrink:0, borderRight:`1px solid ${T.border}`, background:T.sidebarBg, backdropFilter:'blur(12px)', display:'flex', flexDirection:'column' }}>
            {/* Scrollable controls */}
            <div className="sidebar-scroll" style={{ flex:1, overflowY:'auto', padding:'14px 13px', display:'flex', flexDirection:'column', gap:14 }}>

              {/* Prompt */}
              <div>
                <Divider label={mode==='image'?'Your Vision':'Scene Description'} T={T}/>
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&generate()}
                  placeholder={mode==='image'
                    ? 'A glowing jellyfish drifting through a neon ocean at night…'
                    : 'A sweeping mountain vista at golden hour, camera slowly panning…'}
                  rows={4}
                  style={{ ...inputStyle, resize:'none', lineHeight:1.6 }}
                  onFocus={inputFocus} onBlur={inputBlur}/>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:9, color:T.textMuted }}>⌘↵ to generate</span>
                  <span style={{ fontSize:9, color: prompt.length > 400 ? '#ff2d9a' : T.textMuted }}>{prompt.length}</span>
                </div>
              </div>

              {/* Model selector */}
              <div>
                <div style={{ display:'flex', alignItems:'center', marginBottom:8, gap:4 }}>
                  <Divider label="Model" T={T}/>
                  <button onClick={()=>setSelTypes(familyModels.map(m=>m.type))} style={{ fontSize:9, fontWeight:700, color:'#ff2d9a', background:'none', border:'none', cursor:'pointer', letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0 }}>All</button>
                  <span style={{ color:T.textMuted, fontSize:9 }}>·</span>
                  <button onClick={()=>setSelTypes([])} style={{ fontSize:9, fontWeight:700, color:T.textMuted, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0 }}>None</button>
                </div>
                {/* Family chips */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:9 }}>
                  {(['All', ...families] as string[]).map(f => {
                    const active = (activeFamily as string) === f;
                    const hue = f === 'All' ? null : FAMILY_HUE[f];
                    return (
                      <button key={f} onClick={()=>setActiveFamily(f as Family | 'All')}
                        style={{ padding:'3px 9px', borderRadius:99, fontSize:10, fontWeight:700, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
                          background: active ? (hue ? `${hue}22` : 'rgba(255,45,154,0.12)') : T.surface,
                          borderColor: active ? (hue ?? '#ff2d9a') : T.border,
                          color: active ? (hue ?? '#ff2d9a') : T.textSub,
                          boxShadow: active ? `0 0 10px ${(hue ?? '#ff2d9a')}33` : 'none' }}>
                        {f}
                      </button>
                    );
                  })}
                </div>
                {/* Model cards */}
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  {familyModels.map(m => {
                    const sel = selTypes.includes(m.type);
                    const hue = FAMILY_HUE[m.family as string] ?? '#ff2d9a';
                    return (
                      <button key={m.type} onClick={()=>toggleModel(m.type)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px 8px 13px', borderRadius:10, border:`1px solid`, cursor:'pointer', textAlign:'left', transition:'all 0.15s', width:'100%', position:'relative', overflow:'hidden',
                          background: sel ? `${hue}14` : T.surface,
                          borderColor: sel ? hue : T.border,
                          boxShadow: sel ? `0 0 14px ${hue}25` : 'none' }}>
                        {/* Left accent bar */}
                        <div style={{ position:'absolute', left:0, top:4, bottom:4, width:3, borderRadius:99, background: sel ? hue : 'transparent', transition:'background 0.15s' }}/>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:11.5, fontWeight:700, color: sel ? T.text : T.textSub, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.label}</div>
                          <div style={{ fontSize:10, color:T.textMuted, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.desc}</div>
                        </div>
                        {m.badge && <span style={{ fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:99, background:`${hue}22`, border:`1px solid ${hue}44`, color:hue, flexShrink:0, marginLeft:6 }}>{m.badge}</span>}
                      </button>
                    );
                  })}
                </div>
                {selTypes.length > 0 && (
                  <div style={{ marginTop:6, fontSize:11, color:'#c026d3', fontWeight:700 }}>
                    {selTypes.length} selected{selTypes.length > 1 ? ` · generates ${selTypes.length} at once` : ''}
                  </div>
                )}
              </div>

              {/* Video params */}
              {mode === 'video' && (
                <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Divider label="Video Settings" T={T}/>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {([['Resolution', resolution, setResolution, ['480p','720p','1080p']],
                       ['Aspect Ratio', aspectRatio, setAspectRatio, ['16:9','9:16','1:1','4:3']]] as any[]).map(([lbl,val,set,opts])=>(
                      <div key={lbl}>
                        <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>{lbl}</div>
                        <select value={val} onChange={(e:any)=>set(e.target.value)} style={{ ...inputStyle, padding:'6px 8px', fontSize:11 }}>
                          {opts.map((o:string)=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>Duration <span style={{ color:T.textMuted, fontWeight:400 }}>{duration}s</span></div>
                    <input type="range" min={4} max={8} step={1} value={duration} onChange={e=>setDuration(+e.target.value)} style={{ background:`linear-gradient(90deg,#ff2d9a ${((duration-4)/4)*100}%,${T.inputBg} ${((duration-4)/4)*100}%)` }}/>
                  </div>
                  {showVeoAudio && (
                    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:12, color:T.textSub, fontWeight:600 }}>
                      <div onClick={()=>setGenAudio(!genAudio)}
                        style={{ width:38, height:21, borderRadius:99, background:genAudio?'linear-gradient(90deg,#ff2d9a,#8b2be2)':T.inputBg, border:`1px solid ${T.border}`, position:'relative', cursor:'pointer', flexShrink:0, transition:'background 0.2s' }}>
                        <div style={{ position:'absolute', width:15, height:15, borderRadius:'50%', background:'white', top:2, transition:'left 0.2s', left:genAudio?19:3, boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
                      </div>
                      Generate Audio
                    </label>
                  )}
                </div>
              )}

              {/* Advanced (image) */}
              {mode === 'image' && (
                <>
                  <button onClick={()=>setAdv(!adv)}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:T.textMuted, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'2px 0', transition:'color 0.2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.color='#ff2d9a')} onMouseLeave={e=>(e.currentTarget.style.color=T.textMuted)}>
                    <span style={{ display:'inline-block', transition:'transform 0.2s', transform:adv?'rotate(90deg)':'none', fontSize:14 }}>›</span> Advanced
                  </button>
                  {adv && (
                    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:11, marginTop:-6 }}>
                      {showSdxl && (
                        <>
                          <div>
                            <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>Negative Prompt</div>
                            <textarea value={neg} onChange={e=>setNeg(e.target.value)} placeholder="blurry, ugly, watermark…" rows={2} style={{ ...inputStyle, resize:'none' }} onFocus={inputFocus} onBlur={inputBlur}/>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            {([['Steps',steps,setSteps,1,50],['Guidance',guidance,setGuidance,1,20]] as any[]).map(([lbl,val,set,min,max])=>(
                              <div key={lbl}>
                                <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>{lbl} <span style={{ color:T.textMuted, fontWeight:400 }}>{val}</span></div>
                                <input type="range" min={min} max={max} value={val} onChange={(e:any)=>set(+e.target.value)}/>
                              </div>
                            ))}
                          </div>
                          {selTypes.some(t=>t.includes('sdxl')) && (
                            <>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                {([['Width',width,setWidth],['Height',height,setHeight]] as any[]).map(([lbl,val,set])=>(
                                  <div key={lbl}>
                                    <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{lbl}</div>
                                    <select value={val} onChange={(e:any)=>set(+e.target.value)} style={{ ...inputStyle, padding:'6px 8px', fontSize:11 }}>
                                      {[512,768,1024,1280,1536].map(v=><option key={v} value={v}>{v}px</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Style Preset</div>
                                <select value={sdxlStyle} onChange={e=>setSdxlStyle(e.target.value)} style={{ ...inputStyle, padding:'6px 8px', fontSize:11 }}>
                                  <option value="">None</option>
                                  {SDXL_STYLES.map(s=><option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            </>
                          )}
                        </>
                      )}
                      <div>
                        <div style={{ fontSize:9, fontWeight:800, color:T.textAccent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Seed <span style={{ color:T.textMuted, fontWeight:400 }}>(-1 = random)</span></div>
                        <input type="number" value={seed} onChange={e=>setSeed(+e.target.value)} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}/>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sticky generate footer */}
            <div style={{ padding:'12px 13px', borderTop:`1px solid ${T.border}`, background:T.sidebarBg, backdropFilter:'blur(10px)' }}>
              {err && <div style={{ padding:'8px 12px', borderRadius:10, background:'rgba(255,45,154,0.08)', border:'1px solid rgba(255,45,154,0.25)', fontSize:11.5, color:'#ff2d9a', lineHeight:1.5, marginBottom:10 }}>{err}</div>}
              <button onClick={generate} disabled={!selTypes.length} className="shimmer-btn"
                style={{ width:'100%', padding:'13px', borderRadius:13, border:'none', cursor: selTypes.length ? 'pointer' : 'not-allowed', fontSize:14, fontWeight:800, color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:10, letterSpacing:'0.04em', boxShadow:'0 4px 30px rgba(255,45,154,0.35),0 0 60px rgba(139,43,226,0.15)', opacity: selTypes.length ? 1 : 0.5 }}>
                {mode === 'image' ? '✦' : '▶'}{' '}
                {selTypes.length === 0 ? 'Select a Model' : selTypes.length > 1 ? `Generate ${selTypes.length} ${mode === 'image' ? 'Images' : 'Videos'}` : `Generate ${mode === 'image' ? 'Image' : 'Video'}`}
              </button>
              {mode === 'video' && <div style={{ textAlign:'center', fontSize:10, color:T.textMuted, marginTop:7 }}>Videos take 20–60s · queue freely while waiting</div>}
            </div>
          </aside>

          {/* Canvas */}
          <main style={{ flex:1, overflowY:'auto', padding:16, background:T.bgMain }}>
            {slots.length === 0 ? (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, userSelect:'none' }}>
                <div style={{ position:'relative', width:110, height:110 }}>
                  {[0,1,2].map(i=><div key={i} style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(255,45,154,0.13)', animation:`ring-pulse ${4+i*1.5}s ease-in-out infinite`, animationDelay:`${i*0.9}s`, transform:`scale(${1+i*0.3})` }}/>)}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', animation:'float 4s ease-in-out infinite' }}>
                    <div style={{ width:58, height:58, borderRadius:18, background:'linear-gradient(135deg,rgba(255,45,154,0.18),rgba(139,43,226,0.18))', border:'1px solid rgba(255,45,154,0.28)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 30px rgba(255,45,154,0.15)' }}>
                      <span style={{ fontSize:26 }}>{mode==='image'?'🖼':'🎬'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}><Grad>Your canvas awaits</Grad></div>
                  <div style={{ fontSize:13, color:T.textSub, lineHeight:1.75 }}>
                    Pick a model · Write your vision<br/>
                    Press <kbd style={{ padding:'2px 7px', borderRadius:5, background:T.kbd, border:`1px solid ${T.kbdBord}`, fontSize:11, color:T.text }}>⌘↵</kbd> or click Generate
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', maxWidth:420 }}>
                  {['Glowing jellyfish in neon ocean','Cyberpunk city at night, rain','Portrait of a fox in ancient Japan'].map(ex=>(
                    <button key={ex} onClick={()=>setPrompt(ex)}
                      style={{ padding:'6px 13px', borderRadius:99, fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, color:T.textSub, cursor:'pointer', transition:'all 0.2s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderStr; e.currentTarget.style.color=T.text; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textSub; }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:12 }}>
                {slots.map(slot => {
                  const hue = slot.family ? (FAMILY_HUE[slot.family] ?? '#ff2d9a') : '#ff2d9a';
                  if (slot.status === 'pending') return (
                    <div key={slot.id} className="card-pop" style={{ aspectRatio:'1', borderRadius:16, border:`1px solid ${T.cardPendBord}`, background:T.cardPend, overflow:'hidden', position:'relative' }}>
                      {/* Skeleton shimmer */}
                      <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${T.skA} 25%,${T.skB} 50%,${T.skA} 75%)`, backgroundSize:'400% 100%', animation:'skeleton 1.8s ease-in-out infinite' }}/>
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:`${hue}22`, border:`1px solid ${hue}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Spinner size={18}/>
                        </div>
                        <div style={{ textAlign:'center', padding:'0 12px' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:hue, marginBottom:3 }}>{slot.model}</div>
                          <div style={{ fontSize:10, color:T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:155 }}>{slot.prompt}</div>
                        </div>
                      </div>
                    </div>
                  );
                  if (slot.status === 'error') return (
                    <div key={slot.id} className="card-pop" style={{ aspectRatio:'1', borderRadius:16, border:'1px solid rgba(255,80,80,0.2)', background:T.cardErr, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:16, textAlign:'center' }}>
                      <div style={{ fontSize:24 }}>⚠️</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#ef4444' }}>{slot.model}</div>
                      <div style={{ fontSize:10, color:T.textSub, lineHeight:1.4 }}>{slot.error}</div>
                    </div>
                  );
                  const doneIdx = doneSlots.findIndex(s => s.id === slot.id);
                  return (
                    <div key={slot.id} className="img-hover card-pop" onClick={()=>setLbIdx(doneIdx)}
                      style={{ aspectRatio:'1', borderRadius:16, overflow:'hidden', cursor:'zoom-in', position:'relative', border:`1px solid ${T.border}`, boxShadow:`0 4px 20px rgba(0,0,0,0.25),0 0 0 1px ${hue}22` }}>
                      {slot.isVideo
                        ? <video src={slot.url} autoPlay loop muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                        : <img src={slot.url!} alt={slot.prompt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>}
                      {/* Family badge */}
                      <div style={{ position:'absolute', top:8, left:8, padding:'2px 7px', borderRadius:99, background:`${hue}cc`, fontSize:9, fontWeight:700, color:'white', backdropFilter:'blur(8px)' }}>{slot.family}</div>
                      <div className="overlay" style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 55%)' }}>
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'10px 11px' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'white', marginBottom:2 }}>{slot.model}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:7 }}>{slot.prompt}</div>
                          <button onClick={e=>{ e.stopPropagation(); const a=document.createElement('a'); a.href=slot.url!; a.download=slot.isVideo?'pixio.mp4':'pixio.jpg'; a.click(); }}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:99, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', fontSize:10, fontWeight:700, color:'white', cursor:'pointer', backdropFilter:'blur(8px)' }}>
                            ↓ Save {slot.isVideo?'MP4':'JPG'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Lightbox */}
      {lbIdx !== null && lbIdx < doneSlots.length && (()=>{
        const slot = doneSlots[lbIdx];
        return (
          <div onClick={()=>setLbIdx(null)} style={{ position:'fixed', inset:0, zIndex:100, background:T.lbBg, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(20px)' }}>
            <div onClick={e=>e.stopPropagation()} className="fade-up" style={{ maxWidth:880, width:'calc(100vw - 80px)', position:'relative' }}>
              {slot.isVideo
                ? <video src={slot.url} autoPlay loop controls style={{ width:'100%', borderRadius:20, display:'block', boxShadow:`0 0 80px rgba(255,45,154,0.2),0 0 0 1px rgba(255,45,154,0.18)` }}/>
                : <img src={slot.url!} alt={slot.prompt} style={{ width:'100%', borderRadius:20, display:'block', boxShadow:`0 0 80px rgba(255,45,154,0.2),0 0 0 1px rgba(255,45,154,0.18)` }}/>}
              <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:7 }}>
                <a href={slot.url!} download={slot.isVideo?'pixio.mp4':'pixio.jpg'} onClick={e=>e.stopPropagation()}
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,45,154,0.2)', border:'1px solid rgba(255,45,154,0.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', textDecoration:'none', fontSize:16, backdropFilter:'blur(10px)' }}>↓</a>
                <button onClick={()=>setLbIdx(null)} style={{ width:36, height:36, borderRadius:10, background:`${T.surface}cc`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.text, cursor:'pointer', fontSize:20, backdropFilter:'blur(10px)' }}>×</button>
              </div>
              {doneSlots.length > 1 && <>
                <button onClick={e=>{ e.stopPropagation(); setLbIdx((lbIdx-1+doneSlots.length)%doneSlots.length); }} style={{ position:'absolute', left:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:12, background:'rgba(139,43,226,0.25)', border:'1px solid rgba(139,43,226,0.4)', color:'white', cursor:'pointer', fontSize:22, backdropFilter:'blur(10px)' }}>‹</button>
                <button onClick={e=>{ e.stopPropagation(); setLbIdx((lbIdx+1)%doneSlots.length); }} style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:12, background:'rgba(139,43,226,0.25)', border:'1px solid rgba(139,43,226,0.4)', color:'white', cursor:'pointer', fontSize:22, backdropFilter:'blur(10px)' }}>›</button>
              </>}
              <div style={{ marginTop:14, textAlign:'center' }}>
                <span style={{ fontWeight:800, fontSize:13, color:'#ff2d9a' }}>{slot.model}</span>
                <span style={{ color:T.textMuted, margin:'0 10px' }}>·</span>
                <span style={{ fontSize:13, color:T.textSub }}>{slot.prompt}</span>
                <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{lbIdx+1} / {doneSlots.length}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
