export type Tier = 0 | 1 | 2 | 3 | 4;

export const TIER_NAMES = [
  'Indie',
  'Hoài niệm',
  'Top Trending',
  'Bài tủ cá nhân',
  '★ QUỐC DÂN',
] as const;

export const TIER_DESCRIPTIONS = [
  'Dễ hát, ai cũng thuộc lời',
  'Bài hot trend giới trẻ',
  'Cần giọng hát & cảm xúc',
  'Nốt cao, thử thách giọng hát',
  'Tuyệt phẩm bất hủ, quẩy tung nóc',
] as const;

export const TIER_COLORS = [
  '#4b69ff', // Blue (Indie - Dễ hát)
  '#8847ff', // Purple (Hoài niệm - Nhạc trẻ)
  '#d32ce6', // Pink (Top Trending - Cần giọng)
  '#eb4b4b', // Red (Bài tủ cá nhân - Nốt cao)
  '#e4ae39', // Gold (★ QUỐC DÂN - Bất hủ)
];

export interface KaraokeSong {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  duration?: string;
  youtubeUrl: string;
  youtubeId: string;
  tier: Tier;
  addedAt: number;
}

export const DEFAULT_KARAOKE_SONGS: KaraokeSong[] = [
  {
    id: 'QD80ebxomss',
    title: 'Hoa Nở Không Màu - Hoài Lâm (Tone Nam)',
    channel: 'Nguyễn Minh Cường',
    thumbnailUrl: 'https://i.ytimg.com/vi/QD80ebxomss/hqdefault.jpg',
    duration: '5:23',
    youtubeUrl: 'https://www.youtube.com/watch?v=QD80ebxomss',
    youtubeId: 'QD80ebxomss',
    tier: 0,
    addedAt: 1710000000000,
  },
  {
    id: 'f9K7Yq_bI6Y',
    title: 'Ai Chung Tình Được Mãi - Đinh Tùng Huy (Tone Nam Chuẩn)',
    channel: 'ACV Music',
    thumbnailUrl: 'https://i.ytimg.com/vi/f9K7Yq_bI6Y/hqdefault.jpg',
    duration: '4:15',
    youtubeUrl: 'https://www.youtube.com/watch?v=f9K7Yq_bI6Y',
    youtubeId: 'f9K7Yq_bI6Y',
    tier: 0,
    addedAt: 1710000001000,
  },
  {
    id: '22zM-xY9mTY',
    title: 'Cắt Đôi Nỗi Sầu - Tăng Duy Tân (Beat Chuẩn)',
    channel: 'Big Arts Entertainment',
    thumbnailUrl: 'https://i.ytimg.com/vi/22zM-xY9mTY/hqdefault.jpg',
    duration: '3:05',
    youtubeUrl: 'https://www.youtube.com/watch?v=22zM-xY9mTY',
    youtubeId: '22zM-xY9mTY',
    tier: 1,
    addedAt: 1710000002000,
  },
  {
    id: '05B9vQ3Gz7I',
    title: 'Ngày Mai Người Ta Lấy Chồng - Thành Đạt (Tone Nam)',
    channel: 'Đông Thiên Đức Official',
    thumbnailUrl: 'https://i.ytimg.com/vi/05B9vQ3Gz7I/hqdefault.jpg',
    duration: '5:12',
    youtubeUrl: 'https://www.youtube.com/watch?v=05B9vQ3Gz7I',
    youtubeId: '05B9vQ3Gz7I',
    tier: 1,
    addedAt: 1710000003000,
  },
  {
    id: 'Zzn9-ATB9a8',
    title: 'Nàng Thơ - Hoàng Dũng (Karaoke Beat Acoustic)',
    channel: 'Hoàng Dũng',
    thumbnailUrl: 'https://i.ytimg.com/vi/Zzn9-ATB9a8/hqdefault.jpg',
    duration: '4:18',
    youtubeUrl: 'https://www.youtube.com/watch?v=Zzn9-ATB9a8',
    youtubeId: 'Zzn9-ATB9a8',
    tier: 1,
    addedAt: 1710000004000,
  },
  {
    id: 'E98E_P5p3J0',
    title: 'Sầu Tím Thiệp Hồng - Song Ca (Tone Nam Nữ Chuẩn)',
    channel: 'Karaoke Bolero',
    thumbnailUrl: 'https://i.ytimg.com/vi/E98E_P5p3J0/hqdefault.jpg',
    duration: '4:45',
    youtubeUrl: 'https://www.youtube.com/watch?v=E98E_P5p3J0',
    youtubeId: 'E98E_P5p3J0',
    tier: 2,
    addedAt: 1710000005000,
  },
  {
    id: 'h5Xf28n7ZqI',
    title: 'Duyên Phận - Tone Nữ Bolero Trữ Tình',
    channel: 'Thúy Nga Beat',
    thumbnailUrl: 'https://i.ytimg.com/vi/h5Xf28n7ZqI/hqdefault.jpg',
    duration: '5:40',
    youtubeUrl: 'https://www.youtube.com/watch?v=h5Xf28n7ZqI',
    youtubeId: 'h5Xf28n7ZqI',
    tier: 2,
    addedAt: 1710000006000,
  },
  {
    id: 'pG-o3P95y-Y',
    title: 'Bước Qua Đời Nhau - Lê Bảo Bình (Tone Nam Chuẩn)',
    channel: 'Lê Bảo Bình',
    thumbnailUrl: 'https://i.ytimg.com/vi/pG-o3P95y-Y/hqdefault.jpg',
    duration: '4:52',
    youtubeUrl: 'https://www.youtube.com/watch?v=pG-o3P95y-Y',
    youtubeId: 'pG-o3P95y-Y',
    tier: 2,
    addedAt: 1710000007000,
  },
  {
    id: 'aYmH4l0G444',
    title: 'Gặp Nhưng Không Ở Lại - Hiền Hồ (Tone Nữ)',
    channel: 'Hiền Hồ Official',
    thumbnailUrl: 'https://i.ytimg.com/vi/aYmH4l0G444/hqdefault.jpg',
    duration: '5:35',
    youtubeUrl: 'https://www.youtube.com/watch?v=aYmH4l0G444',
    youtubeId: 'aYmH4l0G444',
    tier: 3,
    addedAt: 1710000008000,
  },
  {
    id: 'O9h7k0Rz_8I',
    title: 'Đắp Mộ Cuộc Tình - Đan Nguyên (Beat Bolero Chuẩn)',
    channel: 'Trung Tâm Asia',
    thumbnailUrl: 'https://i.ytimg.com/vi/O9h7k0Rz_8I/hqdefault.jpg',
    duration: '5:20',
    youtubeUrl: 'https://www.youtube.com/watch?v=O9h7k0Rz_8I',
    youtubeId: 'O9h7k0Rz_8I',
    tier: 3,
    addedAt: 1710000009000,
  },
  {
    id: '31YpZ5Fp_rI',
    title: 'Anh Ơi Ở Lại - Chi Pu (Beat Chuẩn)',
    channel: 'Chi Pu Official',
    thumbnailUrl: 'https://i.ytimg.com/vi/31YpZ5Fp_rI/hqdefault.jpg',
    duration: '4:48',
    youtubeUrl: 'https://www.youtube.com/watch?v=31YpZ5Fp_rI',
    youtubeId: '31YpZ5Fp_rI',
    tier: 3,
    addedAt: 1710000010000,
  },
  {
    id: 'R2hM2sW_pI0',
    title: 'Từng Yêu - Phan Duy Anh (Beat Ballad Chuẩn)',
    channel: 'ACV Music',
    thumbnailUrl: 'https://i.ytimg.com/vi/R2hM2sW_pI0/hqdefault.jpg',
    duration: '5:02',
    youtubeUrl: 'https://www.youtube.com/watch?v=R2hM2sW_pI0',
    youtubeId: 'R2hM2sW_pI0',
    tier: 4,
    addedAt: 1710000011000,
  },
  {
    id: '8x1vH2B-4nE',
    title: 'Bông Điên Điển - Phi Nhung (Dân Ca Miền Tây)',
    channel: 'Dân Ca Quê Hương',
    thumbnailUrl: 'https://i.ytimg.com/vi/8x1vH2B-4nE/hqdefault.jpg',
    duration: '5:15',
    youtubeUrl: 'https://www.youtube.com/watch?v=8x1vH2B-4nE',
    youtubeId: '8x1vH2B-4nE',
    tier: 4,
    addedAt: 1710000012000,
  },
];

