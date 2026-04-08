import { EstimateRecorder } from "@/components/estimate-recorder";
import { SavedEstimates } from "@/components/saved-estimates";

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0E0E11]">
      <header className="border-b border-[#22222A] bg-[#151518]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <img
            src="/voltvocal-logo.png"
            alt="VoltVocal"
            className="h-9 w-auto"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.2em] text-[#E4E4F0] uppercase">
              VoltVocal
            </span>
            <span className="text-[10px] tracking-[0.15em] text-[#8B8B99] uppercase">
              Field Estimating System
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="h-2 w-2 bg-[#7B3FE4]" />
            <span className="text-[10px] tracking-widest text-[#7B3FE4] uppercase font-mono">
              Online
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 gap-10">
        <section className="border-l-2 border-[#7B3FE4] pl-4">
          <h2 className="text-xs font-bold tracking-[0.25em] text-[#7B3FE4] uppercase">
            Input
          </h2>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[#E4E4F0]">
            Voice Capture
          </p>
          <p className="mt-1 text-sm text-[#8B8B99]">
            Record a site walkthrough. Groq/Whisper transcribes the audio,
            Llama builds structured line items and totals.
          </p>
        </section>

        <EstimateRecorder />

        <SavedEstimates />
      </main>
    </div>
  );
}
