"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];

// Audio player tuned for 40-minute sermons: playback-speed control and
// remember-where-you-left-off (saved per recording in this browser).
// Falls back to a plain download link if audio can't play.
export default function SermonAudio({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState(1);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const storageKey = `sermon-position:${src}`;

  // Restore saved position and speed once metadata is available.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savedSpeed = Number(localStorage.getItem("sermon-speed") || 1);
    if (SPEEDS.includes(savedSpeed)) {
      setSpeed(savedSpeed);
      audio.playbackRate = savedSpeed;
    }

    const saved = Number(localStorage.getItem(storageKey) || 0);
    const restore = () => {
      // Resume only mid-sermon positions (30s in, 60s+ left).
      if (saved > 30 && saved < audio.duration - 60) {
        audio.currentTime = saved;
        setResumedFrom(saved);
      }
    };
    if (audio.readyState >= 1) restore();
    else audio.addEventListener("loadedmetadata", restore, { once: true });

    const save = () => {
      if (audio.currentTime > 0) {
        if (audio.ended || audio.duration - audio.currentTime < 60) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, String(Math.floor(audio.currentTime)));
        }
      }
    };
    const interval = setInterval(save, 5000);
    audio.addEventListener("pause", save);
    return () => {
      clearInterval(interval);
      audio.removeEventListener("pause", save);
    };
  }, [storageKey]);

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    localStorage.setItem("sermon-speed", String(next));
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  return (
    <div className="mt-5">
      <audio
        ref={audioRef}
        controls
        preload="none"
        src={src}
        aria-label={`Sermon audio: ${title}`}
        className="w-full"
      >
        Your browser doesn&rsquo;t support audio playback.{" "}
        <a href={src}>Download the recording instead.</a>
      </audio>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          {resumedFrom !== null && `Resumed where you left off (${fmt(resumedFrom)})`}
        </span>
        <button
          type="button"
          onClick={cycleSpeed}
          className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition-colors hover:border-brand-600 hover:text-brand-700"
          aria-label={`Playback speed ${speed}x — click to change`}
        >
          {speed}× speed
        </button>
      </div>
    </div>
  );
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
