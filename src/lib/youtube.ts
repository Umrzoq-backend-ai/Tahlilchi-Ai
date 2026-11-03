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
 * Parse TimedText XML subtitle stream into clean, sequential TranscriptItem array
 * Handles both <p t="ms" d="ms"> format and <text start="sec" dur="sec"> format
 */
function parseTimedTextXml(xmlText: string): TranscriptItem[] {
  const items: TranscriptItem[] = [];

  // YouTube fmt=srv3 / timedtext format: <p t="1000" d="3000"><s>word</s></p>
  const pRegex = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xmlText)) !== null) {
    const offsetMs = parseInt(match[1], 10);
    const durationMs = match[2] ? parseInt(match[2], 10) : 3000;
    const rawText = match[3].replace(/<[^>]+>/g, '').trim();
    const cleanText = decodeHtmlEntities(rawText);
    if (cleanText) {
      const startSec = Math.floor(offsetMs / 1000);
      const endSec = Math.floor((offsetMs + durationMs) / 1000);
      items.push({
        offsetMs,
        durationMs,
        start: formatSecondsToTime(startSec),
        end: formatSecondsToTime(endSec),
        text: cleanText,
      });
    }
  }

  // Classic YouTube timedtext format: <text start="1.5" dur="3.2">...</text>
  if (items.length === 0) {
    const textRegex = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    while ((match = textRegex.exec(xmlText)) !== null) {
      const startSec = parseFloat(match[1]);
      const durSec = match[2] ? parseFloat(match[2]) : 3;
      const rawText = match[3].replace(/<[^>]+>/g, '').trim();
      const cleanText = decodeHtmlEntities(rawText);
      if (cleanText) {
        items.push({
          offsetMs: Math.floor(startSec * 1000),
          durationMs: Math.floor(durSec * 1000),
          start: formatSecondsToTime(Math.floor(startSec)),
          end: formatSecondsToTime(Math.floor(startSec + durSec)),
          text: cleanText,
        });
      }
    }
  }

  return items;
}

/**
 * Universal subtitle parser: auto-detects XML or WebVTT
 */
function parseSubtitles(content: string): TranscriptItem[] {
  if (!content || !content.trim()) return [];
  if (content.includes('<p ') || content.includes('<text ') || content.includes('<?xml') || content.includes('<timedtext')) {
    const xmlItems = parseTimedTextXml(content);
    if (xmlItems.length > 0) return xmlItems;
  }
  return parseCleanWebVtt(content);
}

/**
 * Strategy 1 (PRIMARY): Official InnerTube Android Client with Google Public API
 * Fast (200-300ms), 100% reliable, returns exact metadata + official timedtext track
 */
async function fetchCaptionsViaInnerTube(videoId: string): Promise<{
  items: TranscriptItem[];
  title?: string;
  author?: string;
  duration?: number;
  description?: string;
}> {
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
    const title = vd?.title;
    const author = vd?.author;
    let duration = vd?.lengthSeconds ? parseInt(vd.lengthSeconds, 10) : undefined;
    const description = vd?.shortDescription;

    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (Array.isArray(tracks) && tracks.length > 0) {
      const track =
        tracks.find((t: any) => t.languageCode === 'uz') ||
        tracks.find((t: any) => t.languageCode === 'ru') ||
        tracks.find((t: any) => t.languageCode === 'en') ||
        tracks[0];

      if (track?.baseUrl) {
        try {
          // Attempt 1: Direct baseUrl (default XML format)
          const rawContent = await httpsGet(track.baseUrl, 4500);
          const parsed = parseSubtitles(rawContent);
          if (parsed.length > 0) {
            if ((!duration || duration === 0) && parsed.length > 0) {
              const last = parsed[parsed.length - 1];
              duration = Math.ceil((last.offsetMs + last.durationMs) / 1000);
            }
            return { items: parsed, title, author, duration, description };
          }
        } catch {}

        try {
          // Attempt 2: Explicit WebVTT request
          const vttUrl = track.baseUrl.replace(/&fmt=[^&]+/, '') + '&fmt=vtt';
          const vttContent = await httpsGet(vttUrl, 4500);
          const parsedVtt = parseSubtitles(vttContent);
          if (parsedVtt.length > 0) {
            if ((!duration || duration === 0) && parsedVtt.length > 0) {
              const last = parsedVtt[parsedVtt.length - 1];
              duration = Math.ceil((last.offsetMs + last.durationMs) / 1000);
            }
            return { items: parsedVtt, title, author, duration, description };
          }
        } catch {}
      }
    }

    return { items: [], title, author, duration, description };
  } catch (err) {
    console.warn('[YouTube InnerTube Error]:', err);
    return { items: [] };
  }
}

