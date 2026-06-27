export type SurfaceMode = 'regular' | 'canvas' | 'nodes';
export type MediaMode = 'image' | 'video';

export type ModelFamily =
  | 'FLUX'
  | 'Google AI'
  | 'Stable Diffusion'
  | 'ByteDance'
  | 'Recraft'
  | 'Google Veo'
  | 'Wan'
  | 'Kling'
  | 'Sora 2'
  | 'Pruna';

export interface PixioModel {
  label: string;
  type: string;
  family: ModelFamily;
  medium: MediaMode;
  desc: string;
  badge?: string;
}

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  medium: MediaMode;
  selectedTypes: string[];
  steps: number;
  guidance: number;
  seed: number;
  width: number;
  height: number;
  style: string;
  resolution: string;
  aspectRatio: string;
  duration: number;
  generateAudio: boolean;
  outputFormat: 'jpeg' | 'png' | 'webp';
  trackCost: boolean;
}

export const PRODIA_DOCS_URL = 'https://docs.prodia.com/reference/inference/';
export const PRODIA_COST_DOCS_URL = 'https://docs.prodia.com/guides/tracking-costs/';

export const FAMILY_COLORS: Record<ModelFamily, string> = {
  FLUX: '#ff5fb7',
  'Google AI': '#8b5cf6',
  'Stable Diffusion': '#c084fc',
  ByteDance: '#ff78a8',
  Recraft: '#e879f9',
  'Google Veo': '#8b5cf6',
  Wan: '#ff5fb7',
  Kling: '#c084fc',
  'Sora 2': '#ff78a8',
  Pruna: '#e879f9',
};

export const SDXL_STYLES = [
  'photographic',
  'cinematic',
  'digital-art',
  'anime',
  '3d-model',
  'pixel-art',
  'comic-book',
  'fantasy-art',
  'neon-punk',
];

export const PROHIBITED_TERMS = ['nude', 'naked', 'pussy'];

