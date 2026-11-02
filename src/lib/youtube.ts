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
  debug?: any;
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
 * Parse YouTube TimedText XML format (both srv3 <p t="..."> and classic <text start="...">)
 */
function parseXmlTranscript(xml: string): TranscriptItem[] {
  const items: TranscriptItem[] = [];

  // Format 1: srv3 format (<p t="startMs" d="durationMs">...)
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const startMs = parseInt(match[1], 10);
    const durMs = parseInt(match[2], 10);
    const inner = match[3];
    let text = '';
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(inner)) !== null) {
      text += sMatch[1];
    }
    if (!text) {
      text = inner.replace(/<[^>]+>/g, '');
    }
    const cleanText = decodeHtmlEntities(text);
    if (cleanText) {
      const startSec = Math.floor(startMs / 1000);
      const endSec = Math.floor((startMs + durMs) / 1000);
      items.push({
        offsetMs: startMs,
        durationMs: durMs,
        start: formatSecondsToTime(startSec),
        end: formatSecondsToTime(endSec),
        text: cleanText,
      });
    }
  }

  if (items.length > 0) return items;

  // Format 2: classic format (<text start="seconds" dur="seconds">...)
  const textRegex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = textRegex.exec(xml)) !== null) {
    const startSecFloat = parseFloat(match[1]);
    const durSecFloat = parseFloat(match[2]);
    const startMs = Math.round(startSecFloat * 1000);
    const durMs = Math.round(durSecFloat * 1000);
    const text = decodeHtmlEntities(match[3]);
    if (text) {
      const startSec = Math.floor(startMs / 1000);
      const endSec = Math.floor((startMs + durMs) / 1000);
      items.push({
        offsetMs: startMs,
        durationMs: durMs,
        start: formatSecondsToTime(startSec),
        end: formatSecondsToTime(endSec),
        text,
      });
    }
  }

  return items;
}

/**
 * Group short, fragmented caption snippets into readable, natural sentences (~5-10s)
 */
