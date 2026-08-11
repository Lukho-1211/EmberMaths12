"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { hasVideoSources } from "@/lib/lesson-video";
import { useSlidePlayback } from "@/lib/lesson-video/use-slide-playback";
import type { Resource } from "@/lib/types";

export function LessonVideoPlayer({
  title,
  resources,
  className,
}: {
  title: string;
  resources: Resource[];
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const playback = useSlidePlayback(resources);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const { togglePlay, next, prev } = playback;
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [togglePlay, next, prev]);

  if (!hasVideoSources(resources)) return null;

  async function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked; ignore.
    }
  }

  const slide = playback.currentSlide;
  const total = playback.deck?.slides.length ?? 0;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className={
        className ??
        "aspect-video overflow-hidden rounded-xl border border-border bg-ember-navy outline-none focus-visible:ring-2 focus-visible:ring-ember-gold"
      }
      role="region"
      aria-label={`${title} video walkthrough`}
    >
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1 bg-ember-navy">
          {playback.loading ? (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-white/80">
              Converting materials into a video walkthrough…
            </div>
          ) : playback.error ? (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-white/90">
              <p>{playback.error}</p>
            </div>
          ) : !slide ? (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-white/80">
              No slides could be built from the uploaded files.
            </div>
          ) : slide.visual.type === "image" ? (
            <img
              src={slide.visual.src}
              alt={slide.visual.alt}
              className="h-full w-full object-contain bg-black"
            />
          ) : (
            <div className="flex h-full flex-col overflow-auto bg-gradient-to-b from-ember-navy to-[#0c1528] px-6 py-5 text-white sm:px-10 sm:py-8">
              {slide.title ? (
                <h3 className="font-display text-xl text-ember-gold sm:text-2xl">
                  {slide.title}
                </h3>
              ) : null}
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90 sm:text-base">
                {slide.visual.markdown
                  .replace(/^#{1,6}\s+/gm, "")
                  .replace(/\*\*(.*?)\*\*/g, "$1")
                  .trim()}
              </pre>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/40 px-3 py-2 text-white">
          <div
            className="mb-2 h-1 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(playback.progress * 100)}
            aria-label="Walkthrough progress"
          >
            <div
              className="h-full rounded-full bg-ember-gold transition-[width] duration-300"
              style={{ width: `${playback.progress * 100}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={playback.prev}
                disabled={playback.currentIndex <= 0}
                className="rounded p-1.5 hover:bg-white/10 disabled:opacity-40"
                aria-label="Previous slide"
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                onClick={playback.togglePlay}
                disabled={!playback.deck?.slides.length}
                className="rounded-full bg-ember-gold p-2 text-ember-navy hover:brightness-105 disabled:opacity-40"
                aria-label={playback.playing ? "Pause" : "Play"}
              >
                {playback.playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                onClick={playback.next}
                disabled={!total || playback.currentIndex >= total - 1}
                className="rounded p-1.5 hover:bg-white/10 disabled:opacity-40"
                aria-label="Next slide"
              >
                <SkipForward size={18} />
              </button>
              <button
                type="button"
                onClick={playback.toggleMute}
                className="rounded p-1.5 hover:bg-white/10"
                aria-label={playback.muted ? "Unmute narration" : "Mute narration"}
              >
                {playback.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/80">
              <span>
                {total ? `${playback.currentIndex + 1} / ${total}` : "—"}
                {playback.deck
                  ? ` · ≈ ${playback.deck.estimatedMinutes} min`
                  : ""}
              </span>
              {!playback.speechAvailable ? (
                <span className="text-ember-gold/90">Narration unavailable</span>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="rounded p-1.5 hover:bg-white/10"
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
