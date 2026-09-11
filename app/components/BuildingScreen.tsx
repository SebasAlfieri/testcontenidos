"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildingFacadeTimes,
  buildingVideo,
  FACADE_COUNT,
} from "../lib/videos";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import styles from "../presentation.module.css";

const SEEK_SPEED = 3;
const MIN_SEEK_DURATION = 0.6;
const MAX_SEEK_DURATION = 3;
const STOP_TOLERANCE = 0.06;
const RATE_SWING = 0.7;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Transition = {
  kind: "play" | "scrub";
  start: number;
  delta: number;
  target: number;
  direction: 1 | -1;
  startWall?: number;
  duration?: number;
};

export function BuildingScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const indexRef = useRef(0);
  const activeRef = useRef<Transition | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const setTransitioningState = useCallback((value: boolean) => {
    transitioningRef.current = value;
    setTransitioning(value);
  }, []);

  const stopTransition = useCallback(() => {
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    activeRef.current = null;
  }, []);

  const finishAt = useCallback(
    (video: HTMLVideoElement, target: number) => {
      stopTransition();
      video.pause();
      video.playbackRate = 1;
      video.currentTime = target;
      setTransitioningState(false);
    },
    [setTransitioningState, stopTransition],
  );

  const beginScrubTransition = useCallback(
    (
      video: HTMLVideoElement,
      start: number,
      delta: number,
      target: number,
      direction: 1 | -1,
    ) => {
      stopTransition();
      video.pause();

      const duration = video.duration;
      const seekDuration = Math.min(
        Math.max(delta / SEEK_SPEED, MIN_SEEK_DURATION),
        MAX_SEEK_DURATION,
      );
      const wallStart = performance.now();
      activeRef.current = {
        kind: "scrub",
        start,
        delta,
        target,
        direction,
        startWall: wallStart,
        duration: seekDuration,
      };

      const tick = (now: number) => {
        if (activeRef.current?.kind !== "scrub") return;
        const rawProgress = (now - wallStart) / 1000 / seekDuration;
        const progress = Math.min(rawProgress, 1);
        const eased = easeInOutCubic(progress);
        const deltaSigned = direction === 1 ? delta : -delta;
        const physical =
          (((start + eased * deltaSigned) % duration) + duration) % duration;
        video.currentTime = physical;

        if (progress < 1) {
          animationIdRef.current = requestAnimationFrame(tick);
        } else {
          finishAt(video, target);
        }
      };

      animationIdRef.current = requestAnimationFrame(tick);
    },
    [finishAt, stopTransition],
  );

  const beginPlayTransition = useCallback(
    (
      video: HTMLVideoElement,
      start: number,
      delta: number,
      target: number,
      direction: 1 | -1,
    ) => {
      stopTransition();

      video.pause();
      video.playbackRate = direction === 1 ? 1 : -1;
      video.play().catch(() => {});

      if (direction === -1 && video.playbackRate >= 0) {
        beginScrubTransition(video, start, delta, target, direction);
        return;
      }

      activeRef.current = { kind: "play", start, delta, target, direction };
      const startWall = performance.now();
      let lastTraveled = 0;
      let stalledAt: number | null = null;

      const monitor = () => {
        if (activeRef.current?.kind !== "play") return;
        const current = video.currentTime;
        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          finishAt(video, target);
          return;
        }
        const rawTraveled =
          direction === 1
            ? ((current - start) % duration + duration) % duration
            : ((start - current) % duration + duration) % duration;

        if (
          rawTraveled >= delta - STOP_TOLERANCE ||
          rawTraveled >= duration - STOP_TOLERANCE
        ) {
          finishAt(video, target);
          return;
        }

        if ((performance.now() - startWall) / 1000 > delta + 20) {
          finishAt(video, target);
          return;
        }

        if (Math.abs(rawTraveled - lastTraveled) < 0.0001) {
          if (stalledAt === null) stalledAt = performance.now();
          else if (performance.now() - stalledAt > 1200) {
            finishAt(video, target);
            return;
          }
        } else {
          stalledAt = null;
          lastTraveled = rawTraveled;
        }

        const progress = delta > 0 ? Math.min(rawTraveled / delta, 1) : 1;
        const magnitude =
          1 + RATE_SWING * Math.cos(2 * Math.PI * (progress - 0.5));
        video.playbackRate = direction === 1 ? magnitude : -magnitude;

        animationIdRef.current = requestAnimationFrame(monitor);
      };

      animationIdRef.current = requestAnimationFrame(monitor);
    },
    [beginScrubTransition, finishAt, stopTransition],
  );

  const travel = useCallback(
    (rawIndex: number, travelDirection: 1 | -1) => {
      if (transitioningRef.current) return;
      const video = videoRef.current;
      if (!video) return;
      const i = ((rawIndex % FACADE_COUNT) + FACADE_COUNT) % FACADE_COUNT;
      setShowHint(false);
      if (i === indexRef.current) return;

      const target = buildingFacadeTimes[i];
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        finishAt(video, target);
        indexRef.current = i;
        setIndex(i);
        return;
      }

      const start = video.currentTime;
      const delta =
        travelDirection === 1
          ? ((target - start) % duration + duration) % duration
          : ((start - target) % duration + duration) % duration;

      indexRef.current = i;
      setIndex(i);
      setTransitioningState(true);
      beginPlayTransition(video, start, delta, target, travelDirection);
    },
    [beginPlayTransition, finishAt, setTransitioningState],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      travel(indexRef.current + direction, direction);
    },
    [travel],
  );

  const goToClosest = useCallback(
    (rawIndex: number) => {
      const video = videoRef.current;
      if (!video) return;
      const i = ((rawIndex % FACADE_COUNT) + FACADE_COUNT) % FACADE_COUNT;
      if (i === indexRef.current) return;

      const target = buildingFacadeTimes[i];
      const start = video.currentTime;
      const duration = video.duration;
      let direction: 1 | -1 = 1;
      if (Number.isFinite(duration) && duration > 0) {
        const forward = ((target - start) % duration + duration) % duration;
        const backward = ((start - target) % duration + duration) % duration;
        direction = forward <= backward ? 1 : -1;
      }
      travel(i, direction);
    },
    [travel],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const alignTimeupdate = () => {
      const time = video.currentTime;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      buildingFacadeTimes.forEach((facadeTime, i) => {
        const distance = Math.abs(facadeTime - time);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      if (indexRef.current !== best) {
        indexRef.current = best;
        setIndex(best);
      }
    };

    video.addEventListener("timeupdate", alignTimeupdate);
    video.currentTime = 0;

    return () => {
      video.removeEventListener("timeupdate", alignTimeupdate);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (transitioningRef.current) return;
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

  useEffect(
    () => () => {
      stopTransition();
    },
    [stopTransition],
  );

  return (
    <div className={styles.screen}>
      <video
        ref={videoRef}
        className={styles.video}
        src={buildingVideo.src}
        playsInline
        loop
      />
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => step(-1)}
        disabled={transitioning}
        aria-label="Cara anterior"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => step(1)}
        disabled={transitioning}
        aria-label="Cara siguiente"
      >
        <ChevronRightIcon />
      </button>
      {showHint && !transitioning && (
        <p className={styles.hint}>Usa las flechas para ver las 4 caras</p>
      )}
      <div
        className={`${styles.dots} ${transitioning ? styles.dotsHidden : ""}`}
        aria-hidden={transitioning}
      >
        {buildingFacadeTimes.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
            onClick={() => goToClosest(i)}
            disabled={transitioning}
            aria-label={`Cara ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}