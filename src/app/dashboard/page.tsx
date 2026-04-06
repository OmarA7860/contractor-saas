import { ClipboardList } from "lucide-react";
import { EstimateRecorder } from "@/components/estimate-recorder";

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ClipboardList className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              JobSite Estimate
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Voice notes → professional estimates
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <section className="w-full space-y-2 text-center sm:text-left">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Record what you see on site. Groq transcribes the audio and Llama
            builds a structured estimate you can refine or export later.
          </p>
        </section>

        <div className="mt-10 flex w-full justify-center">
          <EstimateRecorder />
        </div>
      </main>
    </div>
  );
}
