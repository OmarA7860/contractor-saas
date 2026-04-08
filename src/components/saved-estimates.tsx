"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteEstimateAction,
  getEstimatesAction,
} from "@/app/actions/estimate-actions";
import { EstimateTable } from "@/components/estimate-table";
import type { EstimateResult } from "@/types/estimate";

type SavedEstimate = {
  id: string;
  created_at: string;
  total: number;
  notes: string;
  transcript: string;
  line_items: EstimateResult["lineItems"];
};

export function SavedEstimates() {
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getEstimatesAction();
    setLoading(false);
    if (result.ok) {
      setEstimates(result.estimates);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    void fetchEstimates();
  }, [fetchEstimates]);

  async function handleDelete(id: string) {
    const result = await deleteEstimateAction(id);
    if (result.ok) {
      setEstimates((prev) => prev.filter((e) => e.id !== id));
    } else {
      setError(result.error);
    }
  }

  if (loading) {
    return (
      <p className="text-[10px] tracking-widest text-[#8B8B99] uppercase font-mono">
        ● Loading saved estimates…
      </p>
    );
  }

  if (error) {
    return (
      <div className="border border-red-800 bg-[#1A0E0E] px-4 py-3">
        <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase font-mono">
          Error
        </span>
        <p className="mt-1 text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (estimates.length === 0) return null;

  return (
    <section className="w-full space-y-6">
      <div className="border-l-2 border-[#7B3FE4] pl-4">
        <h3 className="text-xs font-bold tracking-[0.25em] text-[#7B3FE4] uppercase">
          Saved
        </h3>
        <p className="mt-1 text-lg font-semibold tracking-tight text-[#E4E4F0]">
          Estimate Log
        </p>
      </div>
      {estimates.map((est) => {
        const estimate: EstimateResult = {
          lineItems: est.line_items,
          total: est.total,
          notes: est.notes,
        };
        return (
          <div key={est.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#22222A]" />
              <span className="text-[10px] font-mono tracking-widest text-[#8B8B99] uppercase">
                {new Date(est.created_at).toLocaleString("en-CA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="h-px flex-1 bg-[#22222A]" />
            </div>
            <EstimateTable
              estimate={estimate}
              transcript={est.transcript}
              onDeleted={() => void handleDelete(est.id)}
            />
          </div>
        );
      })}
    </section>
  );
}
