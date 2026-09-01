import type {
  Lesson,
  LessonTest,
  PastPaper,
  PreExam,
  Term,
  Week,
  WeekDay,
  WeekTest,
} from "@/lib/types";

const DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function dayTitle(day: WeekDay) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function makeLessonTest(
  termNum: number,
  weekNum: number,
  day: WeekDay,
  dayTopic: string,
  topic: string,
): LessonTest {
  const lessonId = `t${termNum}-w${weekNum}-${day}`;
  return {
    id: `lesson-test-${lessonId}`,
    title: `Lesson test — ${dayTitle(day)}: ${dayTopic}`,
    description:
      "Check today’s lesson. Choose on-screen MCQ or Paper + scan. Pass to mark the lesson complete.",
    passMark: 50,
    resources: [],
    memoResources: [],
    questions: [
      {
        id: `lt-${lessonId}-q1`,
        prompt: `What is the main focus of today’s lesson (${dayTopic})?`,
        options: [
          "Unrelated enrichment only",
          dayTopic,
          "Term 4 wellness only",
          "Skipping CAPS content",
        ],
        answerIndex: 1,
      },
      {
        id: `lt-${lessonId}-q2`,
        prompt: `This lesson sits inside the week topic “${topic}”. Learners should…`,
        options: [
          "Ignore daily notes",
          "Work through examples and check answers",
          "Wait until the Saturday test only",
          "Avoid practice questions",
        ],
        answerIndex: 1,
      },
      {
        id: `lt-${lessonId}-q3`,
        prompt: "Before marking a lesson complete in Ember Maths12, you must…",
        options: [
          "Skip the lesson test",
          "Pass today’s lesson test (MCQ or paper + scan)",
          "Upload a memo as a student",
          "Finish the term pre-exam first",
        ],
        answerIndex: 1,
      },
      {
        id: `lt-${lessonId}-q4`,
        prompt: `A sensible next step after studying ${dayTopic} is…`,
        options: [
          "Discard feedback",
          "Review mistakes and retry similar problems",
          "Change to a different subject permanently",
          "Only memorise the title",
        ],
        answerIndex: 1,
      },
    ],
  };
}

