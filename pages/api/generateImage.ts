import { NextApiRequest, NextApiResponse } from 'next';

const VIDEO_TYPES = ['txt2vid', 'img2vid', 'vid2vid', 'aud2vid'];
const isVideo = (type: string) => VIDEO_TYPES.some(k => type.includes(k));
const imageMime = (format?: string) => {
  if (format === 'png') return 'image/png';
  if (format === 'webp') return 'image/webp';
  return 'image/jpeg';
};

async function readMultipartResult(prodiaRes: Response, fallbackMime: string) {
  const form = await prodiaRes.formData();
  const jobPart = form.get('job');
  const outputPart = form.get('output');

  let job = null;
  if (typeof jobPart === 'string') {
    job = JSON.parse(jobPart);
  } else if (jobPart) {
    job = JSON.parse(await jobPart.text());
  }

  if (!outputPart || typeof outputPart === 'string') {
    return { job, url: null, mimeType: fallbackMime };
  }

  const mimeType = outputPart.type || fallbackMime;
  const buffer = Buffer.from(await outputPart.arrayBuffer());
  return {
    job,
    url: `data:${mimeType};base64,${buffer.toString('base64')}`,
    mimeType,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, config, apiKey: bodyKey, format, trackCost } = req.body;
  const apiKey = bodyKey || process.env.PRODIA_KEY;

  if (!apiKey) return res.status(401).json({ message: 'No Prodia API key. Enter yours in the app.' });
  if (!type || !config?.prompt) return res.status(400).json({ message: 'Missing type or prompt' });

  const video = isVideo(type);
  const acceptMime = video ? 'video/mp4' : imageMime(format);
  const url = `https://inference.prodia.com/v2/job${trackCost ? '?price=true' : ''}`;

  try {
    const prodiaRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: trackCost ? `multipart/form-data; ${acceptMime}` : acceptMime,
      },
      body: JSON.stringify({ type, config }),
    });

    if (!prodiaRes.ok) {
      const errText = await prodiaRes.text();
      return res.status(prodiaRes.status).json({ message: `Prodia error ${prodiaRes.status}`, error: errText });
    }

    if (trackCost) {
      const result = await readMultipartResult(prodiaRes, acceptMime);
      return res.status(200).json({
        url: result.url,
        video,
        mimeType: result.mimeType,
        job: result.job,
        price: result.job?.price ?? null,
      });
    }

    const buffer = Buffer.from(await prodiaRes.arrayBuffer());
    const dataUrl = `data:${acceptMime};base64,${buffer.toString('base64')}`;
    return res.status(200).json({ url: dataUrl, video, mimeType: acceptMime, job: null, price: null });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
}
