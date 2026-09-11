"use client";

import { useEffect, useRef, useState } from "react";
import { introVideo } from "../lib/videos";
import { PauseIcon, PlayIcon } from "./Icons";
import styles from "../presentation.module.css";

export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [audible, setAudible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const play = async () => {
      try {
        await video.play();
      } catch {
        if (cancelled) return;
        video.muted = true;
        setAudible(false);
        try {
          await video.play();
        } catch {}
      }
    };

    play();
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <div className={styles.screen}>
      <video
        ref={videoRef}
        className={styles.video}
        src={introVideo.src}
        muted={!audible}
        playsInline
        onEnded={onFinish}
      />
      <div className={styles.introControls}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={togglePause}
          aria-label={paused ? "Reanudar" : "Pausar"}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button
          type="button"
          className={styles.skipButton}
          onClick={onFinish}
        >
          Omitir intro
        </button>
      </div>
    </div>
  );
}