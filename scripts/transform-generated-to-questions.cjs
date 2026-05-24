const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.join("src", "app", "data", "generatedAssessmentItems.json");
const targetPath = path.join("src", "app", "data", "generatedQuestions.json");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const items = Array.isArray(source.items) ? source.items : [];

const skillKey = (skill) =>
  ({ Reading: "reading", Listening: "listening", Writing: "writing", Speaking: "speaking" }[skill] || "reading");

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getOptionBasedAnswer = (item) => {
  if (!Array.isArray(item.options)) {
    return null;
  }

  const correctOption = item.options.find((opt) => opt?.correct === true);
  if (!correctOption) {
    return null;
  }

  if (typeof correctOption.label === "string" && correctOption.label.trim()) {
    return { value: correctOption.label.trim(), source: "options.label" };
  }

  if (typeof correctOption.text === "string" && correctOption.text.trim()) {
    return { value: correctOption.text.trim(), source: "options.text" };
  }

  return null;
};

const getSourceBasedAnswer = (item) => {
  if (typeof item.sourceData?.correctAnswer === "string" && item.sourceData.correctAnswer.trim()) {
    return { value: item.sourceData.correctAnswer.trim(), source: "sourceData.correctAnswer" };
  }

  if (item.skill === "Speaking" && typeof item.sourceData?.sampleAnswer === "string" && item.sourceData.sampleAnswer.trim()) {
    return { value: item.sourceData.sampleAnswer.trim(), source: "sourceData.sampleAnswer" };
  }

  return null;
};

const deriveCorrectAnswer = (item) => {
  return (
    getOptionBasedAnswer(item) ||
    getSourceBasedAnswer(item) ||
    (item.itemType === "Essay" || item.itemType === "Speaking"
      ? { value: "Open response (rubric-based scoring)", source: "derived.constructed-response" }
      : { value: "", source: "none" })
  );
};

const buildSkillDetails = (item, answerSource) => {
  const key = skillKey(item.skill);
  const extendedData = {
    originalItem: item,
    answerSource,
  };

  if (key === "reading") {
    return {
      reading: {
        passageNumber: 1,
        passageTitle: item.title || item.content || item.id,
        passageText: item.passage || "",
        testId: `GEN-${item.level || "UNK"}-${item.skill || "GEN"}`,
        testName: "Generated Assessment Items",
        extendedData,
      },
    };
  }

  if (key === "listening") {
    return {
      listening: {
        context: item.passage || item.content || "",
        audioFile: item.audioAsset || "",
        audioAsset: item.audioAsset || "",
        extendedData,
      },
    };
  }

  if (key === "writing") {
    return {
      writing: {
        task: 1,
        rubric: item.rubric || "",
        visualData: item.sourceData?.visualData || item.passage || "",
        extendedData,
      },
    };
  }

  return {
    speaking: {
      part: 1,
      followUpQuestions:
        item.sourceData && Array.isArray(item.sourceData.followUpQuestions)
          ? item.sourceData.followUpQuestions
          : [],
      rubricCriteria: item.rubric ? [item.rubric] : [],
      extendedData,
    },
  };
};

const questions = items.map((item, index) => {
  const { value: correctAnswer, source: answerSource } = deriveCorrectAnswer(item);

  return {
    id: item.id,
    skill: item.skill,
    questionNumber: index + 1,
    questionType: item.itemType,
    prompt: item.content,
    correctAnswer,
    difficulty: item.difficulty,
    level: item.level,
    topic: item.contentDomain || "",
    skillTag: item.subSkill || "",
    skillTagId: [slug(item.skill), slug(item.subSkill || item.itemType || "generated")].filter(Boolean).join("-"),
    options: Array.isArray(item.options) ? item.options : [],
    skillDetails: buildSkillDetails(item, answerSource),
    status: item.status,
    workflowState: item.workflowState,
    subSkill: item.subSkill,
    cognitiveLevel: item.cognitiveLevel,
    contentDomain: item.contentDomain,
    languageVariety: "International",
    discrimination: item.discrimination,
    confidence: item.confidence,
    irtParameters: item.irtParameters,
    screening: item.screening,
    flaggedForReview: Boolean(item.flaggedForReview),
    flagReason: item.flagReason,
    reviewHistory: item.reviewHistory,
    author: item.author,
    createdDate: item.createdDate,
    lastEditedDate: item.lastEditedDate,
    lastEditedBy: item.lastEditedBy,
    reviewers: item.reviewers,
    aiModelVersion: item.aiModelVersion,
    aiPredictionDate: item.aiPredictionDate,
  };
});

fs.writeFileSync(targetPath, `${JSON.stringify({ questions }, null, 2)}\n`);

const sourceIds = new Set(items.map((item) => item.id));
const outputIds = new Set(questions.map((question) => question.id));
const missingIds = Array.from(sourceIds).filter((id) => !outputIds.has(id));
const duplicateOutputIds = questions.length - outputIds.size;
const emptyCorrectAnswers = questions.filter((q) => !q.correctAnswer).map((q) => q.id);

console.log(
  JSON.stringify(
    {
      sourceCount: items.length,
      outputCount: questions.length,
      missingIds,
      duplicateOutputIds,
      emptyCorrectAnswersCount: emptyCorrectAnswers.length,
      emptyCorrectAnswers,
    },
    null,
    2,
  ),
);