function markdownNotesUrl(dayTopic: string, topic: string, termNum: number, weekNum: number) {
  const body = [
    `# ${dayTopic}`,
    "",
    `CAPS Grade 12 — Term ${termNum}, Week ${weekNum} · ${topic}`,
    "",
    "## Learning focus",
    `- Revise key ideas for **${dayTopic}**`,
    "- Work through examples step by step",
    "- Check answers and note common errors",
    "",
    "## Outline",
    "1. Warm-up recall",
    "2. Core method / formula",
    "3. Guided examples",
    "4. Independent practice",
    "",
    "## Tip",
    "Switch to **Video** for the walkthrough, then return here for notes.",
  ].join("\n");
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(body)}`;
}

function makeLessons(
  termNum: number,
  weekNum: number,
  topic: string,
  dayTopics: string[],
): Lesson[] {
  return DAYS.map((day, i) => {
    const dayTopic = dayTopics[i] ?? topic;
    return {
      id: `t${termNum}-w${weekNum}-${day}`,
      day,
      title: `${dayTitle(day)}: ${dayTopic}`,
      description: `CAPS Grade 12 — Term ${termNum}, Week ${weekNum}. Focus: ${dayTopic}.`,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      durationMinutes: 25 + i * 5,
      lessonTest: makeLessonTest(termNum, weekNum, day, dayTopic, topic),
      resources: [
        {
          id: `r-t${termNum}-w${weekNum}-${day}-md`,
          title: `${dayTopic} — Lesson notes`,
          type: "markdown" as const,
          fileName: `${day}-notes.md`,
          url: markdownNotesUrl(dayTopic, topic, termNum, weekNum),
        },
        {
          id: `r-t${termNum}-w${weekNum}-${day}-1`,
          title: `${dayTopic} — Notes (PDF)`,
          type: "pdf" as const,
          url: "#",
        },
        {
          id: `r-t${termNum}-w${weekNum}-${day}-2`,
          title: "Extra practice worksheet",
          type: "worksheet" as const,
          url: "#",
        },
        {
          id: `r-t${termNum}-w${weekNum}-${day}-3`,
          title: "Learn more — CAPS topic guide",
          type: "link" as const,
          url: "https://www.education.gov.za/",
        },
      ],
    };
  });
}

function makeWeekTest(termNum: number, weekNum: number, topic: string): WeekTest {
  return {
    id: `test-t${termNum}-w${weekNum}`,
    title: `Week ${weekNum} Saturday Test — ${topic}`,
    description: `Assess Term ${termNum} Week ${weekNum} understanding of ${topic}. Choose on-screen MCQ or Paper + scan.`,
    passMark: 50,
    resources: [],
    memoResources: [],
    questions: [
      {
        id: `q-t${termNum}-w${weekNum}-1`,
        prompt: `Which statement best relates to ${topic}?`,
        options: [
          "It is unrelated to Grade 12 Maths",
          `It is a core CAPS focus for this week (${topic})`,
          "It only appears in Term 4 revision",
          "It is optional enrichment only",
        ],
        answerIndex: 1,
      },
      {
        id: `q-t${termNum}-w${weekNum}-2`,
        prompt: "A learner should prepare for Saturday week tests by…",
        options: [
          "Skipping Mon–Fri lessons",
          "Reviewing daily lesson resources and worked examples",
          "Waiting until the pre-exam",
          "Only memorising formulas without practice",
        ],
        answerIndex: 1,
      },
      {
        id: `q-t${termNum}-w${weekNum}-3`,
        prompt: `In the context of ${topic}, the next step after practice is…`,
        options: [
          "Ignore feedback",
          "Check solutions and correct mistakes",
          "Change subjects",
          "Skip the pre-exam",
        ],
        answerIndex: 1,
      },
    ],
  };
}

function makePreExam(termNum: number, focus: string): PreExam {
  return {
    id: `preexam-t${termNum}`,
    title: `Term ${termNum} Pre-Exam`,
    description: `Consolidates Weeks 1–4 (${focus}). Choose on-screen MCQ or Paper + scan.`,
    passMark: 50,
    resources: [],
    memoResources: [],
    questions: [
      {
        id: `pq-t${termNum}-1`,
        prompt: `Term ${termNum} pre-exam: which area was covered across the four weeks?`,
        options: [focus, "Only probability", "Only final NSC papers", "Grade 11 revision only"],
        answerIndex: 0,
      },
      {
        id: `pq-t${termNum}-2`,
        prompt: "Pre-exams are written…",
        options: [
          "Before Week 1",
          "After Week 4 of the term",
          "Only on Mondays",
          "Instead of Saturday tests",
        ],
        answerIndex: 1,
      },
      {
        id: `pq-t${termNum}-3`,
        prompt: "A pass mark in Ember Maths12 assessments is…",
        options: ["30%", "40%", "50%", "90%"],
        answerIndex: 2,
      },
      {
        id: `pq-t${termNum}-4`,
        prompt: "Best study habit before a pre-exam?",
        options: [
          "Cram without notes",
          "Revise Mon–Fri lessons, week tests, and resources",
          "Skip Week 4",
          "Ignore teacher feedback",
        ],
        answerIndex: 1,
      },
    ],
  };
}

function makePastPaper(termNum: number, focus: string): PastPaper {
  return {
    id: `pastpaper-t${termNum}`,
    title: `Term ${termNum} past papers`,
    description: `Previous exam papers for Term ${termNum} practice (${focus}). Download the paper, write on paper, then scan for mock AI feedback. Does not affect pass/fail.`,
    passMark: 50,
    resources: [],
    memoResources: [],
  };
}

function makeWeek(
  termNum: number,
  weekNum: number,
  topic: string,
  dayTopics: string[],
): Week {
  return {
    id: `term${termNum}-week${weekNum}`,
    number: weekNum,
    topic,
    lessons: makeLessons(termNum, weekNum, topic, dayTopics),
    weekTest: makeWeekTest(termNum, weekNum, topic),
  };
}

/** Placeholder CAPS-inspired curriculum: 4 terms × 4 weeks + pre-exam */
export const SEED_TERMS: Term[] = [
  {
    id: "term-1",
    number: 1,
    title: "Term 1 — Patterns, Series & Functions",
    weeks: [
      makeWeek(1, 1, "Number Patterns & Sequences", [
        "Quadratic patterns revision",
        "Arithmetic sequences",
        "Geometric sequences",
        "General term practice",
        "Mixed sequence problems",
      ]),
      makeWeek(1, 2, "Series & Sigma Notation", [
        "Sigma notation",
        "Arithmetic series Sn",
        "Sn = n/2 (a + l)",
        "Worked series examples",
        "Investigation / project prep",
      ]),
      makeWeek(1, 3, "Geometric Series", [
        "Sum of geometric series",
        "Infinite geometric series",
        "Convergence |r| < 1",
        "Applications of series",
        "Mixed series revision",
      ]),
      makeWeek(1, 4, "Functions Revision", [
        "Sketching functions",
        "Equations of functions",
        "Domain, range & asymptotes",
        "Transformations",
        "Graphical interpretation",
      ]),
    ],
    preExam: makePreExam(1, "Patterns, series and functions"),
    pastPaper: makePastPaper(1, "Patterns, series and functions"),
  },
  {
    id: "term-2",
    number: 2,
    title: "Term 2 — Geometry & Calculus",
    weeks: [
      makeWeek(2, 1, "Euclidean Geometry Revision", [
        "Similarity of polygons",
        "Parallel line theorem",
        "Mid-point theorem",
        "Proportionality practice",
        "Proof skills workshop",
      ]),
      makeWeek(2, 2, "Similarity & Pythagoras", [
        "Equiangular triangles",
        "Sides in proportion",
        "Pythagoras via similarity",
        "Exam-style geometry",
        "Proof consolidation",
      ]),
      makeWeek(2, 3, "Analytical Geometry", [
        "Midpoint, gradient, distance",
        "Equations of lines",
        "Inclination of a line",
        "Circles (x−a)²+(y−b)²=r²",
        "Tangents to circles",
      ]),
      makeWeek(2, 4, "Differential Calculus Intro", [
        "Polynomials & factor theorem",
        "Limit concept",
        "First principles",
        "Rules of differentiation",
        "Tangents & cubic graphs",
      ]),
    ],
    preExam: makePreExam(2, "Geometry and differential calculus"),
    pastPaper: makePastPaper(2, "Geometry and differential calculus"),
  },
  {
    id: "term-3",
    number: 3,
    title: "Term 3 — Finance, Stats & Probability",
    weeks: [
      makeWeek(3, 1, "Finance: Growth & Decay", [
        "Simple & compound growth",
        "Decay and depreciation",
        "Reducing balance",
        "Finance word problems",
        "Calculator strategies",
      ]),
      makeWeek(3, 2, "Annuities", [
        "Future value annuities",
        "Sinking funds",
        "Present value annuities",
        "Outstanding balances",
        "Investment decisions",
      ]),
      makeWeek(3, 3, "Statistics Revision", [
        "Five-number summary",
        "Box-and-whisker plots",
        "Histograms & ogives",
        "Variance & standard deviation",
        "Outliers & skewness",
      ]),
      makeWeek(3, 4, "Regression & Probability", [
        "Scatterplots & regression",
        "Correlation",
        "Counting principles",
        "Addition & complementary rules",
        "Mixed probability",
      ]),
    ],
    preExam: makePreExam(3, "Finance, statistics and probability"),
    pastPaper: makePastPaper(3, "Finance, statistics and probability"),
  },
  {
    id: "term-4",
    number: 4,
    title: "Term 4 — Revision & Exam Prep",
    weeks: [
      makeWeek(4, 1, "Paper 1 Revision", [
        "Algebra & equations",
        "Sequences & series",
        "Finance",
        "Calculus",
        "Paper 1 mixed paper",
      ]),
      makeWeek(4, 2, "Paper 2 Revision", [
        "Euclidean geometry",
        "Analytical geometry",
        "Trigonometry refresh",
        "Statistics",
        "Paper 2 mixed paper",
      ]),
      makeWeek(4, 3, "Exam Technique", [
        "Time management",
        "Show-working standards",
        "Common errors",
        "Past paper sprint",
        "Self-marking practice",
      ]),
      makeWeek(4, 4, "Final Consolidation", [
        "Weak-topic clinics",
        "Formula sheet mastery",
        "Full mock Paper 1",
        "Full mock Paper 2",
        "Wellness & exam readiness",
      ]),
    ],
    preExam: makePreExam(4, "Full CAPS Grade 12 revision"),
    pastPaper: makePastPaper(4, "Full CAPS Grade 12 revision"),
  },
];
