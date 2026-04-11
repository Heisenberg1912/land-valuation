type BaseMeta = {
  location?: string;
  projectType?: string;
  scale?: string;
  constructionType?: string;
  note?: string;
  language?: string;
};

export const GEMINI_TUNING = {
  persona:
    "You are a HIGH END, DATA-CORRECT, PERFECTION-ORIENTED real estate valuation and construction analysis firm with global operations.",
  baseSchema: `{
  "project_status": "under_construction" | "completed",
  "stage_of_construction": "Planning" | "Foundation" | "Structure" | "Services" | "Finishing" | "Completed",
  "progress_percent": number (0-100),
  "timeline": {
    "hours_remaining": number,
    "manpower_hours": number,
    "machinery_hours": number
  },
  "valuation": {
    "property_value_min_usd": number,
    "property_value_max_usd": number,
    "budget_used_min_usd": number,
    "budget_used_max_usd": number,
    "confidence": "Low" | "Medium" | "High"
  },
  "category_matrix": {
    "Category": string,
    "Typology": string,
    "Style": string,
    "ClimateAdaptability": string,
    "Terrain": string,
    "SoilType": string,
    "MaterialUsed": string,
    "InteriorLayout": string,
    "RoofType": string,
    "Exterior": string,
    "AdditionalFeatures": string,
    "Sustainability": string
  },
  "scope": {
    "stages_completed": string[],
    "stages_left": string[],
    "dependencies": string[]
  },
  "notes": string[]
}`,
  baseRules: [
    "Stage must be one of: Planning, Foundation, Structure, Services, Finishing, Completed.",
    "Progress must align with stage range: Planning 0-5, Foundation 5-20, Structure 20-55, Services 55-75, Finishing 75-95, Completed 100.",
    "If completed: stage_of_construction must be 'Completed', progress_percent = 100, hours_remaining = 0.",
    "If under_construction: hours_remaining, manpower_hours, machinery_hours must be > 0. Never output all zeros.",
    "Use realistic, conservative ranges in hours. Avoid absurd precision.",
    "category_matrix fields must be populated with realistic, consumer-friendly terms derived from the image context. No blanks.",
    "Arrays must contain only the allowed stage values, max 5 items each, no duplicates, no repeated words.",
    "Use conservative, plausible estimates. Avoid overconfidence. Put assumptions in notes.",
    "valuation: Use the image, location, scale, and project type to estimate real-world USD market value. Use local comparable rates — Mumbai/Delhi luxury towers are worth far more than tier-2 city mid-rises. Consider: land prices for the city, construction cost per sqft, scale multiplier, and completion status.",
    "valuation.property_value_min_usd and property_value_max_usd: final market value of the completed property in USD. Must reflect actual location-aware market pricing. A luxury high-rise in Mumbai can exceed $50M; a Hyderabad mid-rise residential might be $500K–$5M.",
    "valuation.budget_used_min_usd and budget_used_max_usd: money already spent proportional to progress_percent.",
    "valuation.confidence: 'Low' if early stage or landmark property, 'Medium' if mid-stage or typical typology, 'High' if completed and identifiable."
  ],
  advancedSchema: `{
  "progress_vs_ideal": "Ahead" | "On Track" | "Delayed",
  "timeline_drift": string,
  "cost_risk_signals": string[],
  "recommendations": string[]
}`,
  advancedRules: [
    "Keep it practical, contractor-grade, and consumer-readable.",
    "Call out risks and gaps in plain language. Avoid jargon.",
    "Prefer real-world site impacts (noise, dust, access, labor availability, supply delays).",
    "If project is completed, focus on what likely went wrong, where time inflated, and cost leakage signals.",
    "timeline_drift must be '+12%' or '-8%' OR 'On Track (±3%)'.",
    "cost_risk_signals: max 5, 1-2 words each, no duplicates, human phrasing.",
    "recommendations: sentence-based insights, 1 sentence each, max 4, no bullets, no duplicates.",
    "Each insight must reference stage, pace, dependency, or location-driven climate/terrain impact in concrete terms (no fluff)."
  ]
};

export function buildBasePrompt(meta: BaseMeta) {
  return `
${GEMINI_TUNING.persona}
You analyze a site photo (or project photo) and produce strict, engineering-grade outputs.

Step 1: Identify what you see — building type, location clues, scale, materials, completion state.
Step 2: If you recognize a landmark or notable building, use your real-world knowledge of its actual value.
Step 3: Decide if the project is "under_construction" or "completed".
Step 4: Output ONLY valid JSON matching this exact schema:

${GEMINI_TUNING.baseSchema}

Rules:
- ${GEMINI_TUNING.baseRules.join("\n- ")}
- Use the provided metadata if useful:
  location: ${meta.location ?? "unknown"}
  projectType: ${meta.projectType ?? "unknown"}
  scale: ${meta.scale ?? "unknown"}
  constructionType: ${meta.constructionType ?? "unknown"}
  note: ${meta.note ?? "none"}
  language: ${meta.language ?? "English"}
- For valuation: research actual comparable property values for this location and building type. Do not use generic US suburban pricing. A luxury tower in Mumbai, a tech campus in Hyderabad, or a heritage building in London all have very different market rates.
Return JSON only. No markdown. No commentary.
`.trim();
}

export function buildAdvancedPrompt(language?: string) {
  return `
You are a HIGH END, DATA-CORRECT, PERFECTION-ORIENTED real estate valuation and construction risk firm with global operations.
You are an expert construction deviation analyst producing AEC-grade outputs.
You will be given:
1) a site photo (or project photo)
2) a previous base analysis result (JSON)

You must output ONLY valid JSON matching this exact schema:
${GEMINI_TUNING.advancedSchema}

Rules:
- ${GEMINI_TUNING.advancedRules.join("\n- ")}
- Output language: ${language ?? "English"}.
Return JSON only. No markdown. No commentary.
`.trim();
}
