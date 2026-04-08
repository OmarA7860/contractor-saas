"use client";

import { useState } from "react";
import { Download, Save, Trash2 } from "lucide-react";
import { downloadEstimatePdf } from "@/lib/estimate-pdf";
import { saveEstimateAction } from "@/app/actions/estimate-actions";
import { sanitizePlainText } from "@/lib/sanitize-ai-text";
import type { EstimateResult } from "@/types/estimate";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type Props = {
  estimate: EstimateResult;
  companyName?: string;
  transcript?: string;
  onDeleted?: () => void;
};

export function EstimateTable({ estimate, companyName, transcript, onDeleted }: Props) {
  const { lineItems, total, notes } = estimate;
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!transcript) return;
    setIsSaving(true);
    setSaveError(null);
    const result = await saveEstimateAction(transcript, estimate);
    setIsSaving(false);
    if (result.ok) {
      setSaved(true);
    } else {
      setSaveError(result.error);
    }
  }

  return (
    <div className="w-full border border-[#22222A] bg-[#151518]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[#22222A] bg-[#0E0E11] px-4 py-2">
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#8B8B99] uppercase font-mono">
          Estimate Output
        </span>
        <span className="text-[10px] font-mono tracking-widest text-[#7B3FE4] uppercase">
          ● Ready
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#22222A] bg-[#0E0E11] text-[10px] font-bold tracking-[0.2em] uppercase text-[#8B8B99] font-mono">
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Line Total</th>
              <th className="min-w-[220px] px-4 py-3 normal-case tracking-normal">
                Recommendations
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1C22]">
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[#8B8B99] text-sm"
                >
                  No line items returned. Try adding more detail in your recording.
                </td>
              </tr>
            ) : (
              lineItems.map((row, i) => (
                <tr
                  key={`${row.description}-${i}`}
                  className={i % 2 === 0 ? "bg-[#151518]" : "bg-[#0E0E11]"}
                >
                  <td className="max-w-[280px] px-4 py-3 font-medium text-[#E4E4F0]">
                    {sanitizePlainText(row.description)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-[#E4E4F0]">
                    {row.quantity}
                  </td>
                  <td className="px-4 py-3 text-[#B0B0BE]">
                    {sanitizePlainText(row.unit)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-[#E4E4F0]">
                    {money.format(row.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums font-mono text-[#E4E4F0]">
                    {money.format(row.lineTotal)}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-left text-xs leading-relaxed text-[#8B8B99]">
                    {sanitizePlainText(row.proRecommendation).trim() || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#7B3FE4] bg-[#0E0E11]">
              <td colSpan={6} className="px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                  <span className="text-xs font-bold tracking-[0.2em] text-[#8B8B99] uppercase font-mono sm:mr-auto">
                    Total Estimate
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold tabular-nums font-mono text-[#7B3FE4]">
                      {money.format(total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadEstimatePdf(estimate, { companyName })}
                      className="inline-flex items-center gap-2 border border-[#22222A] bg-[#151518] px-3 py-2 text-xs font-bold tracking-[0.1em] text-[#E4E4F0] uppercase transition hover:border-[#7B3FE4] hover:text-[#7B3FE4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FE4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E11]"
                    >
                      <Download className="size-3.5 shrink-0" aria-hidden />
                      Export PDF
                    </button>
                    {transcript && !saved && (
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 border border-[#7B3FE4] bg-[#7B3FE4] px-3 py-2 text-xs font-bold tracking-[0.1em] text-white uppercase transition hover:bg-[#6930cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FE4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E11] disabled:opacity-50"
                      >
                        <Save className="size-3.5 shrink-0" aria-hidden />
                        {isSaving ? "Saving…" : "Save"}
                      </button>
                    )}
                    {transcript && saved && (
                      <span className="text-xs font-bold tracking-[0.1em] text-[#7B3FE4] uppercase font-mono">
                        ✓ Saved
                      </span>
                    )}
                    {onDeleted && (
                      <button
                        type="button"
                        onClick={onDeleted}
                        className="inline-flex items-center gap-2 border border-red-800 bg-[#151518] px-3 py-2 text-xs font-bold tracking-[0.1em] text-red-400 uppercase transition hover:bg-red-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E11]"
                      >
                        <Trash2 className="size-3.5 shrink-0" aria-hidden />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {saveError && (
                  <p className="mt-2 text-right text-xs text-red-400 font-mono">
                    {saveError}
                  </p>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {notes.trim() ? (
        <div className="whitespace-pre-wrap border-t border-[#22222A] bg-[#0E0E11] px-4 py-3 text-sm text-[#8B8B99]">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#8B8B99] uppercase font-mono">
            Notes —{" "}
          </span>
          {sanitizePlainText(notes, { preserveNewlines: true })}
        </div>
      ) : null}
    </div>
  );
}
