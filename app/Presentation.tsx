"use client";

import { useCallback, useState } from "react";
import { CarouselScreen } from "./components/CarouselScreen";
import { IntroScreen } from "./components/IntroScreen";
import { LandingScreen } from "./components/LandingScreen";
import { LoadingScreen } from "./components/LoadingScreen";

type Stage = "landing" | "loading" | "intro" | "carousel";

export default function Presentation() {
  const [stage, setStage] = useState<Stage>("landing");

  const handleStart = useCallback(() => {
    setStage("loading");
  }, []);

  if (stage === "landing") {
    return <LandingScreen onStart={handleStart} />;
  }

  if (stage === "loading") {
    return <LoadingScreen onDone={() => setStage("intro")} />;
  }

  if (stage === "intro") {
    return <IntroScreen onFinish={() => setStage("carousel")} />;
  }

  return <CarouselScreen />;
}