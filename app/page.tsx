"use client";

import { useEffect, useMemo, useState } from "react";
import partyTypes from "./data/party-types.json";
import styles from "./page.module.css";

type PartyType = (typeof partyTypes)[number];

const questions = [
  { question: "¿Cuál es tu misión apenas llegás a la fiesta?", answers: ["Encontrar la pista", "Abrazar a todo el mundo", "Ubicar el sillón más cómodo"] },
  { question: "Cuando suena un temazo navideño, vos...", answers: ["Lo bailo como si fuera el último", "Me emociono y canto fuerte", "Subo el volumen, pero desde mi lugar"] },
  { question: "Tu brindis ideal tiene...", answers: ["Una historia imposible de contar", "Palabras que hacen llorar", "Dos frases cortitas y algo rico"] },
];
const MAX_ATTEMPTS = 2;
const getPartyType = (id: string | null) => partyTypes.find((type) => type.id === id);

export default function Home() {
  const [mode, setMode] = useState<"quiz" | "result" | "share" | "guess">("quiz");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState([0, 0, 0]);
  const [result, setResult] = useState<PartyType | null>(null);
  const [selectedType, setSelectedType] = useState<PartyType | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [guessState, setGuessState] = useState<"idle" | "wrong" | "right">("idle");
  const [copied, setCopied] = useState(false);
  const [challenge, setChallenge] = useState<PartyType | null>(null);

  useEffect(() => {
    const sharedType = getPartyType(new URLSearchParams(window.location.search).get("tipo"));
    if (!sharedType) return;
    const timer = window.setTimeout(() => { setChallenge(sharedType); setMode("guess"); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const shareUrl = useMemo(() => !selectedType || typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}?tipo=${selectedType.id}`, [selectedType]);

  function answerQuestion(answerIndex: number) {
    const nextScores = scores.map((score, index) => score + (index === answerIndex ? 1 : 0));
    setScores(nextScores);
    if (questionIndex < questions.length - 1) { setQuestionIndex(questionIndex + 1); return; }
    setResult(partyTypes[nextScores.indexOf(Math.max(...nextScores))]);
    setMode("result");
  }

  async function copyLink() {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); }
    catch { window.prompt("Copiá este link para compartir:", shareUrl); }
  }

  function makeGuess(type: PartyType) {
    if (!challenge || guessState === "right") return;
    if (type.id === challenge.id) { setGuessState("right"); return; }
    setAttempts((value) => value + 1); setGuessState("wrong");
  }

  const outOfAttempts = attempts >= MAX_ATTEMPTS;

  return <main className={styles.party}>
    <div className={styles.party__glow} aria-hidden="true" />
    <section className={styles.party__card}>
      <header className={styles.party__header}><p className={styles.party__eyebrow}>AMIGO SECRETO DE FIESTA</p><div className={styles.party__brand}>❄ festejo</div></header>
      {mode === "quiz" && <div className={styles.party__content}>
        <span className={styles.party__step}>Pregunta {questionIndex + 1} de {questions.length}</span><div className={styles.party__progress}><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
        <p className={styles.party__kicker}>DESCUBRILO</p><h1 className={styles.party__title}>¿Qué tipo de fiestero navideño sos?</h1><p className={styles.party__question}>{questions[questionIndex].question}</p>
        <div className={styles.party__answers}>{questions[questionIndex].answers.map((answer, index) => <button className={styles.party__answer} key={answer} onClick={() => answerQuestion(index)}><span>{["✦", "♥", "☁"][index]}</span>{answer}</button>)}</div>
      </div>}
      {mode === "result" && result && <div className={styles.party__content}>
        <p className={styles.party__kicker}>LISTO, YA TENEMOS TU PERFIL</p><h1 className={styles.party__title}>Tu noche tiene personalidad propia.</h1><p className={styles.party__description}>Abrí tu resultado y encontrá la playlist para arrancar el festejo.</p>
      </div>}
      {mode === "share" && <div className={styles.party__content}>
        <p className={styles.party__kicker}>TU TURNO</p><h1 className={styles.party__title}>¿Qué fiestero navideño creés que es tu amigo?</h1><p className={styles.party__description}>Elegí uno. Le llegará un desafío para que intente adivinarlo.</p><TypePicker selected={selectedType?.id} onSelect={setSelectedType} />
        <button className={styles.party__button} disabled={!selectedType} onClick={copyLink}>{copied ? "Link copiado ✦" : "Copiar link para compartir"} <span>↗</span></button>{copied && <p className={styles.party__hint}>Mandáselo por donde quieras. La sorpresa está guardada en el link.</p>}
      </div>}
      {mode === "guess" && challenge && <div className={styles.party__content}>
        <p className={styles.party__kicker}>TE LLEGÓ UN DESAFÍO</p><h1 className={styles.party__title}>¿Adivinarás qué tipo de fiestero tu amigo cree que sos?</h1>
        {guessState === "idle" && <p className={styles.party__description}>Tenés {MAX_ATTEMPTS - attempts} {MAX_ATTEMPTS - attempts === 1 ? "intento" : "intentos"}. Elegí con el corazón.</p>}{guessState === "wrong" && !outOfAttempts && <p className={styles.party__feedback}>Casi... todavía te queda una oportunidad.</p>}{guessState === "wrong" && outOfAttempts && <p className={styles.party__feedback}>No era ese. Tu amigo te ve como <strong>{challenge.name}</strong>.</p>}{guessState === "right" && <p className={styles.party__feedback}>¡Le diste! Se conocen demasiado bien. ✨</p>}
        {guessState !== "right" && !outOfAttempts && <TypePicker onSelect={makeGuess} />}
      </div>}
    </section>
    {mode === "result" && result && <ResultModal type={result} title="Sos" action="Ahora elegí a tu amigo" onClose={() => setMode("share")} />}
    {mode === "guess" && challenge && (guessState === "right" || outOfAttempts) && <ResultModal type={challenge} title={guessState === "right" ? "¡Le diste! Sos" : "Tu amigo cree que sos"} action="Crear mi desafío" onClose={() => { window.location.href = window.location.pathname; }} />}
    <p className={styles.party__footer}>HECHO PARA COMPARTIR, BAILAR Y EXAGERAR UN POCO.</p>
  </main>;
}

function TypePicker({ selected, onSelect }: { selected?: string; onSelect: (type: PartyType) => void }) {
  return <div className={styles.party__types}>{partyTypes.map((type) => <button key={type.id} className={`${styles.party__type} ${selected === type.id ? styles["party__type--selected"] : ""}`} onClick={() => onSelect(type)}><span className={styles.party__typeEmoji}>{type.emoji}</span><span><strong>{type.name}</strong><small>{type.traits}</small></span></button>)}</div>;
}

function ResultModal({ type, title, action, onClose }: { type: PartyType; title: string; action: string; onClose: () => void }) {
  return <div className={styles.party__modalBackdrop} role="dialog" aria-modal="true" aria-label="Tu resultado">
    <section className={styles.party__modal}>
      <p className={styles.party__kicker}>TU RESULTADO</p><div className={styles.party__emoji}>{type.emoji}</div><h1 className={styles.party__modalTitle}>{title} {type.name}</h1><p className={styles.party__description}>{type.description}</p>
      <Playlist type={type} />
      <button className={styles.party__button} onClick={onClose}>{action} <span>→</span></button>
    </section>
  </div>;
}

function Playlist({ type }: { type: PartyType }) {
  return <div className={styles.party__playlist}><span className={styles.party__playlistIcon}>♫</span><div><p>PLAYLIST DE SPOTIFY</p><h2>{type.playlist}</h2><a href={type.playlistUrl} target="_blank" rel="noreferrer">Escuchar ahora <span>↗</span></a></div></div>;
}
