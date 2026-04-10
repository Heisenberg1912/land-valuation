import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureUsageKey, getUsageState, incrementFreeUse, checkHasPro } from "@/lib/auth";
import { buildBasePrompt } from "@/lib/gemini-tuning";
import { BaseResultSchema } from "@/lib/schema";
import { CATEGORY_ROWS } from "@/lib/category-data";
import { isLocalDevBypass } from "@/lib/dev";
import { createMockBaseResult } from "@/lib/mock-analysis";

const Body = z.object({
  imageDataUrl: z.string().min(20),
  meta: z
    .object({
      location: z.string().optional(),
      projectType: z.string().optional(),
      scale: z.string().optional(),
      constructionType: z.string().optional(),
      note: z.string().optional(),
      language: z.string().optional()
    })
    .default({})
});

const STAGES = ["Planning", "Foundation", "Structure", "Services", "Finishing", "Completed"] as const;
const STAGE_RANGES: Record<(typeof STAGES)[number], { min: number; max: number }> = {
  Planning: { min: 0, max: 5 },
  Foundation: { min: 5, max: 20 },
  Structure: { min: 20, max: 55 },
  Services: { min: 55, max: 75 },
  Finishing: { min: 75, max: 95 },
  Completed: { min: 100, max: 100 }
};

function normalizeStage(value: unknown): (typeof STAGES)[number] {
  if (typeof value !== "string") return "Planning";
  const v = value.toLowerCase();
  if (v.includes("plan")) return "Planning";
  if (v.includes("found")) return "Foundation";
  if (v.includes("struct") || v.includes("frame")) return "Structure";
  if (v.includes("service") || v.includes("mep") || v.includes("electric") || v.includes("plumb")) return "Services";
  if (v.includes("finish") || v.includes("interior") || v.includes("paint")) return "Finishing";
  if (v.includes("complete")) return "Completed";
  return "Structure";
}

function clampProgress(stage: (typeof STAGES)[number], value: number) {
  const range = STAGE_RANGES[stage];
  return Math.min(range.max, Math.max(range.min, value));
}

function uniqStages(value: unknown) {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .map((item) => normalizeStage(item))
    .filter((item) => item !== "Completed");
  return Array.from(new Set(cleaned)).slice(0, 5);
}

function sanitizeBase(input: any, metaProjectType?: string) {
  if (!input || typeof input !== "object") return input;
  const status = input.project_status === "completed" ? "completed" : "under_construction";
  let stage = normalizeStage(input.stage_of_construction);
  let progress = Number.isFinite(input.progress_percent) ? Number(input.progress_percent) : 0;

  if (status === "completed") {
    stage = "Completed";
    progress = 100;
  } else if (stage === "Completed" && progress < 100) {
    stage = "Finishing";
  }

  progress = clampProgress(stage, progress);

  const timeline = input.timeline ?? {};
  let hoursRemaining = status === "completed" ? 0 : Math.max(0, Number(timeline.hours_remaining) || 0);
  let manpowerHours = Math.max(0, Number(timeline.manpower_hours) || 0);
  let machineryHours = Math.max(0, Number(timeline.machinery_hours) || 0);

  if (status !== "completed") {
    const stageDefaults: Record<(typeof STAGES)[number], number> = {
      Planning: 300,
      Foundation: 900,
      Structure: 1500,
      Services: 800,
      Finishing: 600,
      Completed: 0
    };
    if (hoursRemaining === 0 && manpowerHours === 0 && machineryHours === 0) {
      const fallback = stageDefaults[stage] || 600;
      hoursRemaining = fallback;
      manpowerHours = Math.round(fallback * 0.65);
      machineryHours = Math.round(fallback * 0.35);
    } else if (hoursRemaining > 0 && manpowerHours === 0 && machineryHours === 0) {
      manpowerHours = Math.round(hoursRemaining * 0.65);
      machineryHours = Math.round(hoursRemaining * 0.35);
    }
  }

  const cleanField = (value: unknown, fallback: string) => {
    if (typeof value === "string" && value.trim().length) return value.trim();
    return fallback;
  };
  const matrix = input.category_matrix ?? {};
  const findRow = () => {
    const typology = typeof matrix.Typology === "string" ? matrix.Typology.toLowerCase() : "";
    const category = typeof matrix.Category === "string" ? matrix.Category.toLowerCase() : "";
    let match = CATEGORY_ROWS.find((row) => row.Typology.toLowerCase() === typology);
    if (!match && category) {
      match = CATEGORY_ROWS.find((row) => row.Category.toLowerCase() === category);
    }
    if (!match && metaProjectType) {
      const fallbackCategory = metaProjectType.toLowerCase();
      match = CATEGORY_ROWS.find((row) => row.Category.toLowerCase().includes(fallbackCategory));
    }
    return match ?? CATEGORY_ROWS[0];
  };
  const datasetRow = findRow();

  return {
    project_status: status,
    stage_of_construction: stage,
    progress_percent: progress,
    timeline: {
      hours_remaining: hoursRemaining,
      manpower_hours: manpowerHours,
      machinery_hours: machineryHours
    },
    category_matrix: {
      Category: cleanField(matrix.Category, datasetRow.Category),
      Typology: cleanField(matrix.Typology, datasetRow.Typology),
      Style: cleanField(matrix.Style, datasetRow.Style),
      ClimateAdaptability: cleanField(matrix.ClimateAdaptability, datasetRow.ClimateAdaptability),
      Terrain: cleanField(matrix.Terrain, datasetRow.Terrain),
      SoilType: cleanField(matrix.SoilType, datasetRow.SoilType),
      MaterialUsed: cleanField(matrix.MaterialUsed, datasetRow.MaterialUsed),
      InteriorLayout: cleanField(matrix.InteriorLayout, datasetRow.InteriorLayout),
      RoofType: cleanField(matrix.RoofType, datasetRow.RoofType),
      Exterior: cleanField(matrix.Exterior, datasetRow.Exterior),
      AdditionalFeatures: cleanField(matrix.AdditionalFeatures, datasetRow.AdditionalFeatures),
      Sustainability: cleanField(matrix.Sustainability, datasetRow.Sustainability)
    },
    scope: {
      stages_completed: uniqStages(input.scope?.stages_completed),
      stages_left: uniqStages(input.scope?.stages_left),
      dependencies: uniqStages(input.scope?.dependencies)
    },
    notes: Array.isArray(input.notes) ? input.notes.slice(0, 4) : []
  };
}

