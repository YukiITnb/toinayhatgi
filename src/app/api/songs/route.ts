import {
  addOrUpdateSong,
  readSongs,
  removeSong,
  replaceSongs,
  resetSongs,
} from '@/server/songs-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  const songs = await readSongs();
  return Response.json({ songs }, { headers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.song) {
      const songs = await addOrUpdateSong(body.song);
      return Response.json({ success: true, songs }, { headers });
    }

    if (Array.isArray(body.songs)) {
      const songs = await replaceSongs(body.songs);
      return Response.json({ success: true, songs }, { headers });
    }

    return Response.json(
      { error: 'invalid_payload' },
      { status: 400, headers },
    );
  } catch (error) {
    console.error('Error saving song:', error);
    return Response.json({ error: 'server_error' }, { status: 500, headers });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset');
    const id = searchParams.get('id');

    if (reset === 'true') {
      const songs = await resetSongs();
      return Response.json({ success: true, songs }, { headers });
    }

    if (id) {
      const songs = await removeSong(id);
      return Response.json({ success: true, songs }, { headers });
    }

    return Response.json(
      { error: 'missing_id_or_reset' },
      { status: 400, headers },
    );
  } catch (error) {
    console.error('Error deleting song:', error);
    return Response.json({ error: 'server_error' }, { status: 500, headers });
  }
}
