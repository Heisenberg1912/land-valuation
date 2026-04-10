import { z } from "zod";
import { CATEGORY_ROWS } from "./category-data";
import { AdvancedResultSchema, BaseResultSchema } from "./schema";

type BaseResult = z.infer<typeof BaseResultSchema>;

type MetaInput = {
  location?: string;
  projectType?: string;
  scale?: string;
  constructionType?: string;
  note?: string;
  language?: string;
};

function pickCategoryRow(projectType?: string) {
  if (!projectType) return CATEGORY_ROWS[0];
  const target = projectType.toLowerCase();
  return (
    CATEGORY_ROWS.find((row) => row.Category.toLowerCase().includes(target) || row.Typology.toLowerCase().includes(target)) ??
    CATEGORY_ROWS[0]
  );
}

function stagePreset(meta: MetaInput) {
  const note = meta.note?.toLowerCase() ?? "";
  const scale = meta.scale?.toLowerCase() ?? "";

  if (note.includes("complete") || note.includes("completed")) {
    return { status: "completed" as const, stage: "Completed" as const, progress: 100, hoursRemaining: 0 };
  }
  if (scale.includes("large")) {
    return { status: "under_construction" as const, stage: "Foundation" as const, progress: 18, hoursRemaining: 1960 };
  }
  if (scale.includes("low")) {
    return { status: "under_construction" as const, stage: "Finishing" as const, progress: 83, hoursRemaining: 420 };
  }
  if (scale.includes("high")) {
    return { status: "under_construction" as const, stage: "Structure" as const, progress: 36, hoursRemaining: 1680 };
  }
  return { status: "under_construction" as const, stage: "Services" as const, progress: 64, hoursRemaining: 880 };
}

function scopeForStage(stage: BaseResult["stage_of_construction"]) {
  switch (stage) {
    case "Completed":
      return {
        stages_completed: ["Planning", "Foundation", "Structure", "Services", "Finishing"] as BaseResult["scope"]["stages_completed"],
        stages_left: [] as BaseResult["scope"]["stages_left"],
        dependencies: [] as BaseResult["scope"]["dependencies"]
      };
    case "Finishing":
      return {
        stages_completed: ["Planning", "Foundation", "Structure", "Services"] as BaseResult["scope"]["stages_completed"],
        stages_left: ["Completed"] as BaseResult["scope"]["stages_left"],
        dependencies: ["Finishing"] as BaseResult["scope"]["dependencies"]
      };
    case "Services":
      return {
        stages_completed: ["Planning", "Foundation", "Structure"] as BaseResult["scope"]["stages_completed"],
        stages_left: ["Finishing", "Completed"] as BaseResult["scope"]["stages_left"],
        dependencies: ["Services", "Finishing"] as BaseResult["scope"]["dependencies"]
      };
    case "Structure":
      return {
        stages_completed: ["Planning", "Foundation"] as BaseResult["scope"]["stages_completed"],
        stages_left: ["Services", "Finishing", "Completed"] as BaseResult["scope"]["stages_left"],
        dependencies: ["Structure", "Services"] as BaseResult["scope"]["dependencies"]
      };
    default:
      return {
        stages_completed: ["Planning"] as BaseResult["scope"]["stages_completed"],
        stages_left: ["Structure", "Services", "Finishing", "Completed"] as BaseResult["scope"]["stages_left"],
        dependencies: ["Foundation", "Structure"] as BaseResult["scope"]["dependencies"]
      };
  }
}

export function createMockBaseResult(meta: MetaInput = {}) {
  const preset = stagePreset(meta);
  const row = pickCategoryRow(meta.projectType);
  const manpower = preset.hoursRemaining === 0 ? 0 : Math.round(preset.hoursRemaining * 0.62);
  const machinery = preset.hoursRemaining === 0 ? 0 : Math.round(preset.hoursRemaining * 0.38);
  const locationText = meta.location?.trim() ? ` for ${meta.location.trim()}` : "";

  return BaseResultSchema.parse({
    project_status: preset.status,
    stage_of_construction: preset.stage,
    progress_percent: preset.progress,
    timeline: {
      hours_remaining: preset.hoursRemaining,
      manpower_hours: manpower,
      machinery_hours: machinery
    },
    category_matrix: {
      Category: row.Category,
      Typology: row.Typology,
      Style: row.Style,
      ClimateAdaptability: row.ClimateAdaptability,
      Terrain: row.Terrain,
      SoilType: row.SoilType,
      MaterialUsed: row.MaterialUsed,
      InteriorLayout: row.InteriorLayout,
      RoofType: row.RoofType,
      Exterior: row.Exterior,
      AdditionalFeatures: row.AdditionalFeatures,
      Sustainability: row.Sustainability
    },
    scope: scopeForStage(preset.stage),
    notes: [
      `Local dev mock analysis generated${locationText}.`,
      `Project type bias: ${meta.projectType || "Residential"}.`,
      `Scale hint used: ${meta.scale || "Mid-rise"}.`,
      `Construction type hint used: ${meta.constructionType || "RCC"}.`
    ]
  });
}

export function createMockAdvancedResult(base: BaseResult) {
  const delayed = base.stage_of_construction === "Foundation" || base.progress_percent < 25;
  const ahead = base.stage_of_construction === "Finishing" || base.progress_percent > 75;

  return AdvancedResultSchema.parse({
    progress_vs_ideal: delayed ? "Delayed" : ahead ? "Ahead" : "On Track",
    timeline_drift: delayed ? "+9%" : ahead ? "-4%" : "On Track (±3%)",
    cost_risk_signals: delayed ? ["Material pricing", "Labor pacing", "Weather exposure"] : ["Trade overlap", "Labor pacing", "Quality checks"],
    recommendations: delayed
      ? [
          "Re-sequence material deliveries to protect the critical path.",
          "Lock labor allocation for the next two work packages.",
          "Review weather-sensitive tasks before pouring or facade work."
        ]
      : [
          "Keep trade handoffs tightly scheduled to avoid idle time.",
          "Validate installed quantities against the visual progress trend.",
          "Inspect finishes early to reduce downstream rework."
        ]
  });
}
