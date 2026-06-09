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
  'FLUX': '#e879f9', 'Google AI': '#a78bfa', 'Stable Diffusion': '#818cf8',
  'ByteDance': '#f472b6', 'Recraft': '#c084fc',
  'Google Veo': '#a78bfa', 'Wan': '#c084fc', 'Kling': '#f472b6', 'Sora 2': '#818cf8',
};

const IMAGE_MODELS: Model[] = [
  { label:'FLUX Schnell',       desc:'Fastest — built for quick iteration and previews',   type:'inference.flux-fast.schnell.txt2img.v2', family:'FLUX',             mode:'image', badge:'Fast' },
  { label:'FLUX Dev',           desc:'High quality, excellent prompt adherence',            type:'inference.flux.dev.txt2img.v2',          family:'FLUX',             mode:'image' },
  { label:'FLUX Pro 1.1',       desc:'Premium Black Forest Labs quality',                   type:'inference.flux.pro11.txt2img.v1',        family:'FLUX',             mode:'image', badge:'Pro' },
  { label:'FLUX Pro Ultra',     desc:'Highest resolution, maximum detail',                  type:'inference.flux.pro11ultra.txt2img.v1',   family:'FLUX',             mode:'image', badge:'Ultra' },
  { label:'FLUX 2 Dev',         desc:'Next-gen FLUX with exceptional realism',              type:'inference.flux-2.dev.txt2img.v1',        family:'FLUX',             mode:'image', badge:'New' },
  { label:'FLUX 2 Pro',         desc:'FLUX 2 professional — stunning detail',               type:'inference.flux-2.pro.txt2img.v1',        family:'FLUX',             mode:'image', badge:'New' },
  { label:'FLUX 2 Max',         desc:'Best-in-class FLUX 2 quality',                        type:'inference.flux-2.max.txt2img.v1',        family:'FLUX',             mode:'image', badge:'New' },
  { label:'FLUX Kontext Pro',   desc:'Instruction-guided image generation',                 type:'inference.flux-kontext.pro.txt2img.v2',  family:'FLUX',             mode:'image', badge:'Pro' },
  { label:'FLUX Kontext Max',   desc:'Maximum quality instruction-guided generation',       type:'inference.flux-kontext.max.txt2img.v2',  family:'FLUX',             mode:'image', badge:'Max' },
  { label:'Gemini 3 Pro',       desc:'Google multimodal intelligence, up to 4K',            type:'inference.gemini-3-pro.txt2img.v1',      family:'Google AI',        mode:'image', badge:'4K' },
  { label:'Gemini 3.1 Flash',   desc:'Gemini at speed — fast and capable',                  type:'inference.gemini-3-1-flash.txt2img.v1', family:'Google AI',        mode:'image', badge:'Fast' },
  { label:'Nano Banana',        desc:'Google lightweight — fast and expressive',             type:'inference.nano-banana.txt2img.v2',       family:'Google AI',        mode:'image' },
  { label:'SDXL',               desc:'Open-source powerhouse with style presets',           type:'inference.sdxl.txt2img.v1',              family:'Stable Diffusion', mode:'image' },
  { label:'SD 1.5',             desc:'Classic Stable Diffusion, wide community support',    type:'inference.sd15.txt2img.v1',              family:'Stable Diffusion', mode:'image' },
  { label:'Seedream 5 Lite',    desc:'Latest ByteDance model, ultra high resolution',       type:'inference.seedream-5-0.lite.txt2img.v1', family:'ByteDance',        mode:'image', badge:'New' },
  { label:'Seedream 4.5',       desc:'ByteDance photorealism at its best',                  type:'inference.seedream-4-5.txt2img.v1',      family:'ByteDance',        mode:'image' },
  { label:'Recraft V4 Pro',     desc:'Native text rendering, 40+ artistic styles',          type:'inference.recraft.v4.pro.txt2img.v1',   family:'Recraft',          mode:'image', badge:'Pro' },
  { label:'Recraft V4',         desc:'Clean vector-friendly creative generation',           type:'inference.recraft.v4.txt2img.v1',        family:'Recraft',          mode:'image' },
];
const VIDEO_MODELS: Model[] = [
  { label:'Veo Fast (+ Audio)', desc:'720p Google video with AI-generated audio, 4–8s',   type:'inference.veo.fast.txt2vid.v2',          family:'Google Veo',  mode:'video', badge:'Fast' },
  { label:'Veo Fast',           desc:'720p text-to-video, clean motion',                   type:'inference.veo.fast.txt2vid.v1',          family:'Google Veo',  mode:'video' },
  { label:'Veo Standard',       desc:'1080p high quality, Google DeepMind',                type:'inference.veo.txt2vid.v2',               family:'Google Veo',  mode:'video', badge:'1080p' },
  { label:'Wan 2.2 Lightning',  desc:'~22 seconds, excellent motion quality',              type:'inference.wan2-2.lightning.txt2vid.v0',  family:'Wan',         mode:'video', badge:'Fast' },
  { label:'Seedance Lite',      desc:'ByteDance lightweight video generation',             type:'inference.seedance.lite.txt2vid.v1',     family:'ByteDance',   mode:'video' },
  { label:'Seedance Pro',       desc:'1080p ByteDance, up to 45 seconds',                  type:'inference.seedance.pro.txt2vid.v1',      family:'ByteDance',   mode:'video', badge:'1080p' },
  { label:'Seedance Turbo',     desc:'1080p fast variant — speed meets quality',           type:'inference.seedance.proturbo.txt2vid.v1', family:'ByteDance',   mode:'video', badge:'Turbo' },
  { label:'Kling',              desc:'Advanced camera control and motion masking',         type:'inference.kling.txt2vid.v1',             family:'Kling',       mode:'video' },
  { label:'Sora 2',             desc:'OpenAI cinematic video generation',                  type:'inference.sora-2.txt2vid.v1',            family:'Sora 2',      mode:'video' },
  { label:'Sora 2 Pro',         desc:'Synchronized audio, 12 seconds, premium quality',   type:'inference.sora-2.pro.txt2vid.v1',        family:'Sora 2',      mode:'video', badge:'Pro' },
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

// ─── Theme ────────────────────────────────────────────────────────────────────
function T(d: boolean) {
  return {
    bg:         d ? '#07000f'                                         : '#f8f4ff',
    bgMain:     d ? '#0a0015'                                         : '#f0eaff',
    surface:    d ? 'rgba(255,255,255,0.05)'                          : 'rgba(255,255,255,0.9)',
    surfaceHov: d ? 'rgba(255,255,255,0.08)'                          : '#fff',
    border:     d ? 'rgba(255,255,255,0.07)'                          : 'rgba(180,120,220,0.2)',
    borderStr:  d ? 'rgba(232,121,249,0.5)'                           : 'rgba(232,121,249,0.6)',
    text:       d ? '#f0e8ff'                                         : '#1a0a2e',
    textSub:    d ? 'rgba(240,232,255,0.5)'                           : 'rgba(26,10,46,0.55)',
    textMuted:  d ? 'rgba(240,232,255,0.28)'                          : 'rgba(26,10,46,0.32)',
    textAccent: d ? '#e879f9'                                         : '#9333ea',
    inputBg:    d ? 'rgba(255,255,255,0.045)'                         : 'rgba(255,255,255,0.92)',
    inputBord:  d ? 'rgba(255,255,255,0.08)'                          : 'rgba(180,120,220,0.25)',
    sidebarBg:  d ? 'rgba(10,4,22,0.82)'                              : 'rgba(255,255,255,0.72)',
    headerBg:   d ? 'rgba(7,0,15,0.92)'                               : 'rgba(248,244,255,0.92)',
    cardPend:   d ? '#0d0120'                                         : '#f5e8ff',
    cardPendBord: d ? 'rgba(232,121,249,0.15)'                        : 'rgba(200,130,230,0.3)',
    skA:        d ? 'rgba(100,40,140,0.12)'                           : 'rgba(200,150,240,0.2)',
    skB:        d ? 'rgba(232,121,249,0.2)'                           : 'rgba(232,121,249,0.35)',
    orb1:       d ? 'rgba(120,40,180,0.12)'                           : 'rgba(139,43,226,0.06)',
    orb2:       d ? 'rgba(232,121,249,0.08)'                          : 'rgba(255,45,154,0.05)',
    lbBg:       d ? 'rgba(7,0,15,0.97)'                               : 'rgba(248,244,255,0.97)',
    selOptBg:   d ? '#120025'                                         : '#f5e6ff',
    footerBg:   d ? 'rgba(7,0,15,0.9)'                                : 'rgba(248,244,255,0.9)',
    modeBg:     d ? 'rgba(255,255,255,0.05)'                          : 'rgba(180,120,220,0.1)',
    modeBord:   d ? 'rgba(255,255,255,0.08)'                          : 'rgba(180,120,220,0.2)',
  };
}

const CSS = [
  '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
  'html,body,#__next{height:100%;overflow:hidden}',
  "body{-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif}",
  '::-webkit-scrollbar{width:3px}',
  '::-webkit-scrollbar-track{background:transparent}',
  '::-webkit-scrollbar-thumb{background:rgba(232,121,249,0.3);border-radius:99px}',
  'input[type=range]{-webkit-appearance:none;height:2px;border-radius:99px;outline:none;width:100%;background:rgba(255,255,255,0.08)}',
  'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#e879f9,#8b5cf6);cursor:pointer;box-shadow:0 0 10px rgba(232,121,249,0.5)}',
  'select option{background:var(--sel-bg,#120025);color:inherit}',
  '@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
  '@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}',
  '@keyframes ring-pulse{0%,100%{transform:scale(1);opacity:0.12}50%{transform:scale(1.06);opacity:0.25}}',
  '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}',
  '@keyframes fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes card-pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}',
  '@keyframes glow-breathe{0%,100%{box-shadow:0 0 24px rgba(232,121,249,0.3),0 0 48px rgba(139,92,246,0.15)}50%{box-shadow:0 0 48px rgba(232,121,249,0.55),0 0 96px rgba(139,92,246,0.28)}}',
  '@keyframes skeleton{0%{background-position:200% 0}100%{background-position:-200% 0}}',
  '@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}',
  '@keyframes banner-glow{0%,100%{opacity:0.75}50%{opacity:1}}',
  '@keyframes pulse-ring{0%{transform:scale(0.95);opacity:0.5}100%{transform:scale(1.05);opacity:0}}',
  '.shimmer-btn{background:linear-gradient(90deg,#e879f9,#a855f7,#8b5cf6,#a855f7,#e879f9);background-size:300% 100%;animation:shimmer 3s linear infinite;transition:filter 0.2s,transform 0.15s,box-shadow 0.2s}',
  '.shimmer-btn:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-2px)}',
  '.shimmer-btn:active:not(:disabled){transform:translateY(1px)}',
  '.card-pop{animation:card-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both}',
  '.result-card .overlay{opacity:0;transition:opacity 0.2s}',
  '.result-card:hover .overlay{opacity:1}',
  '.result-card{transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.22s}',
  '.result-card:hover{transform:translateY(-5px) scale(1.018)}',
  '.fade-up{animation:fade-up 0.38s cubic-bezier(0.22,1,0.36,1) both}',
  '.scroll-pane{overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(232,121,249,0.3) transparent}',
  '.model-card{transition:all 0.18s cubic-bezier(0.22,1,0.36,1)}',
  '.model-card:hover{transform:translateX(2px)}',
].join('\n');

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconImage = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
const IconVideo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const IconSun = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconMoon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IconKey = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>;
const IconGithub = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.7.115 2.5.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/></svg>;
const IconStar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>;
const IconCheck = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconDownload = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconSparkle = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z"/></svg>;

function Spinner({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.7s linear infinite', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#spg2)" strokeWidth="2.5" strokeLinecap="round"/>
      <defs><linearGradient id="spg2" x1="0%" y1="0%" x2="100%"><stop stopColor="#e879f9"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    </svg>
  );
}
function Grad({ children, size }: { children: React.ReactNode; size?: number }) {
  return <span style={{ background:'linear-gradient(90deg,#e879f9,#c084fc,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:size }}>{children}</span>;
}

// ─── API Key Modal ─────────────────────────────────────────────────────────────
function ApiKeyModal({ onSave, tk }: { onSave: (k: string) => void; tk: ReturnType<typeof T> }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:tk.lbBg, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(20px)' }}>
      <div className="fade-up" style={{ width:460, padding:40, borderRadius:28, background:tk.surface, border:`1px solid ${tk.borderStr}`, boxShadow:'0 0 100px rgba(232,121,249,0.12),0 32px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:32 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:'linear-gradient(135deg,#e879f9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', animation:'glow-breathe 3s ease-in-out infinite', flexShrink:0 }}>
            <IconStar/>
          </div>
          <div>
            <div style={{ fontSize:24, fontWeight:900, lineHeight:1 }}><Grad>Pixio</Grad></div>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:tk.textMuted, marginTop:3 }}>Open Source</div>
          </div>
        </div>
        <h2 style={{ fontSize:20, fontWeight:800, marginBottom:10, color:tk.text }}>Add your Prodia API key</h2>
        <p style={{ fontSize:14, color:tk.textSub, lineHeight:1.7, marginBottom:16 }}>
          Pixio uses your own Prodia API key — stored only in your browser, never shared.
        </p>
        <a href="https://app.prodia.com" target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:12, background:'rgba(232,121,249,0.06)', border:'1px solid rgba(232,121,249,0.2)', marginBottom:20, textDecoration:'none', transition:'all 0.2s', cursor:'pointer' }}
          onMouseEnter={(e:any)=>e.currentTarget.style.borderColor='rgba(232,121,249,0.45)'}
          onMouseLeave={(e:any)=>e.currentTarget.style.borderColor='rgba(232,121,249,0.2)'}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e879f9' }}>Get a free API key</div>
            <div style={{ fontSize:11.5, color:tk.textMuted, marginTop:2 }}>app.prodia.com → Sign up → API Keys</div>
          </div>
          <span style={{ fontSize:16, color:'rgba(232,121,249,0.6)' }}>↗</span>
        </a>
        <input type="password" value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&val.trim()&&onSave(val.trim())}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
          style={{ width:'100%', background:tk.inputBg, border:`1px solid ${tk.inputBord}`, borderRadius:14, padding:'14px 18px', fontSize:13, color:tk.text, marginBottom:16, outline:'none', transition:'border-color 0.2s,box-shadow 0.2s', fontFamily:'monospace' }}
          onFocus={e=>{ e.currentTarget.style.borderColor=tk.borderStr; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(232,121,249,0.1)`; }}
          onBlur={e=>{ e.currentTarget.style.borderColor=tk.inputBord; e.currentTarget.style.boxShadow='none'; }}
          autoFocus/>
        <button onClick={()=>val.trim()&&onSave(val.trim())} className="shimmer-btn"
          style={{ width:'100%', padding:'15px', borderRadius:14, border:'none', cursor:'pointer', fontSize:15, fontWeight:800, color:'white', letterSpacing:'0.02em', boxShadow:'0 8px 40px rgba(232,121,249,0.4)' }}>
          Start Creating
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted]           = useState(false);
  const [theme, setTheme]               = useState<Theme>('dark');
  const [apiKey, setApiKey]             = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [mode, setMode]                 = useState<Mode>('image');
  const [prompt, setPrompt]             = useState('');
  const [neg, setNeg]                   = useState('');
  const [selTypes, setSelTypes]         = useState<string[]>(['inference.flux-fast.schnell.txt2img.v2']);
  const [activeFamily, setActiveFamily] = useState<Family | 'All'>('All');
  const [steps, setSteps]               = useState(25);
  const [guidance, setGuidance]         = useState(8);
  const [seed, setSeed]                 = useState(-1);
  const [width, setWidth]               = useState(1024);
  const [height, setHeight]             = useState(1024);
  const [sdxlStyle, setSdxlStyle]       = useState('');
  const [resolution, setResolution]     = useState('720p');
  const [aspectRatio, setAspectRatio]   = useState('16:9');
  const [duration, setDuration]         = useState(4);
  const [genAudio, setGenAudio]         = useState(false);
  const [adv, setAdv]                   = useState(false);
  const [bannerOff, setBannerOff]       = useState(false);
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [err, setErr]                   = useState('');
  const [lbIdx, setLbIdx]               = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const k = localStorage.getItem('PIXIO_API_KEY');
    if (k) setApiKey(k); else setShowKeyModal(true);
    const t = localStorage.getItem('PIXIO_THEME') as Theme | null;
    if (t) setTheme(t);
  }, []);

  const tk = T(theme === 'dark');
  const isDark = theme === 'dark';

  const toggleTheme = () => setTheme(prev => { const n = prev==='dark'?'light':'dark'; localStorage.setItem('PIXIO_THEME',n); return n; });
  const saveKey = (k: string) => { localStorage.setItem('PIXIO_API_KEY',k); setApiKey(k); setShowKeyModal(false); };

  const switchMode = (m: Mode) => {
    setMode(m); setActiveFamily('All');
    setSelTypes(m==='image' ? ['inference.flux-fast.schnell.txt2img.v2'] : ['inference.veo.fast.txt2vid.v2']);
  };
  const allModels = mode==='image' ? IMAGE_MODELS : VIDEO_MODELS;
  const families = (mode==='image' ? IMG_FAMILIES : VID_FAMILIES) as Family[];
  const familyModels = (activeFamily as string)==='All' ? allModels : allModels.filter(m=>m.family===activeFamily);
  const toggleModel = useCallback((t:string)=>setSelTypes(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]),[]);

  const isSafe = (t:string)=>!PROHIBITED.some(w=>t.toLowerCase().includes(w));
  const activeCount = slots.filter(s=>s.status==='pending').length;
  const showSdxl = mode==='image' && selTypes.some(t=>t.includes('sdxl')||t.includes('sd15'));
  const showVeoAudio = mode==='video' && selTypes.some(t=>t.includes('veo')&&t.includes('v2'));

  const generate = () => {
    if (!apiKey) { setShowKeyModal(true); return; }
    if (!prompt.trim()) { setErr('Add a prompt to continue.'); return; }
    if (!isSafe(prompt)||!isSafe(neg)) { setErr('Prompt contains prohibited content.'); return; }
    if (!selTypes.length) { setErr('Select at least one model.'); return; }
    setErr('');
    const newSlots: Slot[] = selTypes.map(type=>({
      id: Math.random().toString(36).slice(2), status:'pending' as SlotStatus,
      model: allModels.find(m=>m.type===type)?.label??type, prompt,
      family: allModels.find(m=>m.type===type)?.family,
    }));
    setSlots(prev=>[...newSlots,...prev]);
    newSlots.forEach((slot,i)=>{
      const type = selTypes[i];
      const m = allModels.find(x=>x.type===type)!;
      const config = mode==='image'
        ? buildImageConfig(type,m.family as ImgFamily,{prompt,neg,steps,guidance,seed,width,height,style:sdxlStyle})
        : buildVideoConfig(type,{prompt,neg,resolution,aspect_ratio:aspectRatio,duration,audio:genAudio});
      axios.post('/api/generateImage',{type,config,apiKey})
        .then(res=>setSlots(prev=>prev.map(s=>s.id===slot.id?{...s,status:'done',url:res.data.url,isVideo:res.data.video}:s)))
        .catch((e:any)=>{
          const msg = e.response?.data?.message??e.message??'Failed';
          setSlots(prev=>prev.map(s=>s.id===slot.id?{...s,status:'error',error:msg}:s));
        });
    });
  };

  const doneSlots = slots.filter(s=>s.status==='done');

  const inputBase: React.CSSProperties = {
    width:'100%', background:tk.inputBg, border:`1px solid ${tk.inputBord}`,
    borderRadius:12, padding:'11px 14px', fontSize:13, color:tk.text,
    outline:'none', transition:'border-color 0.2s,box-shadow 0.2s',
  };
  const onFocus = (e:React.FocusEvent<any>)=>{ e.currentTarget.style.borderColor=tk.borderStr; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(232,121,249,0.08)`; };
  const onBlur  = (e:React.FocusEvent<any>)=>{ e.currentTarget.style.borderColor=tk.inputBord; e.currentTarget.style.boxShadow='none'; };

  if (!mounted) return null;

  return (
    <>
      <Head><title>Pixio Open Source — AI Studio</title><meta name="viewport" content="width=device-width,initial-scale=1"/></Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {showKeyModal && <ApiKeyModal onSave={saveKey} tk={tk}/>}

      {/* Banner */}
      {!bannerOff && (
        <a href="https://beta.pixio.myapps.ai" target="_blank" rel="noreferrer"
          style={{ position:'fixed', top:0, left:0, right:0, zIndex:150, height:36, display:'flex', alignItems:'center', overflow:'hidden', cursor:'pointer', textDecoration:'none', background:'#020008', borderBottom:'1px solid rgba(232,121,249,0.15)' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(232,121,249,0.06),transparent)', backgroundSize:'200% 100%', animation:'shimmer 3s linear infinite', pointerEvents:'none' }}/>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'marquee 20s linear infinite', willChange:'transform' }}>
            {[0,1].map(i=>(
              <div key={i} style={{ display:'flex', alignItems:'center' }}>
                {Array.from({length:7}).map((_,j)=>(
                  <span key={j} style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'0 32px', fontSize:12, fontWeight:600, letterSpacing:'0.02em' }}>
                    <span style={{ opacity:0.4, color:'white' }}>✦</span>
                    <span style={{ background:'linear-gradient(90deg,#e879f9,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 }}>Pixio</span>
                    <span style={{ color:'rgba(255,255,255,0.45)' }}>Try the full platform at</span>
                    <span style={{ color:'white', fontWeight:700, letterSpacing:'0.01em' }}>beta.pixio.myapps.ai</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
          <button onClick={e=>{e.preventDefault();e.stopPropagation();setBannerOff(true);}}
            style={{ position:'absolute', right:14, width:24, height:24, borderRadius:7, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>×</button>
        </a>
      )}

      {/* Ambient */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:900, height:900, borderRadius:'50%', background:`radial-gradient(circle,${tk.orb1} 0%,transparent 65%)`, top:-400, left:-300 }}/>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:`radial-gradient(circle,${tk.orb2} 0%,transparent 65%)`, bottom:-250, right:-150 }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, height:'100vh', display:'flex', flexDirection:'column', background:tk.bg, color:tk.text, paddingTop:bannerOff?0:36 }}>

        {/* Header */}
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:56, borderBottom:`1px solid ${tk.border}`, background:tk.headerBg, backdropFilter:'blur(28px)', flexShrink:0, gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#e879f9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', animation:'glow-breathe 3s ease-in-out infinite', flexShrink:0 }}>
              <IconStar/>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:900, lineHeight:1 }}><Grad>Pixio</Grad></div>
              <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:tk.textMuted, marginTop:2 }}>Open Source</div>
            </div>
          </div>

          {/* Mode switcher */}
          <div style={{ display:'flex', gap:2, padding:3, borderRadius:12, background:tk.modeBg, border:`1px solid ${tk.modeBord}` }}>
            {(['image','video'] as Mode[]).map(m=>(
              <button key={m} onClick={()=>switchMode(m)}
                style={{ padding:'7px 20px', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.2s', display:'flex', alignItems:'center', gap:7,
                  background: mode===m ? 'linear-gradient(135deg,#e879f9,#8b5cf6)' : 'transparent',
                  color: mode===m ? 'white' : tk.textSub,
                  boxShadow: mode===m ? '0 2px 16px rgba(232,121,249,0.4)' : 'none' }}>
                <span style={{ opacity: mode===m ? 1 : 0.6 }}>{m==='image' ? <IconImage/> : <IconVideo/>}</span>
                {m==='image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {activeCount>0 && (
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:99, background:'rgba(232,121,249,0.08)', border:'1px solid rgba(232,121,249,0.2)' }}>
                <Spinner size={13}/>
                <span style={{ fontSize:12, fontWeight:700, color:'#e879f9' }}>{activeCount} generating</span>
              </div>
            )}
            <button onClick={toggleTheme} style={{ width:34, height:34, borderRadius:10, background:tk.surface, border:`1px solid ${tk.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:tk.textSub, transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=tk.borderStr;e.currentTarget.style.color=tk.text;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=tk.border;e.currentTarget.style.color=tk.textSub;}}>
              {isDark ? <IconSun/> : <IconMoon/>}
            </button>
            {apiKey && (
              <button onClick={()=>setShowKeyModal(true)} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, padding:'6px 12px', borderRadius:99, background:tk.surface, border:`1px solid ${tk.border}`, color:tk.textSub, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=tk.borderStr;e.currentTarget.style.color=tk.text;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=tk.border;e.currentTarget.style.color=tk.textSub;}}>
                <IconKey/> API Key
              </button>
            )}
            <a href="https://github.com/Tech-in-Schools-Inititaitive/pixio-community-lite-edition" target="_blank" rel="noreferrer"
              style={{ color:tk.textMuted, textDecoration:'none', display:'flex', alignItems:'center', transition:'color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#e879f9')} onMouseLeave={e=>(e.currentTarget.style.color=tk.textMuted)}>
              <IconGithub/>
            </a>
          </div>
        </header>

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Sidebar */}
          <aside style={{ width:320, flexShrink:0, borderRight:`1px solid ${tk.border}`, background:tk.sidebarBg, backdropFilter:'blur(40px)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Scrollable area */}
            <div style={{ flex:1, minHeight:0, position:'relative', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div className="scroll-pane" style={{ flex:1, overflowY:'auto', padding:'20px 18px', display:'flex', flexDirection:'column', gap:20, minHeight:0 }}>

                {/* Prompt */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:tk.textAccent, marginBottom:10 }}>
                    {mode==='image' ? 'Describe Your Image' : 'Describe Your Video'}
                  </div>
                  <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&generate()}
                    placeholder={mode==='image'
                      ? 'A glowing jellyfish drifting through a neon ocean at night, cinematic lighting…'
                      : 'A sweeping mountain landscape at golden hour, camera slowly panning left…'}
                    rows={5}
                    style={{ ...inputBase, resize:'none', lineHeight:1.65, fontSize:13.5, borderRadius:14 }}
                    onFocus={onFocus} onBlur={onBlur}/>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, padding:'0 2px' }}>
                    <span style={{ fontSize:11, color:tk.textMuted }}>⌘ + Enter to generate</span>
                    <span style={{ fontSize:11, color:prompt.length>450?'#e879f9':tk.textMuted, fontVariantNumeric:'tabular-nums' }}>{prompt.length}</span>
                  </div>
                </div>

                {/* Model selector */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:tk.textAccent }}>Model</div>
                    <div style={{ display:'flex', gap:12 }}>
                      <button onClick={()=>setSelTypes(familyModels.map(m=>m.type))} style={{ fontSize:11, fontWeight:600, color:'#e879f9', background:'none', border:'none', cursor:'pointer', transition:'opacity 0.15s' }} onMouseEnter={e=>e.currentTarget.style.opacity='0.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Select all</button>
                      <button onClick={()=>setSelTypes([])} style={{ fontSize:11, fontWeight:600, color:tk.textMuted, background:'none', border:'none', cursor:'pointer', transition:'opacity 0.15s' }} onMouseEnter={e=>e.currentTarget.style.opacity='0.6'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Clear</button>
                    </div>
                  </div>

                  {/* Family filter */}
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
                    {(['All',...families] as string[]).map(f=>{
                      const active = (activeFamily as string)===f;
                      const hue = f==='All' ? '#e879f9' : (FAMILY_HUE[f]??'#e879f9');
                      return (
                        <button key={f} onClick={()=>setActiveFamily(f as Family|'All')}
                          style={{ padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
                            background: active ? `${hue}18` : 'transparent',
                            borderColor: active ? `${hue}60` : tk.border,
                            color: active ? hue : tk.textMuted,
                            boxShadow: active ? `0 0 12px ${hue}25` : 'none' }}>
                          {f}
                        </button>
                      );
                    })}
                  </div>

                  {/* Model list */}
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {(()=>{
                      const renderCard = (m: Model) => {
                        const sel = selTypes.includes(m.type);
                        const hue = FAMILY_HUE[m.family as string]??'#e879f9';
                        return (
                          <button key={m.type} onClick={()=>toggleModel(m.type)} className="model-card"
                            style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'11px 13px', borderRadius:12, border:`1px solid`, cursor:'pointer', textAlign:'left', width:'100%',
                              background: sel ? (isDark?`linear-gradient(135deg,${hue}1a,${hue}0d)`:` ${hue}0d`) : tk.surface,
                              borderColor: sel ? `${hue}55` : tk.border,
                              boxShadow: sel ? `0 4px 20px ${hue}28, inset 0 1px 0 ${hue}30` : `inset 0 1px 0 rgba(255,255,255,${isDark?'0.04':'0.6'})` }}>
                            <div style={{ minWidth:0, flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:sel?tk.text:tk.textSub, marginBottom:3, letterSpacing:'-0.01em' }}>{m.label}</div>
                              <div style={{ fontSize:11.5, color:tk.textMuted, lineHeight:1.45 }}>{m.desc}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, marginLeft:10, marginTop:1 }}>
                              {m.badge && <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99, background:`${hue}1a`, border:`1px solid ${hue}35`, color:hue, letterSpacing:'0.06em', textTransform:'uppercase' }}>{m.badge}</span>}
                              <div style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${sel?hue:tk.border}`, background:sel?hue:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', boxShadow:sel?`0 0 10px ${hue}50`:'none', flexShrink:0, color:'white' }}>
                                {sel && <IconCheck/>}
                              </div>
                            </div>
                          </button>
                        );
                      };
                      if ((activeFamily as string)!=='All') return familyModels.map(renderCard);
                      return families.flatMap((f,fi)=>{
                        const fModels = allModels.filter(m=>m.family===f);
                        if (!fModels.length) return [];
                        const hue = FAMILY_HUE[f as string]??'#e879f9';
                        return [
                          <div key={`hdr-${f}`} style={{ display:'flex', alignItems:'center', gap:8, padding: fi===0 ? '2px 0 8px' : '14px 0 8px' }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:hue, flexShrink:0, boxShadow:`0 0 8px ${hue}` }}/>
                            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:hue }}>{f as string}</span>
                            <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg,${hue}30,transparent)` }}/>
                          </div>,
                          ...fModels.map(renderCard),
                        ];
                      });
                    })()}
                  </div>

                  {selTypes.length>0 && (
                    <div style={{ marginTop:10, fontSize:12, color:tk.textAccent, fontWeight:600 }}>
                      {selTypes.length} model{selTypes.length>1?'s':''} selected{selTypes.length>1?` — ${selTypes.length} results per run`:''}
                    </div>
                  )}
                </div>

                {/* Video settings */}
                {mode==='video' && (
                  <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:tk.textAccent }}>Video Settings</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      {([['Resolution',resolution,setResolution,['480p','720p','1080p']],['Aspect',aspectRatio,setAspectRatio,['16:9','9:16','1:1','4:3']]] as any[]).map(([lbl,val,set,opts])=>(
                        <div key={lbl}>
                          <div style={{ fontSize:11, fontWeight:600, color:tk.textSub, marginBottom:7 }}>{lbl}</div>
                          <select value={val} onChange={(e:any)=>set(e.target.value)} style={{ ...inputBase, padding:'9px 12px', fontSize:12 }}>
                            {opts.map((o:string)=><option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:tk.textSub }}>Duration</span>
                        <span style={{ fontSize:11, fontWeight:700, color:tk.textAccent }}>{duration}s</span>
                      </div>
                      <input type="range" min={4} max={8} step={1} value={duration} onChange={e=>setDuration(+e.target.value)}/>
                    </div>
                    {showVeoAudio && (
                      <label style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                        <div onClick={()=>setGenAudio(!genAudio)}
                          style={{ width:40, height:22, borderRadius:99, background:genAudio?'linear-gradient(90deg,#e879f9,#8b5cf6)':tk.inputBg, border:`1px solid ${tk.border}`, position:'relative', cursor:'pointer', flexShrink:0, transition:'background 0.2s' }}>
                          <div style={{ position:'absolute', width:16, height:16, borderRadius:'50%', background:'white', top:2, transition:'left 0.2s', left:genAudio?20:3, boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:tk.textSub }}>Generate Audio</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Advanced (image) */}
                {mode==='image' && (
                  <>
                    <button onClick={()=>setAdv(!adv)}
                      style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'none', cursor:'pointer', color:tk.textMuted, fontSize:12, fontWeight:600, padding:'0', transition:'color 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.color='#e879f9'} onMouseLeave={e=>e.currentTarget.style.color=tk.textMuted}>
                      <span style={{ display:'inline-block', transition:'transform 0.2s', transform:adv?'rotate(90deg)':'none' }}>›</span> Advanced
                    </button>
                    {adv && (
                      <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:14, marginTop:-10 }}>
                        {showSdxl && (
                          <>
                            <div>
                              <div style={{ fontSize:11, fontWeight:600, color:tk.textSub, marginBottom:7 }}>Negative Prompt</div>
                              <textarea value={neg} onChange={e=>setNeg(e.target.value)} placeholder="blurry, low quality, watermark…" rows={2} style={{ ...inputBase, resize:'none' }} onFocus={onFocus} onBlur={onBlur}/>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              {([['Steps',steps,setSteps,1,50],['Guidance',guidance,setGuidance,1,20]] as any[]).map(([lbl,val,set,min,max])=>(
                                <div key={lbl}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                                    <span style={{ fontSize:11, fontWeight:600, color:tk.textSub }}>{lbl}</span>
                                    <span style={{ fontSize:11, fontWeight:700, color:tk.textAccent }}>{val}</span>
                                  </div>
                                  <input type="range" min={min} max={max} value={val} onChange={(e:any)=>set(+e.target.value)}/>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:tk.textSub, marginBottom:7 }}>Seed <span style={{ color:tk.textMuted }}>(-1 = random)</span></div>
                          <input type="number" value={seed} onChange={e=>setSeed(+e.target.value)} style={inputBase} onFocus={onFocus} onBlur={onBlur}/>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Gradient fade */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:56, background:`linear-gradient(to bottom,transparent,${isDark?'rgba(10,4,22,0.95)':'rgba(248,244,255,0.95)'})`, pointerEvents:'none' }}/>
            </div>

            {/* Generate footer */}
            <div style={{ padding:'16px 18px', borderTop:`1px solid ${tk.border}`, background:tk.footerBg, backdropFilter:'blur(24px)', flexShrink:0 }}>
              {err && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:11, background:'rgba(232,121,249,0.07)', border:'1px solid rgba(232,121,249,0.2)', fontSize:12.5, color:'#e879f9', lineHeight:1.5, marginBottom:12 }}>
                  {err}
                </div>
              )}
              <button onClick={generate} disabled={!selTypes.length} className="shimmer-btn"
                style={{ width:'100%', padding:'15px', borderRadius:14, border:'none', cursor:selTypes.length?'pointer':'not-allowed', fontSize:14.5, fontWeight:800, color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:10, letterSpacing:'0.01em', boxShadow:'0 8px 40px rgba(232,121,249,0.35),0 0 80px rgba(139,92,246,0.15)', opacity:selTypes.length?1:0.45 }}>
                <IconSparkle/>
                {selTypes.length===0 ? 'Select a Model' : selTypes.length>1 ? `Generate ${selTypes.length} ${mode==='image'?'Images':'Videos'}` : `Generate ${mode==='image'?'Image':'Video'}`}
              </button>
              {mode==='video' && <div style={{ textAlign:'center', fontSize:11, color:tk.textMuted, marginTop:9 }}>Videos take 20–60 seconds · you can keep generating</div>}
            </div>
          </aside>

          {/* Canvas */}
          <main style={{ flex:1, overflowY:'auto', padding:20, background:tk.bgMain }}>
            {slots.length===0 ? (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, userSelect:'none' }}>
                <div style={{ position:'relative', width:120, height:120 }}>
                  {[0,1,2].map(i=><div key={i} style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(232,121,249,0.12)', animation:`ring-pulse ${4+i*1.5}s ease-in-out infinite`, animationDelay:`${i*0.9}s`, transform:`scale(${1+i*0.28})` }}/>)}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', animation:'float 4s ease-in-out infinite' }}>
                    <div style={{ width:60, height:60, borderRadius:20, background:isDark?'rgba(232,121,249,0.1)':'rgba(232,121,249,0.08)', border:'1px solid rgba(232,121,249,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(232,121,249,0.15)' }}>
                      <div style={{ color:'rgba(232,121,249,0.7)' }}>{mode==='image'?<IconImage/>:<IconVideo/>}</div>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:24, fontWeight:900, marginBottom:10, letterSpacing:'-0.02em' }}><Grad>Your canvas awaits</Grad></div>
                  <div style={{ fontSize:14, color:tk.textSub, lineHeight:1.7 }}>
                    Select models · Write your vision<br/>
                    Press <kbd style={{ padding:'2px 8px', borderRadius:6, background:isDark?'rgba(255,255,255,0.07)':'rgba(26,10,46,0.06)', border:`1px solid ${tk.border}`, fontSize:12, color:tk.text, fontFamily:'inherit' }}>⌘ Enter</kbd> to generate
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', maxWidth:440 }}>
                  {['Glowing jellyfish in a neon ocean, cinematic','Cyberpunk city at night in the rain, 4K','Fox samurai in ancient Japan, oil painting'].map(ex=>(
                    <button key={ex} onClick={()=>setPrompt(ex)}
                      style={{ padding:'7px 14px', borderRadius:99, fontSize:12, fontWeight:500, background:tk.surface, border:`1px solid ${tk.border}`, color:tk.textSub, cursor:'pointer', transition:'all 0.2s', letterSpacing:'-0.01em' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=tk.borderStr;e.currentTarget.style.color=tk.text;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=tk.border;e.currentTarget.style.color=tk.textSub;}}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                {slots.map(slot=>{
                  const hue = slot.family?(FAMILY_HUE[slot.family]??'#e879f9'):'#e879f9';
                  if (slot.status==='pending') return (
                    <div key={slot.id} className="card-pop" style={{ aspectRatio:'1', borderRadius:18, border:`1px solid ${tk.cardPendBord}`, background:tk.cardPend, overflow:'hidden', position:'relative' }}>
                      <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${tk.skA} 25%,${tk.skB} 50%,${tk.skA} 75%)`, backgroundSize:'400% 100%', animation:'skeleton 1.8s ease-in-out infinite' }}/>
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                        <Spinner size={26}/>
                        <div style={{ textAlign:'center', padding:'0 16px' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:hue, marginBottom:4 }}>{slot.model}</div>
                          <div style={{ fontSize:11, color:tk.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{slot.prompt}</div>
                        </div>
                      </div>
                    </div>
                  );
                  if (slot.status==='error') return (
                    <div key={slot.id} className="card-pop" style={{ aspectRatio:'1', borderRadius:18, border:'1px solid rgba(239,68,68,0.2)', background:isDark?'rgba(30,5,5,0.9)':'rgba(255,245,245,0.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:18, textAlign:'center' }}>
                      <div style={{ fontSize:26 }}>⚠</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>{slot.model}</div>
                      <div style={{ fontSize:11, color:tk.textSub, lineHeight:1.45 }}>{slot.error}</div>
                    </div>
                  );
                  const doneIdx = doneSlots.findIndex(s=>s.id===slot.id);
                  return (
                    <div key={slot.id} className="result-card card-pop" onClick={()=>setLbIdx(doneIdx)}
                      style={{ aspectRatio:'1', borderRadius:18, overflow:'hidden', cursor:'zoom-in', position:'relative', border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(180,120,220,0.15)'}`, boxShadow:`0 4px 24px rgba(0,0,0,0.3)` }}>
                      {slot.isVideo
                        ? <video src={slot.url} autoPlay loop muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                        : <img src={slot.url!} alt={slot.prompt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>}
                      <div style={{ position:'absolute', top:10, left:10, padding:'3px 9px', borderRadius:99, background:`${hue}cc`, fontSize:9.5, fontWeight:700, color:'white', backdropFilter:'blur(8px)', letterSpacing:'0.04em' }}>{slot.family}</div>
                      <div className="overlay" style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%)' }}>
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'white', marginBottom:3 }}>{slot.model}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:9 }}>{slot.prompt}</div>
                          <button onClick={e=>{e.stopPropagation();const a=document.createElement('a');a.href=slot.url!;a.download=slot.isVideo?'pixio.mp4':'pixio.jpg';a.click();}}
                            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:99, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', fontSize:11, fontWeight:700, color:'white', cursor:'pointer', backdropFilter:'blur(8px)', letterSpacing:'0.02em' }}>
                            <IconDownload/> Save {slot.isVideo?'MP4':'JPG'}
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
      {lbIdx!==null && lbIdx<doneSlots.length && (()=>{
        const slot = doneSlots[lbIdx];
        return (
          <div onClick={()=>setLbIdx(null)} style={{ position:'fixed', inset:0, zIndex:100, background:tk.lbBg, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(24px)' }}>
            <div onClick={e=>e.stopPropagation()} className="fade-up" style={{ maxWidth:900, width:'calc(100vw - 100px)', position:'relative' }}>
              {slot.isVideo
                ? <video src={slot.url} autoPlay loop controls style={{ width:'100%', borderRadius:22, display:'block', boxShadow:'0 0 100px rgba(232,121,249,0.18),0 0 0 1px rgba(232,121,249,0.15)' }}/>
                : <img src={slot.url!} alt={slot.prompt} style={{ width:'100%', borderRadius:22, display:'block', boxShadow:'0 0 100px rgba(232,121,249,0.18),0 0 0 1px rgba(232,121,249,0.15)' }}/>}
              <div style={{ position:'absolute', top:14, right:14, display:'flex', gap:8 }}>
                <a href={slot.url!} download={slot.isVideo?'pixio.mp4':'pixio.jpg'} onClick={e=>e.stopPropagation()}
                  style={{ width:38, height:38, borderRadius:11, background:'rgba(232,121,249,0.15)', border:'1px solid rgba(232,121,249,0.35)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', textDecoration:'none', backdropFilter:'blur(12px)' }}>
                  <IconDownload/>
                </a>
                <button onClick={()=>setLbIdx(null)} style={{ width:38, height:38, borderRadius:11, background:isDark?'rgba(255,255,255,0.07)':'rgba(26,10,46,0.06)', border:`1px solid ${tk.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:tk.text, cursor:'pointer', fontSize:20, backdropFilter:'blur(12px)' }}>×</button>
              </div>
              {doneSlots.length>1 && <>
                <button onClick={e=>{e.stopPropagation();setLbIdx((lbIdx-1+doneSlots.length)%doneSlots.length);}} style={{ position:'absolute', left:-56, top:'50%', transform:'translateY(-50%)', width:42, height:42, borderRadius:13, background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.35)', color:'white', cursor:'pointer', fontSize:24, backdropFilter:'blur(12px)' }}>‹</button>
                <button onClick={e=>{e.stopPropagation();setLbIdx((lbIdx+1)%doneSlots.length);}} style={{ position:'absolute', right:-56, top:'50%', transform:'translateY(-50%)', width:42, height:42, borderRadius:13, background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.35)', color:'white', cursor:'pointer', fontSize:24, backdropFilter:'blur(12px)' }}>›</button>
              </>}
              <div style={{ marginTop:16, textAlign:'center' }}>
                <span style={{ fontWeight:800, fontSize:14 }}><span style={{ color:'#e879f9' }}>{slot.model}</span></span>
                <span style={{ color:tk.textMuted, margin:'0 12px' }}>·</span>
                <span style={{ fontSize:13, color:tk.textSub }}>{slot.prompt}</span>
                <div style={{ fontSize:11, color:tk.textMuted, marginTop:5 }}>{lbIdx+1} / {doneSlots.length}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
