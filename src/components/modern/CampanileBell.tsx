import { useEffect, useRef, useState } from "react";

const melodies = [
  [392, 523.25, 659.25],
  [440, 554.37, 698.46],
  [349.23, 440, 587.33],
  [523.25, 659.25, 783.99],
] as const;

type AudioContextLike = AudioContext;

export function CampanileBell() {
  const context = useRef<AudioContextLike | null>(null);
  const ringIndex = useRef(0);
  const [soundOn, setSoundOn] = useState(true);
  const [ringing, setRinging] = useState(false);
  const [message, setMessage] = useState("Tap the tower to ring the bell");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      void context.current?.close();
    },
    [],
  );

  async function ring() {
    const next = ringIndex.current++ % melodies.length;
    setMessage(`Bell melody ${next + 1} of ${melodies.length}`);
    setRinging(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRinging(false), 900);

    if (!soundOn || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
      setMessage("Audio is unavailable in this browser");
      return;
    }
    try {
      const audio = context.current ?? new AudioContextClass();
      context.current = audio;
      if (audio.state === "suspended") await audio.resume();
      const start = audio.currentTime;
      melodies[next]!.forEach((frequency, note) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start + note * 0.13);
        gain.gain.setValueAtTime(0.0001, start + note * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.075, start + note * 0.13 + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + note * 0.13 + 1.5);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(start + note * 0.13);
        oscillator.stop(start + note * 0.13 + 1.5);
      });
    } catch {
      setMessage("Sound is unavailable. You can keep exploring.");
    }
  }

  return (
    <div className="modern-bell">
      <div className="modern-bell__sky" aria-hidden="true" />
      <span className="modern-bell__orbit modern-bell__orbit--one" aria-hidden="true" />
      <span className="modern-bell__orbit modern-bell__orbit--two" aria-hidden="true" />
      <button
        type="button"
        className={`modern-bell__tower ${ringing ? "is-ringing" : ""}`}
        aria-label="Ring the Campanile bell"
        onClick={() => void ring()}
      >
        <svg viewBox="0 0 250 410" role="img" aria-hidden="true" focusable="false">
          <path className="tower-shadow" d="M58 396h147v-25H58z" />
          <path className="tower-side" d="M161 110l29 18v243h-29z" />
          <path className="tower-face" d="M64 128h97v243H64z" />
          <path className="tower-crown" d="M55 119h117l-10-18H65z" />
          <path className="tower-roof" d="M72 101l36-29 49 29z" />
          <path className="tower-spire" d="M108 72V42m-5 0h10" />
          <path className="tower-detail" d="M70 139h85M70 348h85M71 358h83" />
          <path className="tower-clock" d="M109 235a22 22 0 1 0 0 44 22 22 0 0 0 0-44Z" />
          <path className="tower-hands" d="M109 241v16l10 7" />
          <path
            className="tower-window"
            d="M76 205v-39a10 10 0 0 1 20 0v39zm24 0v-39a10 10 0 0 1 20 0v39zm24 0v-39a10 10 0 0 1 20 0v39zM82 328v-15a11 11 0 0 1 22 0v15zm39 0v-15a11 11 0 0 1 22 0v15z"
          />
          <path className="tower-side-detail" d="M173 172v35m0 26v35m0 26v35" />
        </svg>
        <span className="modern-bell__hint">Ring the bell</span>
      </button>
      <div className="modern-bell__base">
        <span className="modern-bell__eyebrow">A LITTLE BERKELEY MAGIC</span>
        <p>The Campanile is calling.</p>
        <span className="modern-bell__instruction">
          Tap or click the tower. Every ring is a little different.
        </span>
      </div>
      <button
        type="button"
        className="modern-bell__sound"
        aria-pressed={!soundOn}
        onClick={() => setSoundOn((value) => !value)}
      >
        Sound {soundOn ? "on" : "off"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