function groupIntoNaturalSentences(rawItems: TranscriptItem[]): TranscriptItem[] {
  if (rawItems.length <= 1) return rawItems;

  const grouped: TranscriptItem[] = [];
  let currentGroup: TranscriptItem | null = null;

  for (const item of rawItems) {
    if (!currentGroup) {
      currentGroup = { ...item };
      continue;
    }

    const timeDiffMs = item.offsetMs - (currentGroup.offsetMs + currentGroup.durationMs);
    const combinedLength = currentGroup.text.length + item.text.length;
    const endsWithTerminal = /[.!?]$/.test(currentGroup.text.trim());

    // Merge if short, within 3 seconds gap, and under 180 chars unless terminal punctuation
    if (!endsWithTerminal && timeDiffMs < 3500 && combinedLength < 180) {
      currentGroup.text = `${currentGroup.text} ${item.text}`.trim();
      currentGroup.durationMs = item.offsetMs + item.durationMs - currentGroup.offsetMs;
      const endSec = Math.floor((currentGroup.offsetMs + currentGroup.durationMs) / 1000);
      currentGroup.end = formatSecondsToTime(endSec);
    } else {
      grouped.push(currentGroup);
      currentGroup = { ...item };
    }
  }

  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

/**
 * Fetch YouTube captions using Android InnerTube API with retries
 */
async function fetchCaptionsViaInnerTube(videoId: string, debugLogs: string[] = []): Promise<TranscriptItem[]> {
  const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(INNERTUBE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '20.10.38',
              androidSdkVersion: 34,
              hl: 'uz',
              gl: 'UZ',
            },
          },
          videoId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        debugLogs.push(`Attempt ${attempt}: HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }

      const data = await res.json();
      const playability = data?.playabilityStatus?.status;
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      debugLogs.push(`Attempt ${attempt}: playability=${playability}, tracks=${tracks?.length || 0}`);

      if (Array.isArray(tracks) && tracks.length > 0) {
        // Prefer Uzbek, then Russian, then English, else first track
        const track =
          tracks.find((t: any) => t.languageCode === 'uz') ||
          tracks.find((t: any) => t.languageCode === 'ru') ||
          tracks.find((t: any) => t.languageCode === 'en') ||
          tracks[0];

        const timedTextUrl = track.baseUrl;
        if (timedTextUrl) {
          const xmlController = new AbortController();
          const xmlTimer = setTimeout(() => xmlController.abort(), 6000);
          const xmlRes = await fetch(timedTextUrl, { signal: xmlController.signal });
          clearTimeout(xmlTimer);

          if (xmlRes.ok) {
            const xml = await xmlRes.text();
            debugLogs.push(`Attempt ${attempt}: XML length=${xml.length}`);
            const rawItems = parseXmlTranscript(xml);
            if (rawItems.length > 0) {
              return groupIntoNaturalSentences(rawItems);
            }
          } else {
            debugLogs.push(`Attempt ${attempt}: XML fetch failed ${xmlRes.status}`);
          }
        }
      }

      await new Promise((r) => setTimeout(r, 250 * attempt));
    } catch (e: any) {
      debugLogs.push(`Attempt ${attempt}: Error: ${e?.message}`);
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }

  return [];
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

  const safeFetch = async (url: string, init?: RequestInit, ms = 4000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // 1. Fetch official YouTube oEmbed API for verified title & author
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await safeFetch(oembedUrl, { next: { revalidate: 3600 } }, 3500);
    if (res && res.ok) {
      const data = await res.json();
      title = data.title || '';
      author = data.author_name || '';
    }
  } catch (err) {
    console.warn('oEmbed fetch error:', err);
  }

  // 2. Fetch YouTube watch page HTML to extract full description, length, and keywords
  try {
    const pageRes = await safeFetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,uz;q=0.8',
      },
    }, 4000);

    if (pageRes && pageRes.ok) {
      const html = await pageRes.text();

      if (!title) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        if (titleMatch) title = titleMatch[1].replace(' - YouTube', '').trim();
      }

      // Extract detailed description
      const descMatch = html.match(/"shortDescription":"(.*?)"/);
      if (descMatch) {
        try {
          description = JSON.parse(`"${descMatch[1]}"`);
        } catch {
          description = descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }

      // Extract length in seconds
      const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
      if (lenMatch) {
        duration = parseInt(lenMatch[1], 10);
      }

      // Extract video keywords
      const kwMatch = html.match(/"keywords":(\[.*?\])/);
      if (kwMatch) {
        try {
          keywords = JSON.parse(kwMatch[1]);
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('YouTube page scrape error:', err);
  }

  // 3. Resilient transcript extraction
  const debugLogs: string[] = [];
  try {
    // Strategy A: Bulletproof InnerTube with retry
    transcriptItems = await fetchCaptionsViaInnerTube(videoId, debugLogs);

    // Strategy B: Fallback to YoutubeTranscript library
    if (transcriptItems.length === 0) {
      try {
        const fallbackItems = await YoutubeTranscript.fetchTranscript(videoId);
        if (fallbackItems && fallbackItems.length > 0) {
          debugLogs.push(`Strategy B success: ${fallbackItems.length} items`);
          const rawItems: TranscriptItem[] = fallbackItems.map((it) => {
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
          transcriptItems = groupIntoNaturalSentences(rawItems);
        } else {
          debugLogs.push('Strategy B: 0 fallback items');
        }
      } catch (fbErr: any) {
        debugLogs.push(`Strategy B error: ${fbErr?.message}`);
      }
    }

    if (transcriptItems.length > 0) {
      hasTranscript = true;
      transcript = transcriptItems
        .map((it) => `[${it.start}] ${it.text}`)
        .join('\n');
    }
  } catch (err: any) {
    debugLogs.push(`Outer transcript error: ${err?.message}`);
    console.warn('Transcript extraction failed:', err);
    hasTranscript = false;
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
    debug: debugLogs,
  };
}
