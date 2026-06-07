import { NextApiRequest, NextApiResponse } from 'next';

const VIDEO_TYPES = ['txt2vid', 'img2vid', 'vid2vid', 'aud2vid'];
const isVideo = (type: string) => VIDEO_TYPES.some(k => type.includes(k));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, config, apiKey: bodyKey } = req.body;
  const apiKey = bodyKey || process.env.PRODIA_KEY;

  if (!apiKey) return res.status(401).json({ message: 'No Prodia API key. Enter yours in the app.' });
  if (!type || !config?.prompt) return res.status(400).json({ message: 'Missing type or prompt' });

  const video = isVideo(type);
  const acceptMime = video ? 'video/mp4' : 'image/jpeg';

  try {
    const prodiaRes = await fetch('https://inference.prodia.com/v2/job', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: acceptMime,
      },
      body: JSON.stringify({ type, config }),
    });

    if (!prodiaRes.ok) {
      const errText = await prodiaRes.text();
      return res.status(prodiaRes.status).json({ message: `Prodia error ${prodiaRes.status}`, error: errText });
    }

    const buffer = Buffer.from(await prodiaRes.arrayBuffer());
    const dataUrl = `data:${acceptMime};base64,${buffer.toString('base64')}`;
    return res.status(200).json({ url: dataUrl, video });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
}
