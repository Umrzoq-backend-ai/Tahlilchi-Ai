import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeVideoDetails, extractYouTubeId } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') || searchParams.get('videoId') || '';

    if (!url.trim()) {
      return NextResponse.json({ error: 'YouTube video URL or ID is required' }, { status: 400 });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Yaroqli YouTube havolasi topilmadi" }, { status: 400 });
    }

    const details = await fetchYouTubeVideoDetails(videoId);
    return NextResponse.json(details, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[YouTube Details API] Error:', err);
    return NextResponse.json(
      { error: 'YouTube ma\'lumotlarini yuklashda xatolik yuz berdi', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url || body?.videoId || '';

    if (!url.trim()) {
      return NextResponse.json({ error: 'YouTube video URL or ID is required' }, { status: 400 });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Yaroqli YouTube havolasi topilmadi" }, { status: 400 });
    }

    const details = await fetchYouTubeVideoDetails(videoId);
    return NextResponse.json(details, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[YouTube Details API POST] Error:', err);
    return NextResponse.json(
      { error: 'YouTube ma\'lumotlarini yuklashda xatolik yuz berdi', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
