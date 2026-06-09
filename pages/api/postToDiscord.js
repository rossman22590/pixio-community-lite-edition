import { AttachmentBuilder, Client, GatewayIntentBits } from 'discord.js';

export default async function handler(req, res) {
  const { message, imageUrl } = req.body;

  console.log('Received image url:', imageUrl);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  try {
    await client.login(process.env.BOT_TOKEN);

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel?.isTextBased()) {
      throw new Error('Channel must be a text-based channel');
    }

    const attachment = new AttachmentBuilder(imageUrl, { name: 'image.png' });
    await channel.send({ content: message, files: [attachment] });

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', error: err.message });
  } finally {
    client.destroy();
  }
}
