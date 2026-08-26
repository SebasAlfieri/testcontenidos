"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Card = { id: string; pair: string; emoji: string; label: string; kind: "pair" | "cookie" | "trap" };

const CARD_SET: Card[] = [
  { id: "elf-1", pair: "elf", emoji: "🧝", label: "Elfo", kind: "pair" }, { id: "elf-2", pair: "elf", emoji: "🧝", label: "Elfo", kind: "pair" },
  { id: "tree-1", pair: "tree", emoji: "🎄", label: "Árbol", kind: "pair" }, { id: "tree-2", pair: "tree", emoji: "🎄", label: "Árbol", kind: "pair" },
  { id: "gift-1", pair: "gift", emoji: "🎁", label: "Regalo", kind: "pair" }, { id: "gift-2", pair: "gift", emoji: "🎁", label: "Regalo", kind: "pair" },
  { id: "candy-1", pair: "candy", emoji: "🍬", label: "Dulce", kind: "pair" }, { id: "candy-2", pair: "candy", emoji: "🍬", label: "Dulce", kind: "pair" },
  { id: "star-1", pair: "star", emoji: "⭐", label: "Estrella", kind: "pair" }, { id: "star-2", pair: "star", emoji: "⭐", label: "Estrella", kind: "pair" },
  { id: "cookie-1", pair: "cookie", emoji: "🍪", label: "Galleta Príncipe", kind: "cookie" }, { id: "cookie-2", pair: "cookie", emoji: "🍪", label: "Galleta Príncipe", kind: "cookie" },
  { id: "trap-1", pair: "trap-1", emoji: "😈", label: "Trampa del Grinch", kind: "trap" }, { id: "trap-2", pair: "trap-2", emoji: "💚", label: "Trampa del Grinch", kind: "trap" },
  { id: "snow-1", pair: "snow", emoji: "❄️", label: "Nieve", kind: "pair" }, { id: "snow-2", pair: "snow", emoji: "❄️", label: "Nieve", kind: "pair" },
];
const PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DX0Yxoavh5qJV";
const shuffledDeck = () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const deck = [...CARD_SET];
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(Math.random() * (index + 1));
      [deck[index], deck[swapWith]] = [deck[swapWith], deck[index]];
    }
    const pairsAreSeparated = deck.every((card, index) => {
      if (card.kind === "trap") return true;
      const twinIndex = deck.findIndex((other, otherIndex) => otherIndex !== index && other.pair === card.pair);
      return twinIndex === -1 || Math.abs(Math.floor(index / 4) - Math.floor(twinIndex / 4)) + Math.abs((index % 4) - (twinIndex % 4)) > 1;
    });
    if (pairsAreSeparated) return deck;
  }
  return [...CARD_SET];
};

