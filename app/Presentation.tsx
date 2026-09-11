"use client";

import { useCallback, useEffect, useState } from "react";
import { BuildingScreen } from "./components/BuildingScreen";
import { IntroScreen } from "./components/IntroScreen";
import { LandingScreen } from "./components/LandingScreen";
import { LoadingScreen } from "./components/LoadingScreen";

type Stage = "landing" | "loading" | "intro" | "building";

function requestFullscreen() {
  const element = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  const request =
    element.requestFullscreen ?? element.webkitRequestFullscreen;
  if (request && !document.fullscreenElement) {
    request.call(element).catch(() => {});
  }
}

export default function Presentation() {
  const [stage, setStage] = useState<Stage>("landing");

  const handleStart = useCallback(() => {
    requestFullscreen();
    setStage("loading");
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && stage !== "landing") {
        setStage("landing");
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [stage]);

  if (stage === "landing") {
    return <LandingScreen onStart={handleStart} />;
  }

  if (stage === "loading") {
    return <LoadingScreen onDone={() => setStage("intro")} />;
  }

  if (stage === "intro") {
    return <IntroScreen onFinish={() => setStage("building")} />;
  }

  return <BuildingScreen />;
}