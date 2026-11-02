import https from 'https';
import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
  offsetMs: number;
  durationMs: number;
  start: string;
  end?: string;
  text: string;
}

export interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  durationFormatted: string;
  description: string;
  keywords: string[];
  transcript: string;
  transcriptItems: TranscriptItem[];
  hasTranscript: boolean;
  thumbnailUrl: string;
}

export function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const clean = urlOrId.trim();
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(clean)) return clean;
  return null;
}

export function formatSecondsToTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust IPv4 https get helper to prevent Node 22 IPv6 connect timeouts on cloud environments
 */
function httpsGet(urlStr: string, timeoutMs = 4500): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const req = https.get(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          family: 4,
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Parse WebVTT subtitle stream into clean, deduplicated TranscriptItem array
 */
function parseCleanWebVtt(vttText: string): TranscriptItem[] {
  const raw: { start: string; end: string; text: string }[] = [];
  const lines = vttText.split(/\r?\n/);
  let curStart = '';
  let curEnd = '';
  let curText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts = line.split('-->').map((p) => p.trim());
      curStart = parts[0].split('.')[0];
      if (curStart.startsWith('00:')) curStart = curStart.slice(3);
      curEnd = parts[1].split('.')[0];
      if (curEnd.startsWith('00:')) curEnd = curEnd.slice(3);
      curText = [];
    } else if (line === '' || line === 'WEBVTT' || line.startsWith('Kind:') || line.startsWith('Language:')) {
      if (curText.length > 0 && curStart) {
        const clean = curText
          .join(' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (clean) raw.push({ start: curStart, end: curEnd, text: decodeHtmlEntities(clean) });
        curText = [];
      }
    } else {
      curText.push(line);
    }
  }

  // Deduplicate rolling caption window lines
  const cleanItems: TranscriptItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const cur = raw[i];
    const next = raw[i + 1];

    if (next && (next.text.includes(cur.text) || next.text.startsWith(cur.text))) {
      continue;
    }
    if (cleanItems.length > 0 && cleanItems[cleanItems.length - 1].text === cur.text) {
      continue;
    }

    const startParts = cur.start.split(':').map((p) => parseInt(p, 10));
    const startSec = startParts.length === 3 ? startParts[0] * 3600 + startParts[1] * 60 + startParts[2] : startParts[0] * 60 + startParts[1];

    cleanItems.push({
      offsetMs: startSec * 1000,
      durationMs: 3000,
      start: cur.start,
      end: cur.end,
      text: cur.text,
    });
  }

  return cleanItems;
}

/**
 * Strategy 1: Fetch captions via reliable Invidious mirror with IPv4
 */
async function fetchCaptionsViaInvidious(videoId: string): Promise<TranscriptItem[]> {
  const HOSTS = [
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
  ];

  for (const host of HOSTS) {
    try {
      const jsonStr = await httpsGet(`${host}/api/v1/captions/${videoId}`, 3500);
      const data = JSON.parse(jsonStr);
      const captions: any[] = data?.captions || [];

      if (captions.length > 0) {
        const target =
          captions.find((c) => c.languageCode === 'uz') ||
          captions.find((c) => c.languageCode === 'ru') ||
          captions.find((c) => c.languageCode === 'en') ||
          captions[0];

        const targetUrl = target.url.startsWith('http') ? target.url : `${host}${target.url}`;
        const vttStr = await httpsGet(targetUrl, 4000);
        const parsed = parseCleanWebVtt(vttStr);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // try next host
    }
  }

  return [];
}

/**
 * Strategy 2: Official InnerTube Android Client with Google's public key
 */
async function fetchCaptionsViaInnerTube(videoId: string): Promise<{ items: TranscriptItem[]; title?: string; author?: string; duration?: number; description?: string }> {
  const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  const url = `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}&prettyPrint=false`;

  try {
    const postData = JSON.stringify({
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '20.10.38',
          androidSdkVersion: 30,
          osName: 'Android',
          osVersion: '11',
          hl: 'uz',
          gl: 'UZ',
        },
      },
      videoId,
    });

    const body = await new Promise<string>((resolve, reject) => {
      const u = new URL(url);
      const req = https.request(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          method: 'POST',
          family: 4,
          timeout: 4500,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 11)',
          },
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(data));
        }
      );
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('InnerTube timeout'));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    const data = JSON.parse(body);
    const vd = data?.videoDetails;
    let title = vd?.title;
    let author = vd?.author;
    let duration = vd?.lengthSeconds ? parseInt(vd.lengthSeconds, 10) : undefined;
    let description = vd?.shortDescription;

    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (Array.isArray(tracks) && tracks.length > 0) {
      const track =
        tracks.find((t: any) => t.languageCode === 'uz') ||
        tracks.find((t: any) => t.languageCode === 'ru') ||
        tracks.find((t: any) => t.languageCode === 'en') ||
        tracks[0];

      if (track?.baseUrl) {
        const vttOrXml = await httpsGet(track.baseUrl, 4000);
        const parsed = parseCleanWebVtt(vttOrXml);
        if (parsed.length > 0) {
          return { items: parsed, title, author, duration, description };
        }
      }
    }

    return { items: [], title, author, duration, description };
  } catch {
    return { items: [] };
  }
}

