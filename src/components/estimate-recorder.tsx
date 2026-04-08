"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileText, Loader2 } from "lucide-react";
import { transcribeAudioAction, generateEstimateAction } from "@/app/actions/estimate-actions";
import { EstimateTable } from "@/components/estimate-table";
import type { EstimateResult } from "@/types/estimate";

export type PipelinePhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "generating";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function audioFileName(mime: string): string {
  if (mime.includes("mp4")) return "recording.m4a";
  if (mime.includes("mpeg")) return "recording.mp3";
  return "recording.webm";
}

async function postTranscribe(blob: Blob): Promise<string> {
  const name = audioFileName(blob.type);
  const file = new File([blob], name, {
    type: blob.type || "audio/webm",
  });
  const form = new FormData();
  form.append("audio", file);

  const result = await transcribeAudioAction(form);
  if (!result.ok) throw new Error(result.error);
  return result.transcript;
}

async function postEstimate(transcript: string): Promise<EstimateResult> {
  const result = await generateEstimateAction(transcript);
  if (!result.ok) throw new Error(result.error);
  return result.estimate;
}

export function EstimateRecorder() {
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupStream();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [cleanupStream, stopTimer]);

  const runPipelineAfterRecording = useCallback(async (blob: Blob) => {
    setError(null);
    setEstimate(null);
    setTranscript(null);
    try {
      setPhase("transcribing");
      const t = await postTranscribe(blob);
      setTranscript(t);

      setPhase("generating");
      const result = await postEstimate(t);
      setEstimate(result);
      setPhase("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not available in this browser.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        void runPipelineAfterRecording(blob);
      };

      recorder.start(250);
      setElapsedSec(0);
      stopTimer();
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
      setPhase("recording");
    } catch (e) {
      cleanupStream();
      setError(
        e instanceof Error ? e.message : "Could not access the microphone.",
      );
    }
  }, [cleanupStream, runPipelineAfterRecording, stopTimer]);

  const stopRecording = useCallback(() => {
    stopTimer();
    setElapsedSec(0);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "recording") {
      rec.stop();
    } else {
      cleanupStream();
      setPhase("idle");
    }
  }, [cleanupStream, stopTimer]);

  const busy = phase === "transcribing" || phase === "generating";

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Control panel */}
      <div
        className="w-full border border-[#22222A] bg-[#151518]"
        aria-live="polite"
      >
        {/* Panel label bar */}
        <div className="flex items-center justify-between border-b border-[#22222A] bg-[#0E0E11] px-4 py-2">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#8B8B99] uppercase font-mono">
            Audio Input
          </span>
          <span className={`text-[10px] font-mono tracking-widest uppercase ${
            phase === "recording"
              ? "text-red-400"
              : phase === "transcribing" || phase === "generating"
              ? "text-[#7B3FE4]"
              : "text-[#8B8B99]"
          }`}>
            {phase === "idle" && "● Standby"}
            {phase === "recording" && "● Rec"}
            {phase === "transcribing" && "● Transcribing"}
            {phase === "generating" && "● Processing"}
          </span>
        </div>

        <div className="px-6 py-6">
          {phase === "idle" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[#8B8B99]">
                Record a walkthrough of the job site. Groq transcribes with
                Whisper, then Llama generates structured line items and totals.
              </p>
              <button
                type="button"
                onClick={() => void startRecording()}
                className="flex w-full items-center justify-center gap-3 border border-[#7B3FE4] bg-[#7B3FE4] px-6 py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition hover:bg-[#6930cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FE4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518]"
              >
                <span className="h-2 w-2 bg-white" />
                Record New Estimate
              </button>
            </div>
          )}

          {phase === "recording" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 bg-red-500" />
                </span>
                <span className="text-xs font-bold tracking-[0.2em] text-red-400 uppercase font-mono">
                  Recording
                </span>
                <span className="ml-auto font-mono text-2xl tabular-nums text-[#E4E4F0]">
                  {mm}:{ss}
                </span>
              </div>
              {/* Level bar placeholder */}
              <div className="h-1 w-full bg-[#22222A]">
                <div className="h-1 w-1/3 bg-red-500 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="flex w-full items-center justify-center gap-3 border border-[#22222A] bg-[#0E0E11] px-6 py-3 text-sm font-bold tracking-[0.15em] text-[#E4E4F0] uppercase transition hover:border-[#8B8B99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FE4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518]"
              >
                <span className="h-3 w-3 bg-[#E4E4F0]" />
                Stop
              </button>
            </div>
          )}

          {phase === "transcribing" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Loader2 className="size-8 animate-spin text-[#7B3FE4]" aria-hidden />
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-[#7B3FE4] uppercase font-mono">
                  Transcribing
                </p>
                <p className="mt-1 text-sm text-[#8B8B99]">
                  Sending audio to Groq Whisper.
                </p>
              </div>
            </div>
          )}

          {phase === "generating" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="relative flex size-12 items-center justify-center">
                <Loader2 className="size-12 animate-spin text-[#7B3FE4]" aria-hidden />
                <FileText className="pointer-events-none absolute size-5 text-[#E4E4F0]" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-[#7B3FE4] uppercase font-mono">
                  Generating Estimate
                </p>
                <p className="mt-1 text-sm text-[#8B8B99]">
                  Llama is building line items and totals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-800 bg-[#1A0E0E] px-4 py-3">
          <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase font-mono">
            Error
          </span>
          <p className="mt-1 text-sm text-red-300">{error}</p>
        </div>
      )}

      {busy && (
        <p className="text-center text-[10px] tracking-widest text-[#8B8B99] uppercase font-mono">
          Keep this tab open until processing completes.
        </p>
      )}

      {estimate && phase === "idle" && !error && (
        <EstimateTable
          estimate={estimate}
          transcript={transcript ?? undefined}
        />
      )}
    </div>
  );
}