export default function Home() {
  const [deck, setDeck] = useState<Card[]>(CARD_SET);
  const [flipped, setFlipped] = useState<string[]>([]); const [matched, setMatched] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(60); const [status, setStatus] = useState<"intro" | "playing" | "won" | "lost">("intro");
  const [message, setMessage] = useState("Encontrá todos los pares antes que el Grinch."); const [copied, setCopied] = useState(false);
  const resolveTimer = useRef<number | null>(null);
  const [beat, setBeat] = useState<number | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { const value = Number(new URLSearchParams(window.location.search).get("beat")); setBeat(Number.isFinite(value) && value > 0 ? Math.round(value) : null); }, 0); return () => window.clearTimeout(timer); }, []);
  const clearResolution = () => { if (resolveTimer.current) window.clearTimeout(resolveTimer.current); };
  useEffect(() => { if (status !== "playing") return; const timer = window.setTimeout(() => { if (seconds <= 1) { setSeconds(0); setStatus("lost"); setMessage("El Grinch escondió la Navidad esta vez."); } else setSeconds(seconds - 1); }, 1000); return () => window.clearTimeout(timer); }, [seconds, status]);
  useEffect(() => () => clearResolution(), []);
  const finishIfNeeded = useCallback((newMatched: string[], remaining: number) => { if (newMatched.length === CARD_SET.filter((card) => card.kind !== "trap").length) { setStatus("won"); setMessage(beat && remaining > beat ? "¡Le ganaste a tu amigo!" : "¡La Navidad está a salvo!"); } }, [beat]);
  const turnCard = (card: Card) => {
    if (status !== "playing" || flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.id)) return;
    if (card.kind === "trap") { setFlipped([card.id]); setSeconds((value) => Math.max(0, value - 6)); setMessage("¡Trampa del Grinch! Perdés 6 segundos."); resolveTimer.current = window.setTimeout(() => setFlipped([]), 850); return; }
    const nextFlipped = [...flipped, card.id]; setFlipped(nextFlipped); if (nextFlipped.length < 2) return;
    const first = deck.find((item) => item.id === nextFlipped[0]); if (!first) return;
    if (first.pair === card.pair) { const newMatched = [...matched, ...nextFlipped]; const bonus = card.kind === "cookie" ? 10 : 0; const remaining = seconds + bonus; setMatched(newMatched); setSeconds(remaining); setFlipped([]); setMessage(bonus ? "¡Par Príncipe! +10 segundos." : "¡Par encontrado!"); finishIfNeeded(newMatched, remaining); }
    else { setMessage("No son iguales. Recordá dónde estaban."); resolveTimer.current = window.setTimeout(() => setFlipped([]), 800); }
  };
  const startGame = () => { clearResolution(); setDeck(shuffledDeck()); setFlipped([]); setMatched([]); setSeconds(60); setStatus("playing"); setMessage("Nueva partida: el Elfo cuenta con vos."); setCopied(false); };
  const shareChallenge = async () => { const url = `${window.location.origin}${window.location.pathname}?beat=${seconds}`; try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { window.prompt("Copiá este reto para tu amigo:", url); } };
  const isUp = (id: string) => flipped.includes(id) || matched.includes(id); const completedPairs = matched.length / 2;
  return <main className={styles.gameShell}>
    <div className={styles.snow} aria-hidden="true">✦　·　✧　·　✦　·　✧　·　✦</div>
    <header className={styles.header}><div className={styles.brand}><span>🍪</span> PRÍNCIPE</div><p>Edición navideña</p></header>
    <section className={styles.hero}><div className={styles.titleBlock}><p className={styles.eyebrow}>MISIÓN NAVIDEÑA</p><h1>Memoria <span>Elfo</span><br />vs. Grinch</h1><p className={styles.subtitle}>{beat ? <>Debés superar <strong>{beat}s</strong> para ganarle a tu amigo.</> : "Dale una mano al Elfo antes de que el Grinch se salga con la suya."}</p></div><div className={styles.characters} aria-hidden="true"><span className={styles.elf}>🧝</span><span className={styles.vs}>VS</span><span className={styles.grinch}>💚</span></div></section>
    {status === "intro" ? <section className={styles.introCard}><div className={styles.introEmoji}>🎄🍪😈</div><p className={styles.eyebrow}>¿LISTO PARA JUGAR?</p><h2>Encontrá los pares y salvá la Navidad</h2><p>Las galletas Príncipe te dan tiempo extra. Evitá las trampas del Grinch.</p><button className={styles.primaryButton} onClick={startGame}>Comenzar desafío <span>→</span></button></section> : status === "playing" ? <><section className={styles.dashboard} aria-label="Estado del juego"><div><span>TIEMPO</span><strong className={seconds <= 15 ? styles.urgent : ""}>00:{String(seconds).padStart(2, "0")}</strong></div><div><span>PARES</span><strong>{completedPairs}<i>/7</i></strong></div><div className={styles.tip}><span>TIP</span><p>🍪 = +10 seg<br />😈 = -6 seg</p></div></section><p className={styles.message} aria-live="polite">{message}</p><section className={styles.board} aria-label="Cartas de memoria">{deck.map((card) => <button key={card.id} className={`${styles.card} ${isUp(card.id) ? styles.flipped : ""} ${matched.includes(card.id) ? styles.matched : ""} ${card.kind === "trap" && isUp(card.id) ? styles.trap : ""}`} onClick={() => turnCard(card)} aria-label={isUp(card.id) ? card.label : "Carta boca abajo"}><span className={styles.cardInner}><span className={styles.cardFace}>{card.emoji}</span><span className={styles.cardBack}>✦</span></span></button>)}</section></> : <section className={`${styles.result} ${status === "won" ? styles.win : styles.loss}`}><div className={styles.resultEmoji}>{status === "won" ? "🎉" : "😈"}</div><p className={styles.eyebrow}>{status === "won" ? "MISIÓN CUMPLIDA" : "CASI, CASI"}</p><h2>{status === "won" ? "¡Lo lograste!" : "El Grinch fue más rápido"}</h2><p>{status === "won" ? <>Te sobraron <strong>{seconds} segundos</strong>. {beat && seconds > beat ? "Tu amigo ya tiene un nuevo récord que superar." : "Compartí el reto y que empiece la competencia."}</> : "No te preocupes: la playlist navideña sigue siendo tuya."}</p><a className={styles.playlist} href={PLAYLIST_URL} target="_blank" rel="noreferrer">▶ Escuchar playlist navideña</a><div className={styles.resultActions}><button className={styles.secondaryButton} onClick={startGame}>↻ Volver a intentar</button>{status === "won" && <button className={styles.primaryButton} onClick={shareChallenge}>{copied ? "¡Link copiado!" : "Retar a un amigo ↗"}</button>}</div></section>}
    <footer className={styles.footer}>Hecho para compartir un momento dulce esta Navidad <span>✦</span></footer>
  </main>;
}
