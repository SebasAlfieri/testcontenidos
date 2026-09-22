"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CAROUSEL_SLIDES,
  FACADE_COUNT,
  normalizeIndex,
  transitionGap,
} from "../lib/videos";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import styles from "../presentation.module.css";

const TRANSITION_TIMEOUT_MS = 2500;

type Transition = {
  src: string;
  reverse: boolean;
  id: number;
};

export function CarouselScreen() {
  const [viewIndex, setViewIndex] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [showHint, setShowHint] = useState(true);
  const viewIndexRef = useRef(0);
  const busyRef = useRef(false);
  const transitionIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const overlayRef = useRef<HTMLVideoElement>(null);

  const finishTransition = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    busyRef.current = false;
    setTransition(null);
  }, []);

  const travel = useCallback(
    (rawTo: number) => {
      if (busyRef.current) return;
      const to = normalizeIndex(rawTo);
      const from = viewIndexRef.current;
      if (to === from) return;

      const gap = transitionGap(from, to);
      const reversedAsset =
        gap.direction === -1 ? gap.slide.transitionReverseSrc : undefined;

      setShowHint(false);
      viewIndexRef.current = to;
      setViewIndex(to);
      busyRef.current = true;
      transitionIdRef.current += 1;
      setTransition({
        src: reversedAsset ?? gap.slide.transitionSrc,
        reverse: gap.direction === -1 && !reversedAsset,
        id: transitionIdRef.current,
      });
    },
    [],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      travel(viewIndexRef.current + direction);
    },
    [travel],
  );

  useEffect(() => {
    if (!transition) return;
    timeoutRef.current = window.setTimeout(
      finishTransition,
      TRANSITION_TIMEOUT_MS,
    );
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [transition, finishTransition]);

  useEffect(() => {
    if (!transition || !transition.reverse) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const setupReverse = () => {
      try {
        if (Number.isFinite(overlay.duration) && overlay.duration > 0) {
          overlay.currentTime = overlay.duration;
        }
        overlay.playbackRate = -1;
        overlay.play().catch(() => {});
      } catch {}
    };
    if (Number.isFinite(overlay.duration) && overlay.duration > 0) {
      setupReverse();
    } else {
      overlay.addEventListener("loadedmetadata", setupReverse, { once: true });
    }
  }, [transition]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (busyRef.current) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const slide = CAROUSEL_SLIDES[viewIndex]!;

  return (
    <div className={styles.screen}>
      <Image
        className={styles.media}
        src={slide.src}
        alt={slide.label}
        fill
        sizes="100vw"
        priority
        draggable={false}
      />
      {transition && (
        <video
          key={transition.id}
          ref={overlayRef}
          className={styles.transitionVideo}
          src={transition.src}
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          onEnded={finishTransition}
          onError={finishTransition}
        />
      )}
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => step(-1)}
        disabled={transition !== null}
        aria-label="Vista anterior"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => step(1)}
        disabled={transition !== null}
        aria-label="Vista siguiente"
      >
        <ChevronRightIcon />
      </button>
      {showHint && transition === null && (
        <p className={styles.hint}>
          Usa las flechas para recorrer las {FACADE_COUNT} vistas
        </p>
      )}
      <div
        className={`${styles.dots} ${transition !== null ? styles.dotsHidden : ""}`}
        aria-hidden={transition !== null}
      >
        {CAROUSEL_SLIDES.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.dot} ${i === viewIndex ? styles.dotActive : ""}`}
            onClick={() => travel(i)}
            disabled={transition !== null}
            aria-label={item.label}
          />
        ))}
      </div>
    </div>
  );
}