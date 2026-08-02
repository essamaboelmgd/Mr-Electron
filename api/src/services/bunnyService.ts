import crypto from 'crypto';

const bunnyApiBase = 'https://video.bunnycdn.com';
const bunnyTusEndpoint = 'https://video.bunnycdn.com/tusupload';

const requiredConfig = () => {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_KEY;
  if (!libraryId || !apiKey || !tokenKey) {
    throw new Error('Bunny Stream is not configured. Set BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY and BUNNY_STREAM_TOKEN_KEY.');
  }
  return { libraryId, apiKey, tokenKey };
};

const streamHost = () => (process.env.BUNNY_STREAM_PLAYER_HOST || 'iframe.mediadelivery.net').replace(/^https?:\/\//, '').replace(/\/$/, '');

export interface BunnyUploadSession {
  videoId: string;
  libraryId: string;
  endpoint: string;
  signature: string;
  expiresAt: number;
  embedUrl: string;
}

export const createBunnyUploadSession = async (title: string): Promise<BunnyUploadSession> => {
  const { libraryId, apiKey } = requiredConfig();
  const response = await fetch(`${bunnyApiBase}/library/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: title.trim() })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Bunny video creation failed (${response.status}): ${message}`);
  }

  const video = await response.json() as { guid?: string };
  if (!video.guid) throw new Error('Bunny did not return a video id.');

  const expiresAt = Math.floor(Date.now() / 1000) + Number(process.env.BUNNY_UPLOAD_EXPIRY_SECONDS || 86400);
  const signature = crypto.createHash('sha256')
    .update(`${libraryId}${apiKey}${expiresAt}${video.guid}`)
    .digest('hex');

  return {
    videoId: video.guid,
    libraryId,
    endpoint: bunnyTusEndpoint,
    signature,
    expiresAt,
    embedUrl: `https://${streamHost()}/embed/${libraryId}/${video.guid}`
  };
};

export const createBunnyEmbedUrl = (videoId: string, lifetimeSeconds = 900): string => {
  const { libraryId, tokenKey } = requiredConfig();
  const expiresAt = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  const token = crypto.createHash('sha256')
    .update(`${tokenKey}${videoId}${expiresAt}`)
    .digest('hex');
  const query = new URLSearchParams({ token, expires: String(expiresAt) });
  return `https://${streamHost()}/embed/${libraryId}/${encodeURIComponent(videoId)}?${query.toString()}`;
};

export const isBunnyConfigured = () => Boolean(
  process.env.BUNNY_STREAM_LIBRARY_ID
  && process.env.BUNNY_STREAM_API_KEY
  && process.env.BUNNY_STREAM_TOKEN_KEY
);
