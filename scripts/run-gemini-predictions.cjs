#!/usr/bin/env node
/**
 * run-gemini-predictions.cjs
 *
 * Reads a Google Gemini API key (and optional model name) from a local
 * secrets file, runs every assessment item in
 * src/app/data/generatedAssessmentItems.json through Gemini, and writes:
 *   - Screening results (5 dimensions: cefrFit, distractorStrength,
 *     clarity, fairness, similarity — each Pass/Review/Fail with rationale)
 *   - Difficulty prediction with Oxford-level scoring:
 *       * oxfordTestOfEnglishScore (0–180, the OTE band scale)
 *       * cefrLevel (A1–C2, derived from the OTE band)
 *       * difficulty (Very Easy / Easy / Medium / Hard / Very Hard)
 *       * irtParameters (b, a, c) on the standard logit scale
 *       * confidence (0–100)
 *
 * Secrets file (default: ./secrets.json) — supports several shapes,
 * e.g. any of the following work:
 *   { "gemini": { "apiKey": "…", "model": "gemini-2.5-pro" } }
 *   { "gemini.apiKey": "…", "gemini.model": "gemini-2.5-pro" }
 *   { "GEMINI_API_KEY": "…", "GEMINI_MODEL": "gemini-2.5-pro" }
 *
 * Environment variable overrides:
 *   GEMINI_API_KEY, GEMINI_MODEL, GEMINI_SECRETS_FILE
 *
 * Usage:
 *   node scripts/run-gemini-predictions.cjs                       # all items
 *   node scripts/run-gemini-predictions.cjs --limit 3             # first 3
 *   node scripts/run-gemini-predictions.cjs --ids ITMBK-RDG-A2-001,ITMBK-LST-B1-007
 *   node scripts/run-gemini-predictions.cjs --out my-results.json
 *   node scripts/run-gemini-predictions.cjs --concurrency 3       # parallel calls
 */

const fs = require("node:fs");
const path = require("node:path");

// ---------- arg parsing ----------
const args = process.argv.slice(2);
const getArg = (name, fallback = undefined) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return args[i + 1];
};
const hasFlag = (name) => args.includes(`--${name}`);

const SECRETS_FILE = getArg("secrets", process.env.GEMINI_SECRETS_FILE || "secrets.json");
const SOURCE_FILE = getArg("source", null); // auto-detect if not provided
const OUT_FILE = getArg("out", path.join("src", "app", "data", "geminiPredictions.json"));
const LIMIT = getArg("limit") ? Number(getArg("limit")) : null;
const ID_FILTER = getArg("ids") ? new Set(getArg("ids").split(",").map((s) => s.trim())) : null;
const CONCURRENCY = Math.max(1, Number(getArg("concurrency", "2")));
const MAX_RETRIES = Math.max(0, Number(getArg("retries", "4")));
const RESUME = hasFlag("resume"); // skip ids already present in OUT_FILE
const DRY_RUN = hasFlag("dry-run");

