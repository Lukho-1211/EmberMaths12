import type {
  CorrectionResult,
  StudentProgress,
  Term,
  Week,
} from "@/lib/types";

export type TopicBand = "strong" | "developing" | "weak" | "not_started";

export interface WeekInsight {
  weekId: string;
  weekNumber: number;
  topic: string;
  score: number | undefined;
  band: TopicBand;
  lessonsDone: number;
  lessonsTotal: number;
  href: string;
}

export interface ImprovementAction {
  label: string;
  href?: string;
}

export interface TermInsight {
  termId: string;
  termNumber: number;
  title: string;
  average: number | undefined;
  status: "strong" | "on_track" | "needs_work" | "pending";
  weeks: WeekInsight[];
  strengths: WeekInsight[];
  weaknesses: WeekInsight[];
  developing: WeekInsight[];
  improvements: ImprovementAction[];
  preExamScore: number | undefined;
  hasData: boolean;
}

function bandForScore(score: number | undefined): TopicBand {
  if (score === undefined) return "not_started";
  if (score >= 70) return "strong";
  if (score >= 50) return "developing";
  return "weak";
}

function weekTopicScore(week: Week, testScores: Record<string, number>): number | undefined {
  const saturday = testScores[week.weekTest.id];
  if (saturday !== undefined) return saturday;

  const lessonScores = week.lessons
    .map((l) => (l.lessonTest ? testScores[l.lessonTest.id] : undefined))
    .filter((s): s is number => s !== undefined);

  if (lessonScores.length === 0) return undefined;
  return Math.round(lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length);
}

function termAssessmentIds(term: Term): Set<string> {
  const ids = new Set<string>();
  ids.add(term.preExam.id);
  for (const week of term.weeks) {
    ids.add(week.weekTest.id);
    for (const lesson of week.lessons) {
      if (lesson.lessonTest) ids.add(lesson.lessonTest.id);
    }
  }
  return ids;
}

function statusForAverage(
  average: number | undefined,
  hasData: boolean,
): TermInsight["status"] {
  if (!hasData || average === undefined) return "pending";
  if (average >= 70) return "strong";
  if (average >= 50) return "on_track";
  return "needs_work";
}

export function buildTermInsight(
  term: Term,
  progress: StudentProgress | undefined,
  corrections: CorrectionResult[] = [],
): TermInsight {
  const testScores = progress?.testScores ?? {};
  const completed = new Set(progress?.completedLessonIds ?? []);

  const weeks: WeekInsight[] = term.weeks.map((week) => {
    const score = weekTopicScore(week, testScores);
    const lessonsDone = week.lessons.filter((l) => completed.has(l.id)).length;
    return {
      weekId: week.id,
      weekNumber: week.number,
      topic: week.topic,
      score,
      band: bandForScore(score),
      lessonsDone,
      lessonsTotal: week.lessons.length,
      href: `/student/learn/${term.id}/${week.id}`,
    };
  });

  const preExamScore = testScores[term.preExam.id];
  const scoredForAverage = [
    ...weeks.map((w) => w.score).filter((s): s is number => s !== undefined),
    ...(preExamScore !== undefined ? [preExamScore] : []),
  ];
  const hasData =
    scoredForAverage.length > 0 ||
    weeks.some((w) => w.lessonsDone > 0) ||
    preExamScore !== undefined;

  const average =
    scoredForAverage.length === 0
      ? undefined
      : Math.round(scoredForAverage.reduce((a, b) => a + b, 0) / scoredForAverage.length);

  const strengths = weeks.filter((w) => w.band === "strong");
  const weaknesses = weeks.filter((w) => w.band === "weak");
  const developing = weeks.filter((w) => w.band === "developing");

  const improvements: ImprovementAction[] = [];

  for (const w of weaknesses) {
    improvements.push({
      label: `Revise ${w.topic} and retake the Saturday test (scored ${w.score}%)`,
      href: w.href,
    });
  }

  for (const w of weeks) {
    const started = w.lessonsDone > 0 || w.score !== undefined;
    if (started && w.lessonsDone < w.lessonsTotal) {
      improvements.push({
        label: `Finish remaining lessons in Week ${w.weekNumber}: ${w.topic} (${w.lessonsDone}/${w.lessonsTotal})`,
        href: w.href,
      });
    }
  }

  for (const w of developing) {
    improvements.push({
      label: `Extra practice on ${w.topic} before the pre-exam (${w.score}%)`,
      href: w.href,
    });
  }

  const termIds = termAssessmentIds(term);
  const incorrectNotes = corrections
    .filter((c) => c.assessmentId && termIds.has(c.assessmentId))
    .flatMap((c) => c.questionFeedback ?? [])
    .filter((q) => !q.correct)
    .slice(0, 3);

  for (const q of incorrectNotes) {
    const note = q.note.trim();
    improvements.push({
      label: note
        ? `Review: ${note}`
        : `Review missed question: ${q.prompt.slice(0, 80)}${q.prompt.length > 80 ? "…" : ""}`,
    });
  }

  if (hasData && (preExamScore === undefined || preExamScore < 50)) {
    const weekHints = [...weaknesses, ...developing]
      .map((w) => w.topic)
      .slice(0, 2);
    const hint =
      weekHints.length > 0
        ? ` after consolidating ${weekHints.join(" and ")}`
        : "";
    improvements.push({
      label:
        preExamScore === undefined
          ? `Attempt the term pre-exam${hint}`
          : `Retake the term pre-exam (scored ${preExamScore}%)${hint}`,
      href: `/student/learn/${term.id}/pre-exam`,
    });
  }

  // Deduplicate by label
  const seen = new Set<string>();
  const uniqueImprovements = improvements.filter((item) => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });

  return {
    termId: term.id,
    termNumber: term.number,
    title: term.title,
    average,
    status: statusForAverage(average, hasData),
    weeks,
    strengths,
    weaknesses,
    developing,
    improvements: uniqueImprovements.slice(0, 8),
    preExamScore,
    hasData,
  };
}

export function buildAllTermInsights(
  terms: Term[],
  progress: StudentProgress | undefined,
  corrections: CorrectionResult[] = [],
): TermInsight[] {
  return terms.map((term) => buildTermInsight(term, progress, corrections));
}

/** Resolve assessment id → human title for parent score lists. */
export function resolveAssessmentLabel(terms: Term[], assessmentId: string): string {
  for (const term of terms) {
    if (term.preExam.id === assessmentId) {
      return `Term ${term.number} · ${term.preExam.title}`;
    }
    for (const week of term.weeks) {
      if (week.weekTest.id === assessmentId) {
        return `Term ${term.number} Week ${week.number} · ${week.topic}`;
      }
      for (const lesson of week.lessons) {
        if (lesson.lessonTest?.id === assessmentId) {
          return `Term ${term.number} W${week.number} · ${lesson.title}`;
        }
      }
    }
  }
  return assessmentId;
}

export function bandLabel(band: TopicBand): string {
  switch (band) {
    case "strong":
      return "Strong";
    case "developing":
      return "Developing";
    case "weak":
      return "Weak";
    case "not_started":
      return "Not started";
  }
}

export function termStatusLabel(status: TermInsight["status"]): string {
  switch (status) {
    case "strong":
      return "Strong";
    case "on_track":
      return "On track";
    case "needs_work":
      return "Needs work";
    case "pending":
      return "Pending";
  }
}