export async function POST(req: Request) {
  // Check for access code in header
  const accessCode = req.headers.get("x-vitruvi-access-code");

  // Check if user has Pro (via subscription or access code)
  const hasPro = await checkHasPro(accessCode);

  // If not Pro, enforce free tier limits
  if (!hasPro) {
    const { key } = await ensureUsageKey();
    const state = await getUsageState(key);
    if (!state.paid && state.freeUsed >= 3) {
      return NextResponse.json({ error: "PAYWALL", message: "Free limit reached. Please sign in and upgrade." }, { status: 402 });
    }
  }

  const body = Body.parse(await req.json());

  if (isLocalDevBypass()) {
    const base = createMockBaseResult(body.meta);
    return NextResponse.json({ base, usage: { freeUsed: 0, freeRemaining: Infinity, paid: true, hasPro: true, mock: true } });
  }

  const [{ generateVisionContent, toInlineData }] = await Promise.all([import("@/lib/gemini")]);
  const inline = toInlineData(body.imageDataUrl);

  let result;
  try {
    result = await generateVisionContent([{ text: buildBasePrompt(body.meta) }, { inlineData: inline }]);
  } catch (err: any) {
    return NextResponse.json(
      { error: "MODEL_ERROR", message: err?.message ?? "Model request failed." },
      { status: 502 }
    );
  }

  const text = result.response.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    // Attempt to salvage by extracting first JSON object.
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: "BAD_MODEL_OUTPUT", raw: text }, { status: 500 });
    json = JSON.parse(m[0]);
  }

  const sanitized = sanitizeBase(json, body.meta?.projectType);
  const parsed = BaseResultSchema.safeParse(sanitized);
  if (!parsed.success) {
    return NextResponse.json({ error: "SCHEMA_MISMATCH", raw: json, issues: parsed.error.issues }, { status: 500 });
  }

  // Track usage only for non-Pro users
  if (!hasPro) {
    const { key } = await ensureUsageKey();
    const state = await getUsageState(key);
    if (!state.paid) await incrementFreeUse(key);
    const nextState = await getUsageState(key);
    const freeRemaining = nextState.paid ? Infinity : Math.max(0, 3 - nextState.freeUsed);
    return NextResponse.json({ base: parsed.data, usage: { freeUsed: nextState.freeUsed, freeRemaining, paid: nextState.paid, hasPro: false } });
  }

  // Pro user - unlimited usage
  return NextResponse.json({ base: parsed.data, usage: { freeUsed: 0, freeRemaining: Infinity, paid: true, hasPro: true } });
}
