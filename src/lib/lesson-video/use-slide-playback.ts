"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSlideDeck,
  resourcesCacheKey,
} from "@/lib/lesson-video/build-slide-deck";
import type { Slide, SlideDeck } from "@/lib/lesson-video/types";
import type { Resource } from "@/lib/types";

function fallbackMsForText(text: string): number {
  const chars = text.trim().length;
  // ~8–12s scaled by length; min 5s, max 20s.
  return Math.min(20_000, Math.max(5_000, 4_000 + chars * 35));
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefer = (lang: string) =>
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  return prefer("en-ZA") ?? prefer("en-GB") ?? prefer("en") ?? voices[0] ?? null;
}

function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function useSlidePlayback(resources: Resource[]) {
  const [deck, setDeck] = useState<SlideDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const cacheKey = resourcesCacheKey(resources);
  const deckRef = useRef<SlideDeck | null>(null);
  const playingRef = useRef(false);
  const mutedRef = useRef(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  playingRef.current = playing;
  mutedRef.current = muted;
  indexRef.current = currentIndex;

  const clearAdvance = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setPlaying(false);
    clearAdvance();

    void (async () => {
      try {
        const next = await buildSlideDeck(resources);
        if (cancelled) return;
        deckRef.current = next;
        setDeck(next);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        deckRef.current = null;
        setDeck(null);
        setError(err instanceof Error ? err.message : "Failed to build video walkthrough.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearAdvance();
    };
    // cacheKey captures resource identity for rebuilds
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: rebuild when uploads change
  }, [cacheKey, clearAdvance]);

  const goTo = useCallback(
    (index: number) => {
      const d = deckRef.current;
      if (!d || d.slides.length === 0) return;
      const clamped = Math.max(0, Math.min(d.slides.length - 1, index));
      setCurrentIndex(clamped);
    },
    [],
  );

  const advanceFrom = useCallback(
    (fromIndex: number) => {
      const d = deckRef.current;
      if (!d || !playingRef.current) return;
      if (fromIndex >= d.slides.length - 1) {
        setPlaying(false);
        return;
      }
      setCurrentIndex(fromIndex + 1);
    },
    [],
  );

  const speakOrTimer = useCallback(
    (slide: Slide, index: number) => {
      clearAdvance();
      if (!playingRef.current) return;

      const finish = () => {
        if (!playingRef.current) return;
        // Only advance if we are still on this slide
        if (indexRef.current !== index) return;
        advanceFrom(index);
      };

      const useTimer = () => {
        timerRef.current = setTimeout(finish, fallbackMsForText(slide.bodyText));
      };

      if (mutedRef.current || !speechSupported() || !slide.bodyText.trim()) {
        useTimer();
        return;
      }

      try {
        const utter = new SpeechSynthesisUtterance(slide.bodyText);
        const voice = pickVoice();
        if (voice) utter.voice = voice;
        utter.rate = 1;
        utter.onend = finish;
        utter.onerror = () => useTimer();
        utteranceRef.current = utter;
        window.speechSynthesis.speak(utter);
      } catch {
        useTimer();
      }
    },
    [advanceFrom, clearAdvance],
  );

  // When playing (or mute toggles), narrate / timer for the current slide.
  useEffect(() => {
    if (!playing || !deck) return;
    const slide = deck.slides[currentIndex];
    if (!slide) return;
    speakOrTimer(slide, currentIndex);
    return () => {
      clearAdvance();
    };
  }, [playing, muted, currentIndex, deck, speakOrTimer, clearAdvance]);

  // Chrome loads voices asynchronously.
  useEffect(() => {
    if (!speechSupported()) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener("voiceschanged", warm);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", warm);
  }, []);

  const play = useCallback(() => {
    if (!deckRef.current?.slides.length) return;
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
    clearAdvance();
  }, [clearAdvance]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      if (next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  const next = useCallback(() => {
    goTo(indexRef.current + 1);
  }, [goTo]);

  const prev = useCallback(() => {
    goTo(indexRef.current - 1);
  }, [goTo]);

  const progress =
    deck && deck.slides.length > 0 ? (currentIndex + 1) / deck.slides.length : 0;

  return {
    deck,
    loading,
    error,
    currentIndex,
    currentSlide: deck?.slides[currentIndex] ?? null,
    playing,
    muted,
    progress,
    speechAvailable: speechSupported(),
    play,
    pause,
    togglePlay,
    toggleMute,
    next,
    prev,
    goTo,
  };
}
