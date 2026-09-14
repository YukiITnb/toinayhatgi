'use client';

import Link from 'next/link';
import { flushSync } from 'react-dom';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Box,
  ExternalLink,
  Mic,
  Music,
  Play,
  RotateCw,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { readCookie, writeCookie } from '@/lib/cookies';
import {
  chooseTiered,
  createSpinProfile,
  spinProgress,
  stopFraction,
} from '@/lib/case-mechanics';
import {
  KaraokeSong,
  TIER_COLORS,
  TIER_NAMES,
} from '@/lib/karaoke';
import { copy, type Language } from '@/lib/i18n';
import { useKaraoke } from '@/hooks/use-karaoke';
import { useLocalSpinCount } from '@/hooks/use-local-spin-count';
import { useServerSpinCount } from '@/hooks/use-server-spin-count';
import { AddSongDialog } from '@/components/add-song-dialog';
import { SongManagerDialog } from '@/components/song-manager-dialog';
import { CaseAudio } from '@/lib/case-audio';

const colors = TIER_COLORS;
const reelStep = 254;
const reelInitialOffset = -400;

const KaraokeCard = memo(function KaraokeCard({
  song,
  language,
  small = false,
  slot,
  onRemove,
  onPlay,
}: {
  song: KaraokeSong;
  language: Language;
  small?: boolean;
  slot?: number;
  onRemove?: (id: string) => void;
  onPlay?: (song: KaraokeSong) => void;
}) {
  return (
    <div
      className={`song-card ${small ? 'small' : ''}`}
      data-slot-id={slot}
      style={
        {
          '--rarity': colors[song.tier],
          ...(slot === undefined
            ? {}
            : { position: 'absolute', left: slot * reelStep }),
        } as React.CSSProperties
      }
    >
      <span className="tier">{copy[language].tiers[song.tier]}</span>
      <div className="card-thumb-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="song-image" src={song.thumbnailUrl} alt={song.title} />
        {song.duration && <span className="card-duration-badge">{song.duration}</span>}
        {small && onPlay && (
          <button
            type="button"
            className="card-quick-play"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(song);
            }}
            title="Nghe thử bài này"
          >
            <Play size={14} fill="currentColor" />
          </button>
        )}
      </div>
      <div className="card-copy">
        <strong title={song.title}>{song.title}</strong>
        <span className="card-subtext" title={song.channel}>
          {song.channel}
        </span>
      </div>
      {small && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(song.id);
          }}
          className="inventory-delete-btn"
          title="Xóa khỏi kho"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
});

