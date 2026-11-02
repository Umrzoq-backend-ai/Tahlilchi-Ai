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
 * Parse YouTube TimedText XML format (supporting srv3 format <p t="...">, word-based <w t="...">, and classic <text start="...">)
 */
function parseXmlTranscript(xml: string): TranscriptItem[] {
  const items: TranscriptItem[] = [];

  // Format 1: word-based <w t="ms" d="ms">word</w> format inside <p> or standalone
  const wRegex = /<w\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/w>/g;
  let wMatch;
  const wordTokens: { offsetMs: number; durationMs: number; text: string }[] = [];
  while ((wMatch = wRegex.exec(xml)) !== null) {
    const startMs = parseInt(wMatch[1], 10);
    const durMs = parseInt(wMatch[2], 10);
    const text = decodeHtmlEntities(wMatch[3].replace(/<[^>]+>/g, ''));
    if (text) {
      wordTokens.push({ offsetMs: startMs, durationMs: durMs, text });
    }
  }

  if (wordTokens.length > 0) {
    // Group individual words into coherent spoken sentences (~6-10 words or 4-8 seconds)
    let curWords: string[] = [];
    let curStartMs = wordTokens[0].offsetMs;
    let curLastMs = curStartMs;

    for (let i = 0; i < wordTokens.length; i++) {
      const token = wordTokens[i];
      curWords.push(token.text);
      curLastMs = token.offsetMs + token.durationMs;

      const endsWithTerminal = /[.!?]$/.test(token.text);
      const isLongEnough = curWords.length >= 7 || (curLastMs - curStartMs) >= 5000;
      const isNextFar = i + 1 < wordTokens.length && (wordTokens[i + 1].offsetMs - curLastMs) > 1500;

      if (endsWithTerminal || isLongEnough || isNextFar || i === wordTokens.length - 1) {
        const sentenceText = curWords.join(' ').trim();
        if (sentenceText) {
          const startSec = Math.floor(curStartMs / 1000);
          const endSec = Math.floor(curLastMs / 1000);
          items.push({
            offsetMs: curStartMs,
            durationMs: curLastMs - curStartMs,
            start: formatSecondsToTime(startSec),
            end: formatSecondsToTime(endSec),
            text: sentenceText,
          });
        }
        curWords = [];
        if (i + 1 < wordTokens.length) {
          curStartMs = wordTokens[i + 1].offsetMs;
        }
      }
    }
    if (items.length > 0) return items;
  }

  // Format 2: srv3 format (<p t="startMs" d="durationMs">...)
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

  if (items.length > 0) return groupIntoNaturalSentences(items);

  // Format 3: classic format (<text start="seconds" dur="seconds">...)
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

  return groupIntoNaturalSentences(items);
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
 * Fetch YouTube video details and captions using the official YouTube Player InnerTube API
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

  // Official Innertube API Endpoint with Google's public client key
  const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  const INNERTUBE_URL = `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`;

  // 1. Primary Strategy: Authenticated InnerTube Android Client with retry
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(INNERTUBE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 11)',
        },
        body: JSON.stringify({
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
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }

      const data = await res.json();
      const vd = data?.videoDetails;

      if (vd) {
        if (!title && vd.title) title = vd.title;
        if (!author && vd.author) author = vd.author;
        if (!duration && vd.lengthSeconds) duration = parseInt(vd.lengthSeconds, 10);
        if (!description && vd.shortDescription) description = vd.shortDescription;
      }

      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        const track =
          tracks.find((t: any) => t.languageCode === 'uz') ||
          tracks.find((t: any) => t.languageCode === 'ru') ||
          tracks.find((t: any) => t.languageCode === 'en') ||
          tracks[0];

        const timedTextUrl = track.baseUrl;
        if (timedTextUrl) {
          const xmlController = new AbortController();
          const xmlTimer = setTimeout(() => xmlController.abort(), 6500);
          const xmlRes = await fetch(timedTextUrl, { signal: xmlController.signal });
          clearTimeout(xmlTimer);

          if (xmlRes.ok) {
            const xml = await xmlRes.text();
            const parsed = parseXmlTranscript(xml);
            if (parsed.length > 0) {
              transcriptItems = parsed;
              hasTranscript = true;
              transcript = transcriptItems
                .map((it) => `[${it.start}] ${it.text}`)
                .join('\n');
              break;
            }
          }
        }
      }

      if (data?.playabilityStatus?.status === 'OK') {
        break;
      }

      await new Promise((r) => setTimeout(r, 200 * attempt));
    } catch {
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }

  // 2. Secondary Fallback: oEmbed for metadata if title is still empty
  if (!title) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { next: { revalidate: 3600 } }
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        title = data.title || '';
        author = data.author_name || '';
      }
    } catch {
      // ignore
    }
  }

  // 3. Third Fallback: YoutubeTranscript library for captions
  if (transcriptItems.length === 0) {
    try {
      const fallbackItems = await YoutubeTranscript.fetchTranscript(videoId);
      if (fallbackItems && fallbackItems.length > 0) {
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
        hasTranscript = transcriptItems.length > 0;
        transcript = transcriptItems
          .map((it) => `[${it.start}] ${it.text}`)
          .join('\n');
      }
    } catch {
      // ignore
    }
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
