import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_KARAOKE_SONGS, KaraokeSong } from '@/lib/karaoke';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dataFilePath = path.join(process.cwd(), 'data', 'karaoke-songs.json');
const headers = { 'Cache-Control': 'no-store' };

async function readSongsFromFile(): Promise<KaraokeSong[]> {
  try {
    const raw = await fs.readFile(dataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // If reading fails or file does not exist, write default songs
    try {
      await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
      await fs.writeFile(dataFilePath, JSON.stringify(DEFAULT_KARAOKE_SONGS, null, 2), 'utf-8');
    } catch {}
  }
  return DEFAULT_KARAOKE_SONGS;
}

async function writeSongsToFile(songs: KaraokeSong[]): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(songs, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write songs to file:', error);
    return false;
  }
}

export async function GET() {
  const songs = await readSongsFromFile();
  return Response.json({ songs }, { headers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentSongs = await readSongsFromFile();

    if (body.song) {
      const newSong: KaraokeSong = body.song;
      // Prepend or replace if existing
      const filtered = currentSongs.filter(
        (s) => s.id !== newSong.id && s.youtubeId !== newSong.youtubeId
      );
      const updated = [newSong, ...filtered];
      await writeSongsToFile(updated);
      return Response.json({ success: true, songs: updated }, { headers });
    }

    if (Array.isArray(body.songs)) {
      await writeSongsToFile(body.songs);
      return Response.json({ success: true, songs: body.songs }, { headers });
    }

    return Response.json({ error: 'invalid_payload' }, { status: 400, headers });
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
      await writeSongsToFile(DEFAULT_KARAOKE_SONGS);
      return Response.json({ success: true, songs: DEFAULT_KARAOKE_SONGS }, { headers });
    }

    if (id) {
      const currentSongs = await readSongsFromFile();
      const updated = currentSongs.filter((s) => s.id !== id);
      await writeSongsToFile(updated);
      return Response.json({ success: true, songs: updated }, { headers });
    }

    return Response.json({ error: 'missing_id_or_reset' }, { status: 400, headers });
  } catch (error) {
    console.error('Error deleting song:', error);
    return Response.json({ error: 'server_error' }, { status: 500, headers });
  }
}

