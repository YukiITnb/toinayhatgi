'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_KARAOKE_SONGS,
  KaraokeSong,
  loadStoredSongs,
  saveStoredSongs,
} from '@/lib/karaoke';

export function useKaraoke() {
  const [songs, setSongs] = useState<KaraokeSong[]>(DEFAULT_KARAOKE_SONGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [enabledTiers, setEnabledTiers] = useState<boolean[]>([true, true, true, true, true]);
  const [disabledSongIds, setDisabledSongIds] = useState<string[]>([]);

  // 1. Load initial cache from localStorage for instant render
  // 2. Fetch latest persistent songs from server /api/songs
  useEffect(() => {
    const local = loadStoredSongs();
    setSongs(local);
    setIsLoaded(true);

    // Fetch from server API to ensure cross-browser/cross-device consistency
    fetch('/api/songs', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.songs) && data.songs.length > 0) {
          setSongs(data.songs);
          saveStoredSongs(data.songs);
        }
      })
      .catch(() => {
        // Offline or serverless fallback: keep localStorage data
      });
  }, []);

  const addSong = useCallback(
    (newSong: Omit<KaraokeSong, 'addedAt'> & { addedAt?: number }) => {
      const fullSong: KaraokeSong = {
        ...newSong,
        addedAt: newSong.addedAt ?? Date.now(),
      };
      setSongs((prev) => {
        const filtered = prev.filter((s) => s.id !== fullSong.id && s.youtubeId !== fullSong.youtubeId);
        const next = [fullSong, ...filtered];
        saveStoredSongs(next);
        return next;
      });
      setDisabledSongIds((prev) => prev.filter((id) => id !== fullSong.id));

      // Persist to server disk in background
      fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song: fullSong }),
      }).catch((err) => console.error('Failed to sync song to server:', err));

      return fullSong;
    },
    []
  );

  const removeSong = useCallback((id: string) => {
    setSongs((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveStoredSongs(next);
      return next;
    });
    setDisabledSongIds((prev) => prev.filter((disabledId) => disabledId !== id));

    // Delete from server disk in background
    fetch(`/api/songs?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to sync delete to server:', err));
  }, []);

  const toggleSongDisabled = useCallback((id: string) => {
    setDisabledSongIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleTier = useCallback((tierIndex: number) => {
    setEnabledTiers((prev) => {
      const next = [...prev];
      next[tierIndex] = !next[tierIndex];
      return next;
    });
  }, []);

  const enableAllSongs = useCallback(() => {
    setDisabledSongIds([]);
    setEnabledTiers([true, true, true, true, true]);
  }, []);

  const resetToDefault = useCallback(() => {
    setSongs(DEFAULT_KARAOKE_SONGS);
    saveStoredSongs(DEFAULT_KARAOKE_SONGS);
    setDisabledSongIds([]);
    setEnabledTiers([true, true, true, true, true]);

    // Reset on server disk
    fetch('/api/songs?reset=true', {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to sync reset to server:', err));
  }, []);

  const eligibleSongs = useMemo(() => {
    return songs.filter(
      (song) => enabledTiers[song.tier] && !disabledSongIds.includes(song.id)
    );
  }, [songs, enabledTiers, disabledSongIds]);

  return {
    songs,
    eligibleSongs,
    isLoaded,
    enabledTiers,
    disabledSongIds,
    addSong,
    removeSong,
    toggleSongDisabled,
    toggleTier,
    enableAllSongs,
    resetToDefault,
  };
}
