import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/karaoke';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  thumbnailUrl: string;
  youtubeUrl: string;
}

const headers = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q')?.trim();

  if (!rawQuery) {
    return Response.json({ results: [] }, { headers });
  }

  // Check if query is directly a YouTube URL or Video ID
  const directId = extractYouTubeId(rawQuery);
  if (directId) {
    try {
      // Try to get oEmbed metadata for the direct video
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directId}&format=json`,
        { cache: 'no-store' }
      );
      if (oembedRes.ok) {
        const oembedData = (await oembedRes.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };
        const directResult: YouTubeSearchResult = {
          id: directId,
          title: oembedData.title || `Video ${directId}`,
          channel: oembedData.author_name || 'YouTube',
          thumbnailUrl: oembedData.thumbnail_url || getYouTubeThumbnail(directId),
          youtubeUrl: `https://www.youtube.com/watch?v=${directId}`,
        };
        return Response.json({ results: [directResult] }, { headers });
      }
    } catch {
      // Fallback to basic details if oEmbed fails
      const fallbackResult: YouTubeSearchResult = {
        id: directId,
        title: `Video ${directId}`,
        channel: 'YouTube',
        thumbnailUrl: getYouTubeThumbnail(directId),
        youtubeUrl: `https://www.youtube.com/watch?v=${directId}`,
      };
      return Response.json({ results: [fallbackResult] }, { headers });
    }
  }

  // Format search query: if user hasn't typed karaoke or beat, append "karaoke"
  const lower = rawQuery.toLowerCase();
  const searchQuery =
    lower.includes('karaoke') || lower.includes('beat') || lower.includes('instrumental')
      ? rawQuery
      : `${rawQuery} karaoke`;

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const ytRes = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (!ytRes.ok) {
      throw new Error(`YouTube responded with status ${ytRes.status}`);
    }

    const html = await ytRes.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);

    if (!match) {
      return Response.json({ results: [] }, { headers });
    }

    const data = JSON.parse(match[1]);
    const sections =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const results: YouTubeSearchResult[] = [];
    const seenIds = new Set<string>();

    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        if (!v || !v.videoId || seenIds.has(v.videoId)) continue;

        const videoId = v.videoId as string;
        seenIds.add(videoId);

        const title =
          v.title?.runs?.map((r: { text?: string }) => r.text || '').join('') ||
          v.title?.simpleText ||
          'Karaoke';

        const channel =
          v.ownerText?.runs?.map((r: { text?: string }) => r.text || '').join('') ||
          v.shortBylineText?.runs?.map((r: { text?: string }) => r.text || '').join('') ||
          'YouTube';

        const duration = v.lengthText?.simpleText;

        const thumbnails = v.thumbnail?.thumbnails;
        const thumbnailUrl =
          Array.isArray(thumbnails) && thumbnails.length > 0
            ? thumbnails[thumbnails.length - 1]?.url
            : getYouTubeThumbnail(videoId);

        results.push({
          id: videoId,
          title,
          channel,
          duration,
          thumbnailUrl,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        });

        if (results.length >= 12) break;
      }
      if (results.length >= 12) break;
    }

    return Response.json({ results }, { headers });
  } catch (error) {
    console.error('YouTube search error:', error);
    return Response.json(
      { error: 'search_failed', message: 'Không thể tìm kiếm YouTube lúc này. Vui lòng thử lại sau.' },
      { status: 500, headers }
    );
  }
}