export default function Home() {
  const {
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
  } = useKaraoke();

  const { count: localSpins, recordSpin } = useLocalSpinCount();
  const {
    count: serverSpins,
    status: serverSpinStatus,
    increment: recordServerSpin,
  } = useServerSpinCount();

  const [language, setLanguage] = useState<Language>('vi');
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<KaraokeSong | null>(null);
  const [lastChoice, setLastChoice] = useState<KaraokeSong | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reel, setReel] = useState<{ song: KaraokeSong; id: number }[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);

  const busy = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(-400);
  const frame = useRef(0);
  const audio = useRef<CaseAudio | null>(null);
  const t = copy[language];

  useEffect(() => {
    const saved = readCookie<Language>('language');
    const next = saved === 'en' ? 'en' : 'vi';
    setLanguage(next);
    document.documentElement.lang = next;
  }, []);

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    document.documentElement.lang = next;
    try {
      writeCookie('language', next);
    } catch {}
  };

  useEffect(() => {
    document.title =
      language === 'vi'
        ? 'Tối Nay Hát Gì? - Random Karaoke CS:GO'
        : 'Tonight Karaoke - Case Opening Roulette';
  }, [language]);

  useEffect(() => {
    const engine = new CaseAudio();
    audio.current = engine;
    engine.preload();
    const handleVisibility = () => {
      if (document.hidden) engine.pause();
      else engine.recover();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      engine.dispose();
      audio.current = null;
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const eligible = eligibleSongs;

  // Setup initial reel
  useEffect(() => {
    if (!eligible.length) {
      setReel([]);
      setVisibleStart(0);
      position.current = reelInitialOffset;
      if (track.current)
        track.current.style.transform = `translate3d(${position.current}px,0,0)`;
      return;
    }
    const firstSlot = Math.floor(Math.random() * eligible.length);
    setReel(
      Array.from({ length: 12 }, (_, index) => {
        const id = firstSlot + index;
        return { id, song: eligible[id % eligible.length] };
      }),
    );
    setVisibleStart(firstSlot);
    position.current = reelInitialOffset - firstSlot * reelStep;
    if (track.current)
      track.current.style.transform = `translate3d(${position.current}px,0,0)`;
  }, [eligible]);

  // Load last choice from cookie if exists
  useEffect(() => {
    const last = readCookie<{ id?: unknown }>('last-choice');
    if (last?.id && typeof last.id === 'string') {
      const found = songs.find((item) => item.id === last.id) ?? null;
      if (found) {
        setLastChoice(found);
      }
    }
  }, [songs]);

  const attachTrack = useCallback((node: HTMLDivElement | null) => {
    track.current = node;
    if (node) node.style.transform = `translate3d(${position.current}px,0,0)`;
  }, []);

  function open() {
    if (busy.current || !eligible.length || !track.current || !viewport.current)
      return;
    audio.current?.unlock();
    busy.current = true;
    const winner = chooseTiered(eligible);
    const step = reelStep,
      tileWidth = 240,
      width = viewport.current.clientWidth;
    const start = position.current;
    const center = Math.floor((width / 2 - start) / step);
    const profile = createSpinProfile(
      Math.random,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const target = center + profile.tiles;
    const end = width / 2 - tileWidth * stopFraction() - target * step;
    const current = reel.filter(
      ({ id }) => id >= Math.max(0, center - 6) && id <= target + 4,
    );
    let last = current.length
      ? Math.max(...current.map((item) => item.id))
      : center;
    const recent: KaraokeSong[] = [];
    while (last < target + 4) {
      last++;
      const options = eligible.filter((item) => !recent.includes(item));
      const song =
        last === target
          ? winner
          : chooseTiered(options.length ? options : eligible);
      current.push({ id: last, song });
      recent.push(song);
      if (recent.length > 8) recent.shift();
    }
    flushSync(() => {
      setReel(current);
      setSpinning(true);
      setResult(null);
    });
    audio.current?.play('csgo_ui_crate_open');
    const began = performance.now();
    let shown = visibleStart;
    let lastCell = Math.floor((start - width / 2) / step);
    const animate = (now: number) => {
      const progress = Math.max(
        0,
        Math.min(1, (now - began) / profile.durationMs),
      );
      const next =
        start + (end - start) * spinProgress(progress, profile.friction);
      position.current = next;
      const first = Math.max(0, Math.floor(-next / step));
      if (first - shown >= 4 || first < shown) {
        shown = Math.max(0, first - 2);
        setVisibleStart(shown);
      }
      if (track.current)
        track.current.style.transform = `translate3d(${next}px,0,0)`;
      const cell = Math.floor((next - width / 2) / step);
      while (cell !== lastCell) {
        lastCell += cell > lastCell ? 1 : -1;
        audio.current?.play('csgo_ui_crate_item_scroll');
      }
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
        return;
      }
      recordSpin(winner);
      void recordServerSpin();
      busy.current = false;
      setSpinning(false);
      setResult(winner);
      setLastChoice(winner);
      setRevealed(true);
      audio.current?.play(
        (
          [
            'item_reveal3_rare',
            'item_reveal4_mythical',
            'item_reveal5_legendary',
            'item_reveal6_ancient',
            'item_reveal6_ancient',
          ] as const
        )[winner.tier],
      );
    };
    frame.current = requestAnimationFrame(animate);
  }

  const handlePlayPreview = useCallback((song: KaraokeSong) => {
    setResult(song);
    setRevealed(true);
  }, []);

  const inventory = useMemo(
    () =>
      [...eligible]
        .sort((a, b) => b.tier - a.tier || a.title.localeCompare(b.title))
        .map((song) => (
          <KaraokeCard
            key={song.id}
            song={song}
            language={language}
            small
            onRemove={removeSong}
            onPlay={handlePlayPreview}
          />
        )),
    [eligible, language, removeSong, handlePlayPreview],
  );

  if (!isLoaded) {
    return (
      <main className="cache-state">
        <h1>TỐI NAY HÁT GÌ?</h1>
        <p>{t.loading}</p>
      </main>
    );
  }

  return (
    <div className="site-shell">
      <header>
        <Link href="/" className="brand">
          <Mic className="brand-case text-orange-400" size={24} strokeWidth={2.5} />
          <span>
            TỐI NAY <b>HÁT GÌ?</b>
          </span>
        </Link>
        <div className="header-actions">
          <AddSongDialog
            onSongAdded={addSong}
            existingSongIds={songs.map((s) => s.id)}
          />
          <SongManagerDialog
            songs={songs}
            enabledTiers={enabledTiers}
            disabledSongIds={disabledSongIds}
            onToggleSong={toggleSongDisabled}
            onToggleTier={toggleTier}
            onRemoveSong={removeSong}
            onEnableAll={enableAllSongs}
            onResetToDefault={resetToDefault}
            disabled={spinning}
          />
          <button
            className="language-button"
            onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
            aria-label={t.language}
            title={language === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
          >
            {language === 'vi' ? 'EN' : 'VI'}
          </button>
          <button
            className="sound-button"
            onClick={() => {
              audio.current?.setMuted(sound);
              setSound(!sound);
            }}
            aria-label={sound ? t.turnSoundOff : t.turnSoundOn}
            title={sound ? 'Tắt âm thanh CS:GO' : 'Bật âm thanh CS:GO'}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <a
            className="github-button"
            href="https://github.com/zennomi/toinaylogi"
            target="_blank"
            rel="noreferrer"
            aria-label={t.github}
          >
            GitHub <ExternalLink size={14} />
          </a>
        </div>
      </header>

      <main>
        <div className="intro">
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="stattrak-container" title={t.serverCounterTitle}>
            <div className="stattrak-badge">
              <span className="stattrak-label">{t.stattrakLabel}</span>
              <span className="stattrak-caption">{t.stattrakSpins}</span>
              <span
                className="stattrak-digits"
                aria-label={
                  serverSpinStatus === 'unavailable'
                    ? t.serverCounterUnavailable
                    : undefined
                }
              >
                {serverSpins === null
                  ? '—'
                  : String(serverSpins).padStart(6, '0')}
              </span>
            </div>
          </div>
        </div>

        {!eligible.length && (
          <p className="preferences-message">{t.noEligible}</p>
        )}

        <div className="cs-case-heading">
          <div className="cs-case-emblem" aria-hidden="true">
            <Music size={20} />
          </div>
          <div className="cs-case-info">
            <span className="cs-case-subtitle">{t.crateCollection}</span>
            <h2 className="cs-case-title">{t.crateTitle}</h2>
          </div>
          <div className={`cs-case-status ${spinning ? 'opening' : 'ready'}`}>
            <span className="cs-case-status-dot" />
            <span>{spinning ? t.openingCase : t.readyToOpen}</span>
          </div>
        </div>

        <section className="case-panel" aria-label={t.caseLabel}>
          <div className="reel-window" ref={viewport}>
            <div className="selector-line">
              <div className="selector-marker top" />
              <div className="selector-marker bottom" />
            </div>
            <div className="reel-track" ref={attachTrack}>
              {reel
                .filter(
                  ({ id }) => id >= visibleStart && id < visibleStart + 12,
                )
                .map(({ song, id }) => (
                  <KaraokeCard
                    key={id}
                    song={song}
                    language={language}
                    slot={id}
                  />
                ))}
            </div>
            <div className="reel-fade left" />
            <div className="reel-fade right" />
          </div>
        </section>

        <div className="control-bar">
          <div className="last-choice-slot">
            <span className="last-choice-tag">
              {t.lastChoice} ({localSpins}):
            </span>
            {lastChoice ? (
              <div
                className="last-choice-card cursor-pointer"
                onClick={() => handlePlayPreview(lastChoice)}
                title="Bấm để phát lại bài này"
              >
                <span
                  className="last-choice-tier-pill"
                  style={
                    {
                      '--rarity': colors[lastChoice.tier],
                    } as React.CSSProperties
                  }
                >
                  {t.tiers[lastChoice.tier]}
                </span>
                <strong className="last-choice-name">
                  {lastChoice.title}
                </strong>
              </div>
            ) : (
              <span className="last-choice-empty">—</span>
            )}
          </div>
          <button
            className="open-button"
            disabled={spinning || !eligible.length}
            onClick={open}
          >
            {spinning ? <AudioLines size={22} /> : <Sparkles size={21} />}
            {spinning ? t.opening : result ? t.openAgain : t.open}
          </button>
        </div>

        {/* Winner Dialog with Embedded YouTube Karaoke Player */}
        <Dialog open={revealed} onOpenChange={setRevealed}>
          <DialogContent
            className="winner-dialog sm:max-w-4xl"
            showCloseButton={true}
            style={
              {
                '--rarity': colors[result?.tier ?? 0],
              } as React.CSSProperties
            }
          >
            {result && (
              <>
                <DialogTitle className="winner-title">
                  {result.title}
                </DialogTitle>
                <p className="winner-native-name">
                  {result.channel} {result.duration ? `· ${result.duration}` : ''}
                </p>
                <DialogDescription className="winner-description">
                  {t.tiers[result.tier]} · {t.newItem}
                </DialogDescription>

                {/* Embedded YouTube Player */}
                <div
                  className="winner-video-wrapper"
                  style={
                    {
                      '--rarity': colors[result.tier],
                    } as React.CSSProperties
                  }
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${result.youtubeId}?autoplay=1`}
                    title={result.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="winner-iframe"
                  />
                </div>

                <div className="winner-actions">
                  <a
                    className="find-button"
                    href={result.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t.source}</span>
                    <ExternalLink size={16} />
                  </a>
                  <button
                    type="button"
                    className="subtle-button flex items-center gap-1.5"
                    onClick={() => {
                      setRevealed(false);
                      open();
                    }}
                  >
                    <RotateCw size={15} />
                    <span>{t.openAgain}</span>
                  </button>
                  <button onClick={() => setRevealed(false)}>
                    {t.continue}
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Songs In Case Section */}
        <section className="inventory">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.whatsInside}</span>
              <div className="inventory-title-row">
                <h2>
                  {t.items} <span>{eligible.length}</span>
                </h2>
                <AddSongDialog
                  onSongAdded={addSong}
                  existingSongIds={songs.map((s) => s.id)}
                  buttonClassName="customize-food-button"
                />
                <SongManagerDialog
                  songs={songs}
                  enabledTiers={enabledTiers}
                  disabledSongIds={disabledSongIds}
                  onToggleSong={toggleSongDisabled}
                  onToggleTier={toggleTier}
                  onRemoveSong={removeSong}
                  onEnableAll={enableAllSongs}
                  onResetToDefault={resetToDefault}
                  variant="inventory"
                  disabled={spinning}
                />
              </div>
            </div>
            <div className="rarity-legend">
              {t.tiers.map((tier, index) => (
                <span key={tier}>
                  <i style={{ background: colors[index] }} />
                  {tier}
                </span>
              ))}
            </div>
          </div>
          <div className="inventory-grid">{inventory}</div>
        </section>

        <footer>
          <div className="footer-left">
            <span>
              Tối Nay Hát Gì? · CS:GO Karaoke Case Opening
            </span>
            <span className="footer-source">
              {t.sourceData}
            </span>
          </div>
          <div className="footer-right">
            <span>
              {t.adultNote}
            </span>
            <span>
              {t.footer}{' '}
              <a
                href="https://github.com/sourcesounds/csgo"
                target="_blank"
                rel="noreferrer"
              >
                SourceSounds
              </a>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
