import { YoutubeTranscript } from 'youtube-transcript';

export interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  durationFormatted: string;
  description: string;
  keywords: string[];
  transcript: string;
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

export async function fetchYouTubeVideoDetails(urlOrId: string): Promise<YouTubeVideoDetails> {
  const videoId = extractYouTubeId(urlOrId) || urlOrId;
  let title = '';
  let author = '';
  let description = '';
  let duration = 0;
  let keywords: string[] = [];
  let transcript = '';
  let hasTranscript = false;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // 1. Fetch official YouTube oEmbed API for verified title & author
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      title = data.title || '';
      author = data.author_name || '';
    }
  } catch (err) {
    console.warn('oEmbed fetch error:', err);
  }

  // 2. Fetch YouTube watch page HTML to extract full description, length, and keywords
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (pageRes.ok) {
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

  // 3. Attempt to fetch spoken transcript / captions
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (items && items.length > 0) {
      hasTranscript = true;
      transcript = items
        .map((it) => {
          const totalSec = Math.floor(it.offset / 1000);
          const timeStr = formatSecondsToTime(totalSec);
          return `[${timeStr}] ${it.text}`;
        })
        .join('\n');
    }
  } catch (err) {
    // Transcripts might be disabled for music or render showcase videos
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
    hasTranscript,
    thumbnailUrl,
  };
}