export const KARAOKE_STORAGE_KEY = 'toinayhatgi_karaoke_songs_v1';

export function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed' || pathParts[0] === 'v' || pathParts[0] === 'shorts') {
        if (pathParts[1] && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[1])) return pathParts[1];
      }
    } else if (parsed.hostname === 'youtu.be') {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[0])) return pathParts[0];
    }
  } catch {
    return null;
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function loadStoredSongs(): KaraokeSong[] {
  if (typeof window === 'undefined') return DEFAULT_KARAOKE_SONGS;
  try {
    const raw = localStorage.getItem(KARAOKE_STORAGE_KEY);
    if (!raw) return DEFAULT_KARAOKE_SONGS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_KARAOKE_SONGS;
    const validSongs: KaraokeSong[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.youtubeId === 'string'
      ) {
        validSongs.push({
          id: item.id,
          title: item.title,
          channel: typeof item.channel === 'string' ? item.channel : 'YouTube',
          thumbnailUrl:
            typeof item.thumbnailUrl === 'string' && item.thumbnailUrl
              ? item.thumbnailUrl
              : getYouTubeThumbnail(item.youtubeId),
          duration: typeof item.duration === 'string' ? item.duration : undefined,
          youtubeUrl:
            typeof item.youtubeUrl === 'string' && item.youtubeUrl
              ? item.youtubeUrl
              : `https://www.youtube.com/watch?v=${item.youtubeId}`,
          youtubeId: item.youtubeId,
          tier: (Number.isInteger(item.tier) && item.tier >= 0 && item.tier <= 4 ? item.tier : 0) as Tier,
          addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
        });
      }
    }
    return validSongs.length > 0 ? validSongs : DEFAULT_KARAOKE_SONGS;
  } catch {
    return DEFAULT_KARAOKE_SONGS;
  }
}

export function saveStoredSongs(songs: KaraokeSong[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KARAOKE_STORAGE_KEY, JSON.stringify(songs));
  } catch {}
}

