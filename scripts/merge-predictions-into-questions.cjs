#!/usr/bin/env node
/**
 * Merge gemini predictions into src/app/data/questions.json by item id.
 *
 * - Reads src/app/data/geminiPredictions.json (output of run-gemini-predictions.cjs)
 * - Reads src/app/data/questions.json
 * - Writes back questions.json with screening + confidence + IRT updated
 * - Backs up the original to src/app/data/questions.preMerge.json (overwritten each run)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'src/app/data/questions.json');
const PREDICTIONS_PATH = path.join(ROOT, 'src/app/data/geminiPredictions.json');
const BACKUP_PATH = path.join(ROOT, 'src/app/data/questions.preMerge.json');

const VALID_VERDICTS = new Set(['Pass', 'Review', 'Fail']);
const VALID_DIFFICULTY = new Set(['Easy', 'Medium', 'Hard', 'Very Easy', 'Very Hard']);
const SCREENING_DIMS = ['cefrFit', 'distractorStrength', 'clarity', 'fairness', 'similarity'];

const normVerdict = (v) => (VALID_VERDICTS.has(v) ? v : undefined);
const normDifficulty = (v) => (VALID_DIFFICULTY.has(v) ? v : undefined);
const today = new Date().toISOString().slice(0, 10);

const predictionsFile = JSON.parse(fs.readFileSync(PREDICTIONS_PATH, 'utf8'));
const questionsFile = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));

const predictionsById = new Map();
for (const r of predictionsFile.results || []) {
  if (r && r.id) predictionsById.set(r.id, r);
}

if (!Array.isArray(questionsFile.questions)) {
  throw new Error('questions.json: expected { questions: [...] }');
}

fs.writeFileSync(BACKUP_PATH, JSON.stringify(questionsFile, null, 2));

let merged = 0;
let missing = 0;
const skippedIds = [];

for (const q of questionsFile.questions) {
  const pred = predictionsById.get(q.id);
  if (!pred) {
    missing++;
    skippedIds.push(q.id);
    continue;
  }

  // Screening
  const screening = { ...(q.screening || {}) };
  for (const dim of SCREENING_DIMS) {
    const v = normVerdict(pred.screening?.[dim]?.result);
    if (v) screening[dim] = v;
  }
  q.screening = screening;

  // Difficulty
  const dp = pred.difficultyPrediction || {};
  if (typeof dp.confidence === 'number') q.confidence = dp.confidence;
  const diff = normDifficulty(dp.difficulty);
  if (diff) q.difficulty = diff;

  // IRT
  const existingIrt = q.irtParameters || {};
  const irt = dp.irtParameters || {};
  q.irtParameters = {
    ...existingIrt,
    ...(typeof irt.b === 'number' ? { b: irt.b } : {}),
    ...(typeof irt.a === 'number' ? { a: irt.a } : {}),
    ...(typeof irt.c === 'number' ? { c: irt.c } : {}),
    modelVersion: predictionsFile.model || 'gemini-2.5-pro',
    predictionDate: today,
    predictedByAI: true,
  };

  q.aiModelVersion = predictionsFile.model || 'gemini-2.5-pro';
  q.aiPredictionDate = today;

  merged++;
}

fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questionsFile, null, 2));

console.log(`Backed up original to ${path.relative(ROOT, BACKUP_PATH)}`);
console.log(`Merged predictions into ${merged}/${questionsFile.questions.length} item(s).`);
if (missing) {
  console.log(`No prediction found for ${missing} item(s).`);
  if (skippedIds.length <= 10) console.log('  ' + skippedIds.join(', '));
}
