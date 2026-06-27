import { NextApiRequest, NextApiResponse } from 'next';

type PromptVariant = {
  title: string;
  prompt: string;
  rationale: string;
};

const fallbackVariants = (prompt: string, medium: string): PromptVariant[] => {
  const base = prompt.trim() || 'A striking open source AI creation studio interface';
  const motion = medium === 'video'
    ? 'smooth camera drift, coherent motion, clean cuts, natural temporal consistency'
    : 'precise composition, sharp detail, balanced lighting, editorial finish';

  return [
    {
      title: 'Cinematic',
      prompt: `${base}, cinematic framing, tactile materials, ${motion}, high contrast but natural color`,
      rationale: 'Adds lens, lighting, and finish cues without changing the idea.',
    },
    {
      title: 'Product-grade',
      prompt: `${base}, designed for a production campaign, clean background geometry, premium surfaces, readable focal point, ${motion}`,
      rationale: 'Makes the output more usable for launch images and demos.',
    },
    {
      title: 'Experimental',
      prompt: `${base}, speculative studio artifact, unusual but functional design language, mint highlights, coral signal marks, ${motion}`,
      rationale: 'Pushes a more distinct visual identity while staying controllable.',
    },
  ];
};

const promptSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['variants'],
  properties: {
    variants: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'prompt', 'rationale'],
        properties: {
          title: { type: 'string' },
          prompt: { type: 'string' },
          rationale: { type: 'string' },
        },
      },
    },
  },
};

function outputText(data: any) {
  if (typeof data.output_text === 'string') return data.output_text;
  const chunks = data.output
    ?.flatMap((item: any) => item.content ?? [])
    ?.map((part: any) => part.text)
    ?.filter(Boolean);
  return chunks?.join('\n') ?? '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt = '', medium = 'image', surface = 'regular' } = req.body ?? {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes('openai api')) {
    return res.status(200).json({ source: 'local', variants: fallbackVariants(prompt, medium) });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.5',
        input: [
          {
            role: 'system',
            content:
              'You rewrite generative media prompts for an open source Prodia studio. Return exactly three variants. Keep the original intent, add concrete visual direction, and avoid unsafe sexual content.',
          },
          {
            role: 'user',
            content: JSON.stringify({ prompt, medium, surface }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'pixio_prompt_variants',
            strict: true,
            schema: promptSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      return res.status(200).json({
        source: 'local',
        warning: await response.text(),
        variants: fallbackVariants(prompt, medium),
      });
    }

    const data = await response.json();
    const parsed = JSON.parse(outputText(data));
    return res.status(200).json({ source: 'openai', variants: parsed.variants });
  } catch (error: any) {
    return res.status(200).json({
      source: 'local',
      warning: error.message,
      variants: fallbackVariants(prompt, medium),
    });
  }
}
