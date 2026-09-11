"use client";

import styles from "../presentation.module.css";

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.landing}>
        <p className={styles.kicker}>Bienvenido</p>
        <h1 className={styles.title}>Presentación del Edificio</h1>
        <p className={styles.subtitle}>
          Una experiencia visual en pantalla completa.
        </p>
        <button className={styles.primaryButton} type="button" onClick={onStart}>
          INICIAR
        </button>
      </div>
    </div>
  );
}