"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { SLIDES } from "../lib/slides";
import styles from "../presentation.module.css";

const REEL_COUNT = 3;
const SYMBOL_COUNT = SLIDES.length;
const MIN_TRAVEL = 18;
const TRAVEL_VARIANCE = 3;
const CELL_MARGIN = 1;
const INITIAL_POSITIONS = Array.from(
  { length: REEL_COUNT },
  (_, reel) => reel % SYMBOL_COUNT,
);
const SPIN_DURATIONS = [3400, 4100, 4800];
const SPIN_DELAYS = [0, 260, 520];
const TOTAL_SPIN_MS = 5400;

/* Cada reel se posiciona sobre el hueco real de maquina.png (1001x680). */
const REEL_SLOTS = [styles.reelA, styles.reelB, styles.reelC];

type ReelRun = {
  from: number;
  to: number;
};

const INITIAL_RUNS: ReelRun[] = INITIAL_POSITIONS.map((position) => ({
  from: position,
  to: position,
}));

function wrap(value: number) {
  return ((value % SYMBOL_COUNT) + SYMBOL_COUNT) % SYMBOL_COUNT;
}

function symbolAt(index: number) {
  return SLIDES[wrap(index)]!;
}

export function SlotMachineScreen() {
  const [runs, setRuns] = useState<ReelRun[]>(INITIAL_RUNS);
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [dip, setDip] = useState(0);
  const [result, setResult] = useState<number[] | null>(null);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef;
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  const spin = useCallback(() => {
    if (busyRef.current) return;

    const next = runs.map((run) => {
      const target = Math.floor(Math.random() * SYMBOL_COUNT);
      const travel =
        MIN_TRAVEL + Math.floor(Math.random() * (TRAVEL_VARIANCE + 1));
      const raw = run.to - travel;
      return { from: run.to, to: raw - wrap(raw) + target };
    });

    busyRef.current = true;
    setRuns(next);
    setSpinId((id) => id + 1);
    setSpinning(true);
    setResult(null);

    timersRef.current.push(
      window.setTimeout(() => {
        busyRef.current = false;
        setSpinning(false);
        setResult(next.map((run) => wrap(run.to)));
      }, TOTAL_SPIN_MS),
    );
  }, [runs]);

  const pullLever = useCallback(() => {
    setDip((value) => value + 1);
    spin();
  }, [spin]);

  const landed = result ?? INITIAL_POSITIONS;
  const won = result !== null && result.every((index) => index === result[0]);

  return (
    <div className={styles.screen}>
      <div className={styles.cabinet}>
        <div className={styles.marquee}>
          <Image
            className={styles.logo}
            src="/ziba/logo.png"
            alt="Ziba"
            width={411}
            height={296}
            sizes="(max-width: 480px) 34vw, 150px"
            priority
            draggable={false}
          />
          <h1 className={styles.title}>¿Cómo está tu vibra hoy?</h1>
          <p className={styles.subtitle}>Prueba tu suerte y descubrí la mejor música</p>
        </div>

        <div className={styles.machineStage}>
          <div className={`${styles.machine} ${won ? styles.machineWin : ""}`}>
            <Image
              className={styles.machineImage}
              src="/ziba/maquina.png"
              alt=""
              fill
              sizes="(max-width: 480px) 88vw, 360px"
              priority
              draggable={false}
            />

            {runs.map((run, reel) => {
              const first = run.to - CELL_MARGIN;
              const last = run.from + CELL_MARGIN;
              const cells = [];
              for (let index = first; index <= last; index += 1) {
                const symbol = symbolAt(index);
                cells.push(
                  <div className={styles.symbol} key={index}>
                    <Image
                      className={styles.symbolImage}
                      src={symbol.src}
                      alt=""
                      fill
                      sizes="(max-width: 480px) 22vw, 92px"
                      loading="eager"
                      draggable={false}
                    />
                  </div>,
                );
              }

              const duration = SPIN_DURATIONS[reel] ?? 4200;
              const delay = SPIN_DELAYS[reel] ?? 0;

              const stripStyle = {
                "--from": run.from - first,
                "--to": run.to - first,
                animationDuration: `${duration}ms`,
                animationDelay: `${delay}ms`,
              } as CSSProperties;

              return (
                <div className={REEL_SLOTS[reel]} key={reel}>
                  <div
                    key={`${reel}-${spinId}`}
                    className={`${styles.strip} ${spinning ? styles.stripSpinning : ""}`}
                    style={stripStyle}
                  >
                    {cells}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className={styles.lever}
              onClick={pullLever}
              aria-label="Girar la palanca"
              aria-busy={spinning}
            >
              <span
                key={dip}
                className={`${styles.leverSwing} ${dip > 0 ? styles.leverSwingDip : ""}`}
              >
                <Image
                  className={styles.leverImage}
                  src="/ziba/palanca.png"
                  alt=""
                  fill
                  sizes="(max-width: 480px) 17vw, 62px"
                  loading="eager"
                  draggable={false}
                />
              </span>
            </button>
          </div>
        </div>

        <span className={styles.srOnly} role="status">
          {result === null
            ? spinning
              ? "Girando…"
              : "Toca la palanca o pulsa prueba tu suerte"
            : won
              ? `¡Premio! Las tres son ${SLIDES[landed[0]!]!.label}`
              : landed.map((index) => SLIDES[index]!.label).join(" · ")}
        </span>

        <div className={styles.panel}>
          <button
            type="button"
            className={styles.spinButton}
            onClick={pullLever}
            aria-busy={spinning}
          >
            <span key={dip} className={styles.spinButtonLabel}>
              {spinning ? "Girando…" : "Prueba tu suerte"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
