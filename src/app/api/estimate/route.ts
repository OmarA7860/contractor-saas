import { NextResponse } from "next/server";
import type { EstimateResult } from "@/types/estimate";

export const runtime = "nodejs";
export const maxDuration = 120;

const WHISPER_MODEL = "whisper-large-v3";
const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";

const ESTIMATOR_SYSTEM = `You are an expert construction estimator operating in Expert Mode. Extract items, quantities, and estimated costs from this text. Return a structured JSON list and a total estimate.

Expert Mode (required for every line item):
- For EACH line item you must also output "proRecommendation": a concise "Pro Recommendation" (1–3 sentences) grounded in prevailing US building codes, electrical/plumbing/mechanical practices, OSHA-relevant safety expectations, and common 2026 code-cycle themes (e.g. NEC updates awareness, IRC/IECC where relevant, GFCI/AFCI, egress, ventilation, load calculations where applicable). Tie the advice to that specific scope of work. If jurisdiction is unknown, phrase as generally accepted US practice and note "verify local AHJ". Do not invent citations; refer to requirements descriptively (e.g. "per typical NEC kitchen small-appliance branch requirements") rather than fake section numbers unless you are certain.

Rules:
- Use reasonable regional US labor and material assumptions when prices are not stated; note assumptions briefly in "notes".
- Each line item must include description, quantity, unit, unitPrice, lineTotal, and proRecommendation (lineTotal should equal quantity × unitPrice unless a lump sum is explicit).
- "total" must equal the sum of lineTotals unless you explain a discount/tax in "notes".
- Respond with ONLY valid JSON. No markdown code fences, no commentary outside the JSON.

Required JSON shape:
{
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unit": "string",
      "unitPrice": number,
      "lineTotal": number,
      "proRecommendation": "string"
    }
  ],
  "total": number,
  "notes": "string"
}`;

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw);
}

function normalizeEstimate(raw: unknown): EstimateResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Model returned invalid JSON (expected an object).");
  }
  const o = raw as Record<string, unknown>;
  const items = Array.isArray(o.lineItems) ? o.lineItems : [];
  const lineItems = items.map((row, i) => {
    const r = row as Record<string, unknown>;
    const qty = Number(r.quantity);
    const quantity = Number.isFinite(qty) ? qty : 1;
    const unitPrice = Number(r.unitPrice);
    const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
    const lineTotalRaw = Number(r.lineTotal);
    const lineTotal = Number.isFinite(lineTotalRaw)
      ? lineTotalRaw
      : quantity * safeUnitPrice;
    return {
      description: String(r.description ?? `Line item ${i + 1}`),
      quantity,
      unit: String(r.unit ?? "each"),
      unitPrice: safeUnitPrice,
      lineTotal,
      proRecommendation: String(
        r.proRecommendation ?? r.pro_recommendation ?? "",
      ),
    };
  });
  const totalRaw = Number(o.total);
  const total = Number.isFinite(totalRaw)
    ? totalRaw
    : lineItems.reduce((s, x) => s + x.lineTotal, 0);
  return {
    lineItems,
    total,
    notes: String(o.notes ?? ""),
  };
}

function groqKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  return key;
}

async function transcribeGroq(file: File): Promise<string> {
  const key = groqKey();

  const body = new FormData();
  body.append("file", file, file.name || "recording.webm");
  body.append("model", WHISPER_MODEL);
  body.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq transcription failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { text?: string };
  if (!data.text?.trim()) {
    throw new Error("Transcription returned empty text.");
  }
  return data.text.trim();
}

async function estimateWithGroq(transcript: string): Promise<EstimateResult> {
  const key = groqKey();
  const model = process.env.GROQ_MODEL ?? DEFAULT_CHAT_MODEL;

  const userContent = `Transcript from job-site voice note:\n"""${transcript}"""`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: ESTIMATOR_SYSTEM },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq chat failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("Groq returned no message content.");
  }

  let parsed: unknown;
  try {
    parsed = extractJsonObject(text);
  } catch {
    throw new Error(
      "The model did not return valid JSON. Try recording again with clearer scope and quantities.",
    );
  }
  return normalizeEstimate(parsed);
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { transcript?: unknown };
      const transcript =
        typeof body.transcript === "string" ? body.transcript.trim() : "";
      if (!transcript) {
        return NextResponse.json(
          { error: "Missing or empty transcript." },
          { status: 400 },
        );
      }
      const estimate = await estimateWithGroq(transcript);
      return NextResponse.json({ estimate });
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio");
      if (!(audio instanceof File) || audio.size === 0) {
        return NextResponse.json(
          { error: "Missing audio file (field: audio)." },
          { status: 400 },
        );
      }
      const transcript = await transcribeGroq(audio);
      return NextResponse.json({ transcript });
    }

    return NextResponse.json(
      { error: "Use multipart/form-data with field audio, or JSON with transcript." },
      { status: 415 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed.";
    const status =
      message.includes("not set") || message.includes("GROQ_API_KEY")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