// ---------- secrets loading ----------
function getNested(obj, dotted) {
  return dotted.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function loadSecrets(file) {
  if (!fs.existsSync(file)) {
    if (process.env.GEMINI_API_KEY) {
      return { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL };
    }
    throw new Error(
      `Secrets file not found at "${file}". Copy secrets.example.json to secrets.json and add your Google Gemini API key, or set GEMINI_API_KEY.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(file, "utf8"));

  const apiKey =
    getNested(raw, "gemini.apiKey") ||
    raw["gemini.apiKey"] ||
    getNested(raw, "gemini.api_key") ||
    raw["gemini.api_key"] ||
    raw.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY;

  const model =
    getNested(raw, "gemini.model") ||
    raw["gemini.model"] ||
    raw.GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-pro";

  if (!apiKey || apiKey === "YOUR_GOOGLE_GEMINI_API_KEY_HERE") {
    throw new Error(`No Gemini API key found in ${file}. Set gemini.apiKey (or GEMINI_API_KEY env var).`);
  }

  return { apiKey, model };
}

// ---------- Oxford / CEFR helpers ----------
// Oxford Test of English (OTE) score → CEFR mapping (publicly documented bands):
//   A2: 21–50, B1: 51–80, B2: 81–110, C1: 111–140, C2: 141–170, (max 180)
// We use the same band edges to derive CEFR from a numeric Oxford score.
function oxfordScoreToCEFR(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  if (score < 21) return "A1";
  if (score <= 50) return "A2";
  if (score <= 80) return "B1";
  if (score <= 110) return "B2";
  if (score <= 140) return "C1";
  return "C2";
}

// ---------- source loading + normalization ----------
// We support two source shapes used in this repo:
//   1) src/app/data/generatedAssessmentItems.json  -> { items: [ AssessmentItem ] }
//   2) src/app/data/questions.json                 -> { questions: [ Question ] }
function loadSource(explicitPath) {
  const candidates = explicitPath
    ? [explicitPath]
    : [
        path.join("src", "app", "data", "questions.json"),
        path.join("src", "app", "data", "generatedAssessmentItems.json"),
      ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const items = Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.questions)
        ? raw.questions
        : Array.isArray(raw)
          ? raw
          : null;
    if (items && items.length) {
      return { path: p, items: items.map(normalizeItem) };
    }
  }
  throw new Error(
    `No source dataset found. Tried: ${candidates.join(", ")}. Pass --source <path>.`,
  );
}

function normalizeItem(raw) {
  // Already in the AssessmentItem shape?
  if (raw.content !== undefined || raw.passage !== undefined || raw.sourceData) {
    return {
      id: raw.id,
      title: raw.title,
      skill: raw.skill,
      itemType: raw.itemType,
      level: raw.level,
      subSkill: raw.subSkill,
      contentDomain: raw.contentDomain,
      cognitiveLevel: raw.cognitiveLevel,
      instructions: raw.sourceData?.instructions || raw.instructions,
      passage: raw.passage,
      passageTitle: raw.passageTitle,
      audioTitle: raw.audioTitle,
      audioTranscript: undefined,
      imageTitle: raw.imageTitle,
      imageAltText: raw.imageAltText,
      stem: raw.content,
      options: raw.options,
      rubric: raw.rubric,
      correctAnswer: raw.sourceData?.correctAnswer,
      sampleAnswer: raw.sourceData?.sampleAnswer,
      followUpQuestions: raw.followUpQuestions,
    };
  }

  // questions.json shape -> skillDetails.{reading|listening|writing|speaking}
  const sd = raw.skillDetails || {};
  const r = sd.reading || {};
  const l = sd.listening || {};
  const w = sd.writing || {};
  const s = sd.speaking || {};
  return {
    id: raw.id,
    title: r.passageTitle || l.audioTitle || w.imageTitle || s.passageTitle || raw.topic,
    skill: raw.skill,
    itemType: raw.questionType,
    level: raw.level,
    subSkill: raw.subSkill || raw.skillTag,
    contentDomain: raw.contentDomain || raw.topic,
    cognitiveLevel: raw.cognitiveLevel,
    instructions: r.instructions || l.instructions || w.instructions || s.instructions,
    passage: r.passageText || s.passage,
    passageTitle: r.passageTitle || s.passageTitle,
    audioTitle: l.audioTitle,
    audioTranscript: l.transcript,
    audioContext: l.context,
    imageTitle: w.imageTitle,
    imageAltText: w.imageAltText,
    writingPromptContext: w.promptContext,
    stem: raw.prompt,
    options: raw.options,
    rubric: w.rubric || s.rubric,
    correctAnswer: raw.correctAnswer,
    sampleAnswer: w.sampleAnswer || s.sampleAnswer,
    followUpQuestions: s.followUpQuestions,
  };
}

// ---------- prompt construction ----------
function buildPrompt(item) {
  // Strip noisy/irrelevant fields and pre-existing predictions so we get a
  // genuinely fresh score from the model.
  const itemForModel = {
    id: item.id,
    title: item.title,
    skill: item.skill,
    itemType: item.itemType,
    targetCEFRLevel: item.level,
    subSkill: item.subSkill,
    contentDomain: item.contentDomain,
    cognitiveLevel: item.cognitiveLevel,
    instructions: item.instructions,
    passage: item.passage,
    passageTitle: item.passageTitle,
    audioTitle: item.audioTitle,
    audioContext: item.audioContext,
    audioTranscript: item.audioTranscript,
    imageTitle: item.imageTitle,
    imageAltText: item.imageAltText,
    writingPromptContext: item.writingPromptContext,
    stem: item.stem,
    options: item.options,
    rubric: item.rubric,
    correctAnswer: item.correctAnswer,
    sampleAnswer: item.sampleAnswer,
    followUpQuestions: item.followUpQuestions,
  };

  return [
    "You are an expert language assessment psychometrician for Oxford University Press.",
    "For the assessment item below, do TWO independent tasks and return ONE JSON object.",
    "",
    "TASK 1 — Screening (5 dimensions). For each dimension return Pass | Review | Fail and a one-sentence rationale:",
    "  - cefrFit: does the item's true difficulty match its declared targetCEFRLevel?",
    "  - distractorStrength: are distractors plausible and functional? (For non-MCQ items, judge whether the expected response set is well-constrained; return Pass if not applicable.)",
    "  - clarity: is the stem/instructions unambiguous with a single defensible interpretation?",
    "  - fairness: is the content free of cultural, gender, regional or other bias that could disadvantage a group?",
    "  - similarity: based on the surface content alone, does this look like a high-exposure / generic prompt likely to overlap with public materials? (Best-effort.)",
    "",
    "TASK 2 — Difficulty prediction with OXFORD LEVEL SCORING:",
    "  - oxfordTestOfEnglishScore: integer 0–180 on the Oxford Test of English scale.",
    "      Bands: A1<21, A2 21–50, B1 51–80, B2 81–110, C1 111–140, C2 141–170 (max 180).",
    "  - cefrLevel: A1 | A2 | B1 | B2 | C1 | C2  (must be consistent with the Oxford score).",
    "  - difficulty: one of Very Easy | Easy | Medium | Hard | Very Hard (relative to the item's targetCEFRLevel).",
    "  - irtParameters: { b: number (logit, typically -3..3), a: number (0.5..2.5), c: number (0..0.35 for MCQ, else 0) }",
    "  - confidence: integer 0–100 — how confident you are in the prediction.",
    "  - rationale: one short sentence explaining the difficulty.",
    "",
    "Respond with ONLY a JSON object matching exactly this schema (no markdown, no commentary):",
    "{",
    '  "screening": {',
    '    "cefrFit":            { "result": "Pass|Review|Fail", "rationale": "..." },',
    '    "distractorStrength": { "result": "Pass|Review|Fail", "rationale": "..." },',
    '    "clarity":            { "result": "Pass|Review|Fail", "rationale": "..." },',
    '    "fairness":           { "result": "Pass|Review|Fail", "rationale": "..." },',
    '    "similarity":         { "result": "Pass|Review|Fail", "rationale": "..." }',
    "  },",
    '  "difficultyPrediction": {',
    '    "oxfordTestOfEnglishScore": 0,',
    '    "cefrLevel": "A1",',
    '    "difficulty": "Medium",',
    '    "irtParameters": { "b": 0.0, "a": 1.0, "c": 0.0 },',
    '    "confidence": 0,',
    '    "rationale": "..."',
    "  }",
    "}",
    "",
    "ITEM:",
    "```json",
    JSON.stringify(itemForModel, null, 2),
    "```",
  ].join("\n");
}

// ---------- Gemini call (with retry/backoff for 429/5xx/transient) ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGeminiOnce({ apiKey, model }, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 300)}`);
    err.status = res.status;
    err.retryable = res.status === 429 || res.status >= 500;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("") || "";
  if (!text) {
    const err = new Error(`Empty response from Gemini: ${JSON.stringify(data).slice(0, 300)}`);
    err.retryable = true;
    throw err;
  }

  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const err = new Error(`Failed to parse JSON from Gemini.\nRaw: ${cleaned.slice(0, 500)}`);
    err.retryable = true;
    throw err;
  }
}