/**
 * Fetch complete YouTube video details, including verbatim transcript and metadata.
 */
export async function fetchYouTubeVideoDetails(urlOrId: string): Promise<YouTubeVideoDetails> {
  const videoId = extractYouTubeId(urlOrId) || urlOrId;
  let title = '';
  let author = '';
  let description = '';
  let duration = 0;
  let keywords: string[] = [];
  let transcript = '';
  let transcriptItems: TranscriptItem[] = [];
  let hasTranscript = false;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // 1. Fetch official YouTube oEmbed API for verified title & author
  try {
    const oembedJson = await httpsGet(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      3000
    );
    const oembed = JSON.parse(oembedJson);
    if (oembed?.title) title = oembed.title;
    if (oembed?.author_name) author = oembed.author_name;
  } catch {
    // ignore
  }

  // 2. Multi-strategy caption and details fetch
  try {
    // Strategy A: Invidious IPv4 mirror
    transcriptItems = await fetchCaptionsViaInvidious(videoId);

    // Strategy B: InnerTube Android Client with IPv4
    if (transcriptItems.length === 0) {
      const itRes = await fetchCaptionsViaInnerTube(videoId);
      if (itRes.items.length > 0) transcriptItems = itRes.items;
      if (!title && itRes.title) title = itRes.title;
      if (!author && itRes.author) author = itRes.author;
      if (!duration && itRes.duration) duration = itRes.duration;
      if (!description && itRes.description) description = itRes.description;
    }

    // Strategy C: YoutubeTranscript npm package fallback
    if (transcriptItems.length === 0) {
      try {
        const ytItems = await YoutubeTranscript.fetchTranscript(videoId);
        if (ytItems && ytItems.length > 0) {
          transcriptItems = ytItems.map((it) => {
            const startSec = Math.floor(it.offset / 1000);
            const durSec = Math.floor((it.duration || 3000) / 1000);
            return {
              offsetMs: it.offset,
              durationMs: it.duration || 3000,
              start: formatSecondsToTime(startSec),
              end: formatSecondsToTime(startSec + durSec),
              text: decodeHtmlEntities(it.text),
            };
          });
        }
      } catch {
        // ignore
      }
    }

    if (transcriptItems.length > 0) {
      hasTranscript = true;
      transcript = transcriptItems
        .map((it) => `[${it.start}] ${it.text}`)
        .join('\n');
    }
  } catch (err) {
    console.warn('[YouTube Details] Error fetching captions:', err);
  }

  return {
    videoId,
    title: title || `YouTube Video (${videoId})`,
    author: author || 'YouTube Creator',
    duration,
    durationFormatted: formatSecondsToTime(duration),
    description,
    keywords,
    transcript,
    transcriptItems,
    hasTranscript,
    thumbnailUrl,
  };
}
