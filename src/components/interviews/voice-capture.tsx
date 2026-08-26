"use client";

// VoiceCapture (Loop 07, behind NEXT_PUBLIC_VOICE_MOCK=on): Web Speech API dictation. Audio never
// leaves the browser — only the transcript text and the pace/filler metrics computed here are
// sent with the answer. Support (Aug 2026): Chrome/Edge desktop + Android (webkitSpeechRecognition,
// Google-hosted recognition), Safari 14.1+ partial (no continuous mode, interim results flaky),
// Firefox none. Unsupported → the control explains and the textarea stays the input.
import { useRef, useState, useSyncExternalStore } from "react";
import { speechMetrics, type SpeechMetrics } from "@/lib/interviews/speech-metrics";
import { Button } from "@/components/ui/button";

type Recognition = {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceCapture({ onTranscript, onMetrics, disabled }: { onTranscript: (finalText: string) => void; onMetrics: (m: SpeechMetrics) => void; disabled?: boolean }) {
  // null during SSR/hydration, then the real answer — no setState in an effect.
  const supported = useSyncExternalStore(() => () => {}, () => Boolean(getRecognition()), () => null as boolean | null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const startedAt = useRef<number>(0);
  const finalText = useRef("");

  function start() {
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-GB";
    r.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          const t = res[0].transcript.trim();
          if (t) {
            finalText.current = finalText.current ? `${finalText.current} ${t}` : t;
            onTranscript(t);
          }
        } else interimText += res[0].transcript;
      }
      setInterim(interimText);
    };
    r.onerror = (e) => setError(e.error === "not-allowed" ? "Microphone permission was refused — type your answer instead." : `Speech recognition error: ${e.error}`);
    r.onend = () => {
      setListening(false);
      setInterim("");
      const duration = (Date.now() - startedAt.current) / 1000;
      onMetrics(speechMetrics(finalText.current, duration));
    };
    rec.current = r;
    finalText.current = "";
    startedAt.current = Date.now();
    setError(null);
    setListening(true);
    r.start();
  }

  function stop() {
    rec.current?.stop();
  }

  if (supported === null) return null;
  if (!supported) return <p className="mt-2 text-xs text-muted" data-testid="voice-unsupported">Voice answers need Chrome or Edge (Web Speech API). Type your answer instead.</p>;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3" data-testid="voice-capture">
      <Button type="button" variant={listening ? "danger" : "secondary"} size="sm" onClick={listening ? stop : start} disabled={disabled} data-testid="voice-toggle">
        {listening ? "■ Stop" : "● Speak your answer"}
      </Button>
      {listening && <span className="text-xs text-muted" aria-live="polite">Listening… {interim && <em>{interim}</em>}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
      <span className="text-[10px] text-muted">Audio stays in your browser; only the transcript is graded.</span>
    </div>
  );
}