async function callGemini(secrets, prompt) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGeminiOnce(secrets, prompt);
    } catch (err) {
      lastErr = err;
      if (!err.retryable || attempt === MAX_RETRIES) throw err;
      const backoff = Math.min(60000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

// ---------- per-item processing ----------
async function processItem(secrets, item) {
  const prompt = buildPrompt(item);

  if (DRY_RUN) {
    return { id: item.id, dryRun: true, promptPreview: prompt.slice(0, 400) + "…" };
  }

  const parsed = await callGemini(secrets, prompt);

  // Normalize and cross-check Oxford ↔ CEFR consistency.
  const oteScore = Number(parsed?.difficultyPrediction?.oxfordTestOfEnglishScore);
  const derivedCEFR = oxfordScoreToCEFR(oteScore);
  const reportedCEFR = parsed?.difficultyPrediction?.cefrLevel;
  const cefrConsistent = derivedCEFR == null || derivedCEFR === reportedCEFR;

  return {
    id: item.id,
    title: item.title,
    skill: item.skill,
    itemType: item.itemType,
    declaredLevel: item.level,
    screening: parsed.screening,
    difficultyPrediction: {
      ...parsed.difficultyPrediction,
      derivedCEFRFromOxfordScore: derivedCEFR,
      cefrConsistent,
    },
  };
}

// ---------- simple concurrency runner with onResult callback ----------
async function runWithConcurrency(items, limit, worker, onResult) {
  const results = [];
  let cursor = 0;
  let completed = 0;
  async function next() {
    while (cursor < items.length) {
      const idx = cursor++;
      const item = items[idx];
      const t0 = Date.now();
      let entry;
      try {
        const r = await worker(item);
        entry = { ok: true, ...r };
      } catch (err) {
        entry = { ok: false, id: item.id, error: err.message };
      }
      results[idx] = entry;
      completed++;
      const status = entry.ok ? "ok" : "FAIL";
      const tail = entry.ok ? "" : ` — ${entry.error}`;
      console.log(`[${completed}/${items.length}] ${item.id} … ${status} (${Date.now() - t0}ms)${tail}`);
      if (onResult) onResult(results);
    }
  }
  await Promise.all(Array.from({ length: limit }, next));
  return results;
}

// ---------- main ----------
(async () => {
  const secrets = loadSecrets(SECRETS_FILE);
  const source = loadSource(SOURCE_FILE);

  console.log(`Using Gemini model: ${secrets.model}`);
  console.log(`Secrets file:       ${SECRETS_FILE}`);
  console.log(`Source dataset:     ${source.path} (${source.items.length} items)`);
  console.log(`Output file:        ${OUT_FILE}`);

  let items = source.items;
  if (ID_FILTER) items = items.filter((i) => ID_FILTER.has(i.id));

  // Resume: skip items already present in OUT_FILE.
  let priorResults = [];
  if (RESUME && fs.existsSync(OUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
      priorResults = Array.isArray(existing.results) ? existing.results : [];
      const done = new Set(priorResults.map((r) => r.id));
      const before = items.length;
      items = items.filter((i) => !done.has(i.id));
      console.log(`Resume: ${priorResults.length} already done, ${before - items.length} skipped, ${items.length} remaining.`);
    } catch (e) {
      console.warn(`Could not read existing output for resume: ${e.message}`);
    }
  }

  if (LIMIT) items = items.slice(0, LIMIT);

  console.log(`Processing ${items.length} item(s) with concurrency=${CONCURRENCY}, retries=${MAX_RETRIES}${DRY_RUN ? " (DRY RUN)" : ""}\n`);

  const startedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const writeSnapshot = (results, isFinal) => {
    const successes = [...priorResults, ...results.filter((r) => r?.ok).map(({ ok, ...rest }) => rest)];
    const failures = results.filter((r) => r && !r.ok);
    const snapshot = {
      generatedAt: new Date().toISOString(),
      startedAt,
      finishedAt: isFinal ? new Date().toISOString() : null,
      model: secrets.model,
      source: source.path,
      scoringScheme: {
        name: "Oxford Test of English (OTE)",
        scale: "0-180",
        cefrBands: { A1: "<21", A2: "21-50", B1: "51-80", B2: "81-110", C1: "111-140", C2: "141-170" },
      },
      totals: {
        sourceTotal: source.items.length,
        processed: successes.length + failures.length,
        succeeded: successes.length,
        failed: failures.length,
      },
      failures,
      results: successes,
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2));
  };

  let pendingWrite = false;
  let latestResults = [];
  const scheduleWrite = (results) => {
    latestResults = results;
    if (pendingWrite) return;
    pendingWrite = true;
    setTimeout(() => {
      pendingWrite = false;
      try { writeSnapshot(latestResults, false); } catch (e) { console.warn(`snapshot write failed: ${e.message}`); }
    }, 1000); // throttle to once/sec
  };

  // Also flush on Ctrl-C / SIGTERM so we keep partial progress.
  const flushAndExit = (sig) => {
    try { writeSnapshot(latestResults, true); } catch (_) {}
    console.log(`\nReceived ${sig}, wrote snapshot with ${latestResults.filter((r) => r?.ok).length} completed item(s). Exiting.`);
    process.exit(130);
  };
  process.on("SIGINT", () => flushAndExit("SIGINT"));
  process.on("SIGTERM", () => flushAndExit("SIGTERM"));

  let results;
  try {
    results = await runWithConcurrency(items, CONCURRENCY, (item) => processItem(secrets, item), (live) => scheduleWrite(live));
  } finally {
    writeSnapshot(results || latestResults, true);
  }

  const successes = results.filter((r) => r?.ok);
  const failures = results.filter((r) => r && !r.ok);

  console.log(`\nDone. Wrote ${OUT_FILE}`);
  console.log(`  this run: succeeded=${successes.length}, failed=${failures.length}`);
  console.log(`  total in file: ${successes.length + priorResults.length}/${source.items.length}`);
  if (failures.length) process.exitCode = 1;
})().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