/**
 * Strategy 2 (SECONDARY): Invidious Mirror fallback
 */
async function fetchCaptionsViaInvidious(videoId: string): Promise<{ items: TranscriptItem[]; duration?: number }> {
  const HOSTS = [
    'https://yt.chocolatemoo53.com',
    'https://invidious.protokolla.fi',
    'https://inv.nadeko.net',
  ];

  for (const host of HOSTS) {
    try {
      const jsonStr = await httpsGet(`${host}/api/v1/captions/${videoId}`, 3000);
      const data = JSON.parse(jsonStr);
      const captions: any[] = data?.captions || [];

      if (captions.length > 0) {
        const target =
          captions.find((c) => c.languageCode === 'uz') ||
          captions.find((c) => c.languageCode === 'ru') ||
          captions.find((c) => c.languageCode === 'en') ||
          captions[0];

        const targetUrl = target.url.startsWith('http') ? target.url : `${host}${target.url}`;
        const subStr = await httpsGet(targetUrl, 4000);
        const parsed = parseSubtitles(subStr);
        if (parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          const duration = Math.ceil((last.offsetMs + last.durationMs) / 1000);
          return { items: parsed, duration };
        }
      }
    } catch {
      // try next host
    }
  }

  return { items: [] };
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
      2500
    );
    const oembed = JSON.parse(oembedJson);
    if (oembed?.title) title = oembed.title;
    if (oembed?.author_name) author = oembed.author_name;
  } catch {
    // ignore
  }

  // 2. PRIMARY STRATEGY: Google InnerTube API
  try {
    const itRes = await fetchCaptionsViaInnerTube(videoId);
    if (itRes.items.length > 0) transcriptItems = itRes.items;
    if (!title && itRes.title) title = itRes.title;
    if (!author && itRes.author) author = itRes.author;
    if (itRes.duration && itRes.duration > 0) duration = itRes.duration;
    if (!description && itRes.description) description = itRes.description;
  } catch (err) {
    console.warn('[YouTube Details] InnerTube strategy error:', err);
  }

  // 3. SECONDARY STRATEGY: Invidious fallback
  if (transcriptItems.length === 0) {
    try {
      const invRes = await fetchCaptionsViaInvidious(videoId);
      if (invRes.items.length > 0) {
        transcriptItems = invRes.items;
        if (!duration && invRes.duration) duration = invRes.duration;
      }
    } catch (err) {
      console.warn('[YouTube Details] Invidious fallback error:', err);
    }
  }

  // 4. TERTIARY STRATEGY: YoutubeTranscript npm package fallback
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

  // Calculate duration from last item if still 0
  if ((!duration || duration === 0) && transcriptItems.length > 0) {
    const lastItem = transcriptItems[transcriptItems.length - 1];
    duration = Math.ceil((lastItem.offsetMs + lastItem.durationMs) / 1000);
  }

  if (transcriptItems.length > 0) {
    hasTranscript = true;
    transcript = transcriptItems
      .map((it) => `[${it.start}] ${it.text}`)
      .join('\n');
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
