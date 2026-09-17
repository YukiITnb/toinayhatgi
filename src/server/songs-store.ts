import {
  BlobServiceClient,
  ContainerClient,
  RestError,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import '@/server/env';
import { DEFAULT_KARAOKE_SONGS, KaraokeSong } from '@/lib/karaoke';

const BLOB_NAME = 'karaoke-songs.json';
const CONTAINER_NAME = 'karaoke-data';
const MAX_RETRIES = 5;

let containerClient: ContainerClient | undefined;

function getContainerClient(): ContainerClient {
  if (containerClient) return containerClient;

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountName || !accountKey) {
    throw new Error(
      'AZURE_STORAGE_ACCOUNT_NAME/AZURE_STORAGE_ACCOUNT_KEY is not configured',
    );
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const serviceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
  containerClient = serviceClient.getContainerClient(CONTAINER_NAME);
  return containerClient;
}

async function streamToString(
  readable: NodeJS.ReadableStream,
): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

interface SongsSnapshot {
  songs: KaraokeSong[];
  // undefined means the blob does not exist yet.
  etag: string | undefined;
}

async function downloadSongs(client: ContainerClient): Promise<SongsSnapshot> {
  const blockBlobClient = client.getBlockBlobClient(BLOB_NAME);
  try {
    const downloadResponse = await blockBlobClient.download();
    const raw = downloadResponse.readableStreamBody
      ? await streamToString(downloadResponse.readableStreamBody)
      : '';
    const parsed = raw ? JSON.parse(raw) : null;
    const songs =
      Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : DEFAULT_KARAOKE_SONGS;
    return { songs, etag: downloadResponse.etag };
  } catch (error) {
    if (error instanceof RestError && error.statusCode === 404) {
      return { songs: DEFAULT_KARAOKE_SONGS, etag: undefined };
    }
    throw error;
  }
}

// Conditional upload: fails with 412 if the blob changed since `etag` was
// read (or was created since `etag` was undefined), so a concurrent writer
// can never be silently overwritten.
async function uploadSongs(
  client: ContainerClient,
  songs: KaraokeSong[],
  etag: string | undefined,
): Promise<void> {
  await client.createIfNotExists();
  const blockBlobClient = client.getBlockBlobClient(BLOB_NAME);
  const content = JSON.stringify(songs, null, 2);
  await blockBlobClient.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
    conditions: etag ? { ifMatch: etag } : { ifNoneMatch: '*' },
  });
}

function isConflict(error: unknown): boolean {
  return error instanceof RestError && error.statusCode === 412;
}

// Reads the current songs, applies `updater`, and writes the result back with
// an ETag-conditional upload. If another request wrote to the blob in the
// meantime the upload is rejected (412); on conflict we re-read the latest
// state and retry, so concurrent additions/removals merge instead of one
// silently clobbering the other.
async function updateSongs(
  updater: (songs: KaraokeSong[]) => KaraokeSong[],
): Promise<KaraokeSong[]> {
  const client = getContainerClient();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { songs, etag } = await downloadSongs(client);
    const updated = updater(songs);
    try {
      await uploadSongs(client, updated, etag);
      return updated;
    } catch (error) {
      if (isConflict(error) && attempt < MAX_RETRIES) continue;
      throw error;
    }
  }

  throw new Error(
    'Failed to update songs after repeated concurrent write conflicts',
  );
}

export async function readSongs(): Promise<KaraokeSong[]> {
  const client = getContainerClient();
  const { songs, etag } = await downloadSongs(client);
  if (etag === undefined) {
    // Blob doesn't exist yet: seed it. If another request seeds it first,
    // this conditional upload just loses the race, which is fine.
    try {
      await uploadSongs(client, DEFAULT_KARAOKE_SONGS, undefined);
    } catch (error) {
      if (!isConflict(error)) throw error;
    }
  }
  return songs;
}

export async function addOrUpdateSong(
  song: KaraokeSong,
): Promise<KaraokeSong[]> {
  return updateSongs((songs) => {
    const filtered = songs.filter(
      (s) => s.id !== song.id && s.youtubeId !== song.youtubeId,
    );
    return [song, ...filtered];
  });
}

export async function removeSong(id: string): Promise<KaraokeSong[]> {
  return updateSongs((songs) => songs.filter((s) => s.id !== id));
}

export async function resetSongs(): Promise<KaraokeSong[]> {
  return updateSongs(() => DEFAULT_KARAOKE_SONGS);
}

export async function replaceSongs(
  songs: KaraokeSong[],
): Promise<KaraokeSong[]> {
  return updateSongs(() => songs);
}
