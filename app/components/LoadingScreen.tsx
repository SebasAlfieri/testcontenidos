"use client";

import { useEffect } from "react";
import { usePreloadVideos } from "../lib/usePreloadVideos";
import styles from "../presentation.module.css";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const { progress, ready } = usePreloadVideos(onDone);

  useEffect(() => {
    if (ready) {
      const timer = window.setTimeout(onDone, 400);
      return () => window.clearTimeout(timer);
    }
  }, [ready, onDone]);

  return (
    <div className={styles.screen}>
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando el proyecto...</p>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={styles.loadingPct}>{progress}%</p>
      </div>
    </div>
  );
}