'use client';

import React, { useState } from 'react';
import {
  Check,
  ExternalLink,
  Loader2,
  Music,
  Plus,
  Play,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  KaraokeSong,
  Tier,
  TIER_COLORS,
  TIER_DESCRIPTIONS,
  TIER_NAMES,
} from '@/lib/karaoke';

interface YouTubeResult {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  thumbnailUrl: string;
  youtubeUrl: string;
}

interface AddSongDialogProps {
  onSongAdded: (song: KaraokeSong) => void;
  existingSongIds: string[];
  buttonClassName?: string;
}

export function AddSongDialog({
  onSongAdded,
  existingSongIds,
  buttonClassName,
}: AddSongDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTier, setSelectedTier] = useState<Tier>(1);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [justAddedIds, setJustAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setErrorMsg('');
    setSearched(true);
    setPreviewVideoId(null);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(clean)}`);
      if (!res.ok) throw new Error('Không thể tìm kiếm bài hát lúc này');
      const data = await res.json();
      setResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        setErrorMsg('Không tìm thấy kết quả phù hợp trên YouTube. Hãy thử gõ tên bài hát khác!');
      }
    } catch {
      setErrorMsg('Đã xảy ra lỗi khi kết nối tới YouTube. Vui lòng thử lại!');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item: YouTubeResult) => {
    const newSong: KaraokeSong = {
      id: item.id,
      title: item.title,
      channel: item.channel,
      duration: item.duration,
      thumbnailUrl: item.thumbnailUrl,
      youtubeUrl: item.youtubeUrl,
      youtubeId: item.id,
      tier: selectedTier,
      addedAt: Date.now(),
    };

    onSongAdded(newSong);
    setJustAddedIds((prev) => new Set(prev).add(item.id));
  };

  return (
    <>
      <button
        type="button"
        className={buttonClassName || 'preferences-button'}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
        <span>Thêm bài hát</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="karaoke-dialog">
          <DialogTitle className="karaoke-dialog-title">
            <Music size={20} className="text-orange-400" />
            <span>Thêm bài hát Karaoke từ YouTube</span>
          </DialogTitle>
          <DialogDescription className="karaoke-dialog-desc">
            Nhập tên bài hát hoặc dán link YouTube. Hệ thống sẽ tìm kiếm beat/karaoke chuẩn để bạn chọn và thêm vào kho nhạc.
          </DialogDescription>

          <form onSubmit={handleSearch} className="karaoke-search-form">
            <div className="karaoke-search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Nhập tên bài hát (vd: Hoa Nở Không Màu, Cắt Đôi Nỗi Sầu)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="karaoke-search-input"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="clear-query-button"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="karaoke-search-submit"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>{loading ? 'Đang tìm…' : 'Tìm kiếm'}</span>
            </button>
          </form>

          {/* Tier selector for newly added songs */}
          <div className="karaoke-tier-selector">
            <span className="tier-selector-label">Phẩm chất khi mở hòm:</span>
            <div className="tier-pill-group">
              {TIER_NAMES.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedTier(idx as Tier)}
                  className={`tier-select-btn ${selectedTier === idx ? 'active' : ''}`}
                  style={{
                    borderColor: selectedTier === idx ? TIER_COLORS[idx] : undefined,
                    color: selectedTier === idx ? TIER_COLORS[idx] : undefined,
                  }}
                >
                  <span
                    className="tier-dot"
                    style={{ backgroundColor: TIER_COLORS[idx] }}
                  />
                  {name}
                </button>
              ))}
            </div>
            <span className="text-xs text-orange-300/90 italic pl-1">
              {TIER_NAMES[selectedTier]}: {TIER_DESCRIPTIONS[selectedTier]}
            </span>
          </div>

          {/* Preview player modal if previewing */}
          {previewVideoId && (
            <div className="karaoke-preview-box">
              <div className="preview-header">
                <span>Xem thử video Karaoke</span>
                <button
                  type="button"
                  onClick={() => setPreviewVideoId(null)}
                  className="subtle-button"
                >
                  Đóng
                </button>
              </div>
              <div className="video-responsive">
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Search results list */}
          <div className="karaoke-results-container">
            {loading && (
              <div className="karaoke-loading-state">
                <Loader2 size={28} className="animate-spin text-orange-400" />
                <p>Đang quét các bản Karaoke trên YouTube…</p>
              </div>
            )}

            {!loading && errorMsg && (
              <div className="karaoke-error-state">
                <p>{errorMsg}</p>
              </div>
            )}

            {!loading && searched && results.length > 0 && (
              <div className="karaoke-results-list">
                {results.map((item) => {
                  const isExisting = existingSongIds.includes(item.id);
                  const isJustAdded = justAddedIds.has(item.id);

                  return (
                    <div key={item.id} className="karaoke-result-item">
                      <div className="result-thumb-wrapper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="result-thumb"
                          loading="lazy"
                        />
                        {item.duration && (
                          <span className="result-duration">{item.duration}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewVideoId(item.id)}
                          className="preview-play-btn"
                          title="Xem thử video"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      </div>

                      <div className="result-info">
                        <h4 className="result-title" title={item.title}>
                          {item.title}
                        </h4>
                        <div className="result-channel-row">
                          <span className="result-channel">{item.channel}</span>
                          <a
                            href={item.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="result-yt-link"
                            title="Mở trên YouTube"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      <div className="result-actions">
                        <button
                          type="button"
                          disabled={isExisting || isJustAdded}
                          onClick={() => handleAdd(item)}
                          className={`add-to-pool-btn ${isJustAdded || isExisting ? 'added' : ''}`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check size={14} />
                              <span>Đã thêm!</span>
                            </>
                          ) : isExisting ? (
                            <>
                              <Check size={14} />
                              <span>Đã có</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              <span>Thêm bài</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !searched && (
              <div className="karaoke-empty-hint">
                <Sparkles size={28} className="hint-icon" />
                <p>Gợi ý: Hãy nhập bài hát bạn yêu thích, ví dụ: <em>Hoa Nở Không Màu, Cắt Đôi Nỗi Sầu, Bến Sông Chờ…</em></p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

