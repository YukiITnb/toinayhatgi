'use client';

import React, { useMemo, useState } from 'react';
import {
  Music,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  KaraokeSong,
  TIER_COLORS,
  TIER_DESCRIPTIONS,
  TIER_NAMES,
} from '@/lib/karaoke';

interface SongManagerDialogProps {
  songs: KaraokeSong[];
  enabledTiers: boolean[];
  disabledSongIds: string[];
  onToggleSong: (id: string) => void;
  onToggleTier: (tierIndex: number) => void;
  onRemoveSong: (id: string) => void;
  onEnableAll: () => void;
  onResetToDefault: () => void;
  variant?: 'header' | 'inventory';
  disabled?: boolean;
}

export function SongManagerDialog({
  songs,
  enabledTiers,
  disabledSongIds,
  onToggleSong,
  onToggleTier,
  onRemoveSong,
  onEnableAll,
  onResetToDefault,
  variant = 'header',
  disabled = false,
}: SongManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.channel.toLowerCase().includes(q)
    );
  }, [songs, search]);

  const eligibleCount = songs.filter(
    (s) => enabledTiers[s.tier] && !disabledSongIds.includes(s.id)
  ).length;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className={variant === 'inventory' ? 'customize-food-button' : 'preferences-button'}
        onClick={() => {
          setSearch('');
          setConfirmReset(false);
          setOpen(true);
        }}
        title="Quản lý kho nhạc & bộ lọc"
      >
        <Music size={variant === 'inventory' ? 16 : 17} />
        <span>Kho nhạc ({songs.length})</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="karaoke-dialog">
          <DialogTitle className="karaoke-dialog-title">
            <SlidersHorizontal size={20} className="text-orange-400" />
            <span>Kho nhạc & Bộ lọc quay</span>
          </DialogTitle>
          <DialogDescription className="karaoke-dialog-desc">
            Bật/tắt các phẩm chất hoặc từng bài hát để tùy chỉnh danh sách có thể trúng khi mở hòm. Danh sách lưu tự động trên trình duyệt này.
          </DialogDescription>

          {/* Tier filters */}
          <div className="tier-filter-list" aria-label="Lọc theo phẩm chất">
            {TIER_NAMES.map((name, index) => {
              const countInTier = songs.filter((s) => s.tier === index).length;
              return (
                <label key={name} className="pool-row">
                  <input
                    type="checkbox"
                    checked={enabledTiers[index]}
                    onChange={() => onToggleTier(index)}
                  />
                  <span style={{ color: TIER_COLORS[index], fontWeight: 600 }}>
                    {name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    · {TIER_DESCRIPTIONS[index]}
                  </span>
                  <small>({countInTier} bài)</small>
                </label>
              );
            })}
          </div>

          {/* Search in library */}
          <div className="pool-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="pool-search"
              placeholder="Tìm bài trong kho…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="clear-query-button"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Songs list */}
          <div className="pool-list">
            {filteredSongs.length === 0 ? (
              <div className="pool-empty">Không tìm thấy bài hát nào trong kho.</div>
            ) : (
              filteredSongs.map((song) => {
                const isEnabled = !disabledSongIds.includes(song.id);
                return (
                  <div className="pool-song-item" key={song.id}>
                    <label className="pool-song-toggle">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => onToggleSong(song.id)}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={song.thumbnailUrl}
                        alt={song.title}
                        className="pool-song-thumb"
                      />
                      <div className="pool-song-meta">
                        <span className="pool-song-title">{song.title}</span>
                        <span className="pool-song-channel">
                          {song.channel} {song.duration ? `· ${song.duration}` : ''}
                        </span>
                      </div>
                    </label>
                    <div className="pool-song-right">
                      <span
                        className="pool-tier-tag"
                        style={{
                          backgroundColor: `${TIER_COLORS[song.tier]}20`,
                          borderColor: TIER_COLORS[song.tier],
                          color: TIER_COLORS[song.tier],
                        }}
                      >
                        {TIER_NAMES[song.tier]}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveSong(song.id)}
                        className="pool-delete-btn"
                        title="Xóa khỏi kho"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom stats and controls */}
          <div className="pool-save">
            <small>
              <strong>{eligibleCount}</strong> / {songs.length} bài hát sẵn sàng quay
            </small>
            <button
              type="button"
              className="subtle-button"
              onClick={onEnableAll}
            >
              Bật lại tất cả
            </button>
          </div>

          <div className="preferences-bottom">
            <button
              type="button"
              onClick={() => setConfirmReset(!confirmReset)}
              className="reset-btn"
            >
              <RotateCcw size={14} />
              <span>Khôi phục mặc định</span>
            </button>
          </div>

          {confirmReset && (
            <div className="delete-confirm">
              <p>Khôi phục kho nhạc về danh sách bài hát karaoke mặc định?</p>
              <button
                type="button"
                onClick={() => {
                  onResetToDefault();
                  setConfirmReset(false);
                }}
              >
                Xác nhận khôi phục
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
