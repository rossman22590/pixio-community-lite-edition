// ──────────────────────────────────────────────────────────────────────────
// Pixio · Prodia config builder
// Projects the user's GenerationParams onto the exact config object each
// model/operation expects. Unknown fields are simply omitted.
// ──────────────────────────────────────────────────────────────────────────

import type { GenerationParams, JobConfig, ProdiaModel } from './types';

const has = (s: string) => (needle: string) => s.includes(needle);

/**
 * Build the `config` payload for a Prodia job.
 * @param model   the target model
 * @param params  current generation params
 * @param promptOverride  optional prompt (e.g. an inline edit instruction)
 */
export function buildConfig(
  model: ProdiaModel,
  params: GenerationParams,
  promptOverride?: string,
): JobConfig {
  const t = has(model.type);
  const prompt = (promptOverride ?? params.prompt).trim();
  const config: JobConfig = {};

  // removebg/upscale jobs do not take a prompt at all.
  const promptless = model.operation === 'removebg' || model.operation === 'upscale';
  if (!promptless && prompt) config.prompt = prompt;

  const neg = params.negativePrompt.trim();
  if (neg && !promptless) config.negative_prompt = neg;

  const seed = () => {
    if (params.seed !== -1) config.seed = params.seed;
  };

  switch (model.operation) {
    case 'txt2img': {
      if (model.family === 'Stable Diffusion') {
        config.steps = params.steps;
        config.guidance = params.guidance;
        seed();
        if (t('sdxl')) {
          config.width = params.width;
          config.height = params.height;
          if (params.style) config.style_preset = params.style;
        }
      } else if (t('flux') || t('kontext')) {
        seed();
      } else {
        seed();
      }
      break;
    }

    case 'edit': {
      // Instruction-edit models (Kontext / Qwen / Seedream).
      seed();
      if (t('kontext')) {
        config.prompt_upsampling = params.promptUpsampling;
        config.safety_tolerance = params.safetyTolerance;
        if (params.aspectRatio) config.aspect_ratio = params.aspectRatio;
      }
      break;
    }

    case 'img2img': {
      if (model.family === 'Stable Diffusion') {
        config.steps = params.steps;
        config.guidance = params.guidance;
        config.strength = params.strength;
        seed();
      } else if (t('flux')) {
        if (params.style) config.style_preset = params.style;
        seed();
      } else {
        seed();
      }
      break;
    }

    case 'inpaint': {
      config.steps = params.steps;
      config.guidance = params.guidance;
      seed();
      break;
    }

    case 'upscale': {
      // HYPIR upscale: prompt-optional restoration; pass an optional guide prompt
      // only if the user explicitly wrote one.
      if (prompt) config.prompt = prompt;
      break;
    }

    case 'removebg': {
      // No config needed beyond the input image.
      break;
    }

    case 'txt2vid':
    case 'img2vid': {
      if (t('veo')) {
        config.resolution = params.resolution;
        config.aspect_ratio = params.aspectRatio;
        config.duration_seconds = params.duration;
        if (t('v2')) config.generate_audio = params.generateAudio;
      } else if (t('seedance') || t('kling') || t('sora')) {
        config.aspect_ratio = params.aspectRatio;
      }
      break;
    }
  }

  return config;
}

/** MIME type for an output, given a desired format + medium. */
export function outputMime(format: GenerationParams['outputFormat'], medium: 'image' | 'video') {
  if (medium === 'video') return 'video/mp4';
  if (format === 'png') return 'image/png';
  if (format === 'webp') return 'image/webp';
  return 'image/jpeg';
}