export const IMAGE_MODELS: PixioModel[] = [
  { label: 'FLUX Fast Schnell v2', type: 'inference.flux-fast.schnell.txt2img.v2', family: 'FLUX', medium: 'image', badge: 'Fast', desc: 'Fast preview model for high-volume iteration.' },
  { label: 'FLUX Fast Schnell v1', type: 'inference.flux-fast.schnell.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'Fast', desc: 'Earlier fast FLUX schnell endpoint.' },
  { label: 'FLUX Fast Dev', type: 'inference.flux-fast.dev.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'Fast', desc: 'Fast dev endpoint with strong prompt adherence.' },
  { label: 'FLUX Schnell v2', type: 'inference.flux.schnell.txt2img.v2', family: 'FLUX', medium: 'image', desc: 'Open FLUX schnell model for expressive generation.' },
  { label: 'FLUX Schnell v1', type: 'inference.flux.schnell.txt2img.v1', family: 'FLUX', medium: 'image', desc: 'Original FLUX schnell text-to-image endpoint.' },
  { label: 'FLUX Dev v2', type: 'inference.flux.dev.txt2img.v2', family: 'FLUX', medium: 'image', desc: 'High-quality FLUX dev endpoint.' },
  { label: 'FLUX Dev v1', type: 'inference.flux.dev.txt2img.v1', family: 'FLUX', medium: 'image', desc: 'Reliable FLUX dev baseline.' },
  { label: 'FLUX Pro 1.1', type: 'inference.flux.pro11.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'Pro', desc: 'Premium FLUX 1.1 quality.' },
  { label: 'FLUX Pro Ultra', type: 'inference.flux.pro11ultra.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'Ultra', desc: 'Highest-detail FLUX 1.1 Ultra endpoint.' },
  { label: 'FLUX 2 Klein 4B', type: 'inference.flux-2.klein.4b.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'New', desc: 'Compact FLUX 2 model for quick exploration.' },
  { label: 'FLUX 2 Klein 9B', type: 'inference.flux-2.klein.9b.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'New', desc: 'Larger FLUX 2 Klein variant.' },
  { label: 'FLUX 2 Klein', type: 'inference.flux-2.klein.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'New', desc: 'Balanced FLUX 2 Klein endpoint.' },
  { label: 'FLUX 2 Dev', type: 'inference.flux-2.dev.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'New', desc: 'Next-generation FLUX dev quality.' },
  { label: 'FLUX 2 Flex', type: 'inference.flux-2.flex.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'New', desc: 'Flexible FLUX 2 text-to-image endpoint.' },
  { label: 'FLUX 2 Pro', type: 'inference.flux-2.pro.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'Pro', desc: 'Professional FLUX 2 model.' },
  { label: 'FLUX 2 Max', type: 'inference.flux-2.max.txt2img.v1', family: 'FLUX', medium: 'image', badge: 'Max', desc: 'Maximum-quality FLUX 2 endpoint.' },
  { label: 'FLUX Kontext Pro v2', type: 'inference.flux-kontext.pro.txt2img.v2', family: 'FLUX', medium: 'image', badge: 'Pro', desc: 'Instruction-guided FLUX Kontext generation.' },
  { label: 'FLUX Kontext Pro v1', type: 'inference.flux-kontext.pro.txt2img.v1', family: 'FLUX', medium: 'image', desc: 'Earlier Kontext Pro endpoint.' },
  { label: 'FLUX Kontext Max v2', type: 'inference.flux-kontext.max.txt2img.v2', family: 'FLUX', medium: 'image', badge: 'Max', desc: 'Maximum-quality Kontext text-to-image.' },
  { label: 'FLUX Kontext Max v1', type: 'inference.flux-kontext.max.txt2img.v1', family: 'FLUX', medium: 'image', desc: 'Earlier Kontext Max endpoint.' },
  { label: 'Gemini 3 Pro', type: 'inference.gemini-3-pro.txt2img.v1', family: 'Google AI', medium: 'image', badge: '4K', desc: 'Google multimodal image generation.' },
  { label: 'Gemini 3.1 Flash', type: 'inference.gemini-3-1-flash.txt2img.v1', family: 'Google AI', medium: 'image', badge: 'Fast', desc: 'Fast Gemini image generation.' },
  { label: 'Nano Banana', type: 'inference.nano-banana.txt2img.v2', family: 'Google AI', medium: 'image', desc: 'Lightweight expressive Google image model.' },
  { label: 'SDXL', type: 'inference.sdxl.txt2img.v1', family: 'Stable Diffusion', medium: 'image', desc: 'Stable Diffusion XL with advanced controls.' },
  { label: 'SD 1.5', type: 'inference.sd15.txt2img.v1', family: 'Stable Diffusion', medium: 'image', desc: 'Classic community Stable Diffusion endpoint.' },
  { label: 'Seedream', type: 'inference.seedream.txt2img.v1', family: 'ByteDance', medium: 'image', desc: 'ByteDance Seedream baseline.' },
  { label: 'Seedream 4', type: 'inference.seedream-4.txt2img.v1', family: 'ByteDance', medium: 'image', desc: 'ByteDance Seedream 4 generation.' },
  { label: 'Seedream 4.5', type: 'inference.seedream-4-5.txt2img.v1', family: 'ByteDance', medium: 'image', desc: 'Photoreal ByteDance Seedream 4.5.' },
  { label: 'Seedream 5 Lite', type: 'inference.seedream-5-0.lite.txt2img.v1', family: 'ByteDance', medium: 'image', badge: 'New', desc: 'Latest lightweight Seedream endpoint.' },
  { label: 'Recraft', type: 'inference.recraft.txt2img.v1', family: 'Recraft', medium: 'image', desc: 'Clean graphic and illustration generation.' },
  { label: 'Recraft V4', type: 'inference.recraft.v4.txt2img.v1', family: 'Recraft', medium: 'image', desc: 'Recraft V4 creative generation.' },
  { label: 'Recraft V4 Pro', type: 'inference.recraft.v4.pro.txt2img.v1', family: 'Recraft', medium: 'image', badge: 'Pro', desc: 'Recraft V4 Pro with stronger design output.' },
];

export const VIDEO_MODELS: PixioModel[] = [
  { label: 'Veo Fast + Audio', type: 'inference.veo.fast.txt2vid.v2', family: 'Google Veo', medium: 'video', badge: 'Audio', desc: 'Fast Veo generation with optional generated audio.' },
  { label: 'Veo Fast', type: 'inference.veo.fast.txt2vid.v1', family: 'Google Veo', medium: 'video', badge: 'Fast', desc: 'Fast Veo text-to-video.' },
  { label: 'Veo v2', type: 'inference.veo.txt2vid.v2', family: 'Google Veo', medium: 'video', badge: '1080p', desc: 'Higher-quality Veo text-to-video endpoint.' },
  { label: 'Veo v1', type: 'inference.veo.txt2vid.v1', family: 'Google Veo', medium: 'video', desc: 'Original Veo text-to-video endpoint.' },
  { label: 'Wan 2.2 Lightning', type: 'inference.wan2-2.lightning.txt2vid.v0', family: 'Wan', medium: 'video', badge: 'Fast', desc: 'Fast Wan video generation.' },
  { label: 'Seedance Lite', type: 'inference.seedance.lite.txt2vid.v1', family: 'ByteDance', medium: 'video', desc: 'ByteDance lightweight video model.' },
  { label: 'Seedance Pro', type: 'inference.seedance.pro.txt2vid.v1', family: 'ByteDance', medium: 'video', badge: 'Pro', desc: 'High-quality ByteDance video generation.' },
  { label: 'Seedance Turbo', type: 'inference.seedance.proturbo.txt2vid.v1', family: 'ByteDance', medium: 'video', badge: 'Turbo', desc: 'Fast high-resolution Seedance endpoint.' },
  { label: 'Kling', type: 'inference.kling.txt2vid.v1', family: 'Kling', medium: 'video', desc: 'Motion-focused Kling video generation.' },
  { label: 'Sora 2', type: 'inference.sora-2.txt2vid.v1', family: 'Sora 2', medium: 'video', desc: 'Sora 2 text-to-video generation via Prodia.' },
  { label: 'Sora 2 Pro', type: 'inference.sora-2.pro.txt2vid.v1', family: 'Sora 2', medium: 'video', badge: 'Pro', desc: 'Premium Sora 2 Pro endpoint.' },
  { label: 'Pruna P-Video', type: 'inference.pruna.p-video.txt2vid.v1', family: 'Pruna', medium: 'video', desc: 'Pruna P-Video text-to-video endpoint.' },
];

export const ALL_MODELS = [...IMAGE_MODELS, ...VIDEO_MODELS];

export function createDefaultSettings(): GenerationSettings {
  return {
    prompt: 'A cinematic product photo of a translucent handheld AI canvas device on a glossy plum workbench, hot pink light seams, violet glass reflections, editorial luxury finish',
    negativePrompt: '',
    medium: 'image',
    selectedTypes: ['inference.flux-fast.schnell.txt2img.v2'],
    steps: 25,
    guidance: 8,
    seed: -1,
    width: 1024,
    height: 1024,
    style: '',
    resolution: '720p',
    aspectRatio: '16:9',
    duration: 4,
    generateAudio: false,
    outputFormat: 'jpeg',
    trackCost: true,
  };
}

export function getModelsForMedium(medium: MediaMode) {
  return medium === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
}

export function getModel(type: string) {
  return ALL_MODELS.find(model => model.type === type);
}

export function isPromptAllowed(prompt: string) {
  const value = prompt.toLowerCase();
  return !PROHIBITED_TERMS.some(term => value.includes(term));
}

export function buildProdiaConfig(model: PixioModel, settings: GenerationSettings, promptOverride?: string) {
  const prompt = (promptOverride ?? settings.prompt).trim();
  const config: Record<string, unknown> = { prompt };

  if (settings.negativePrompt.trim()) {
    config.negative_prompt = settings.negativePrompt.trim();
  }

  if (model.medium === 'image') {
    if (model.family === 'Stable Diffusion') {
      config.steps = settings.steps;
      config.guidance = settings.guidance;
      if (settings.seed !== -1) config.seed = settings.seed;
      if (model.type.includes('sdxl')) {
        config.width = settings.width;
        config.height = settings.height;
        if (settings.style) config.style_preset = settings.style;
      }
    } else if (model.type.includes('flux')) {
      if (settings.seed !== -1) config.seed = settings.seed;
    }
  }

  if (model.medium === 'video') {
    if (model.type.includes('veo')) {
      config.resolution = settings.resolution;
      config.aspect_ratio = settings.aspectRatio;
      config.duration_seconds = settings.duration;
      if (model.type.includes('v2')) config.generate_audio = settings.generateAudio;
    } else if (
      model.type.includes('seedance') ||
      model.type.includes('kling') ||
      model.type.includes('sora')
    ) {
      config.aspect_ratio = settings.aspectRatio;
    }
  }

  return config;
}

export function mediaMime(format: GenerationSettings['outputFormat'], medium: MediaMode) {
  if (medium === 'video') return 'video/mp4';
  if (format === 'png') return 'image/png';
  if (format === 'webp') return 'image/webp';
  return 'image/jpeg';
}
