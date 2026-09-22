"use client";

import { useEffect, useState } from "react";
import { CAROUSEL_SLIDES, VIDEO_ASSETS } from "./videos";

function waitForSeek(video: HTMLVideoElement, timeoutMs: number) {
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, timeoutMs);
    video.addEventListener(
      "seeked",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function warmVideo(video: HTMLVideoElement) {
  const duration = video.duration;
  if (Number.isFinite(duration) && duration > 0) {
    video.currentTime = Math.max(duration - 0.1, 0);
    await waitForSeek(video, 6000);
  }
  video.currentTime = 0;
}

function disposeVideos(videos: HTMLVideoElement[]) {
  for (const video of videos) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

export function usePreloadVideos(onDone: () => void) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const videos: HTMLVideoElement[] = [];
    let finished = 0;
    const total = VIDEO_ASSETS.length + CAROUSEL_SLIDES.length;

    const container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    container.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;";

    const markFinished = () => {
      if (cancelled) return;
      finished += 1;
      setProgress(Math.round((finished / total) * 100));
      if (finished >= total) {
        setReady(true);
        window.setTimeout(() => {
          disposeVideos(videos);
          container.remove();
        }, 0);
      }
    };

    for (const asset of VIDEO_ASSETS) {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.src = asset.src;
      container.appendChild(video);
      videos.push(video);

      video.addEventListener("canplaythrough", () => {
        if (cancelled) return;
        warmVideo(video).then(markFinished);
      });
      video.addEventListener("error", () => {
        if (!cancelled) markFinished();
      });
      video.load();
    }

    for (const slide of CAROUSEL_SLIDES) {
      const image = new window.Image();
      image.onload = () => {
        if (!cancelled) markFinished();
      };
      image.onerror = () => {
        if (!cancelled) markFinished();
      };
      image.src = slide.src;
    }

    document.body.appendChild(container);

    return () => {
      cancelled = true;
      disposeVideos(videos);
      container.remove();
    };
  }, [onDone]);

  return { progress, ready };
}