export type Role = "admin" | "student" | "teacher" | "parent";

export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  /** Parent → child student ids */
  childIds?: string[];
  /** Student → parent id */
  parentId?: string;
  classIds?: string[];
  /** South African province — required for students */
  province?: string;
  /** Local / metro municipality — required for students */
  municipality?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "link" | "worksheet" | "markdown";
  url: string;
  /** Original file name when uploaded in-browser (mock storage). */
  fileName?: string;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
}

export interface LessonTest {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passMark: number;
  /** Optional override materials; students fall back to lesson.resources when empty. */
  resources: Resource[];
  /** Marking memo / answer key — admin only; used for paper-scan correction. */
  memoResources: Resource[];
}

export interface Lesson {
  id: string;
  day: WeekDay;
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: number;
  resources: Resource[];
  /** Daily lesson test (MCQ / paper+scan); required before marking complete. */
  lessonTest?: LessonTest;
  /** teacher-created extras */
  createdByTeacherId?: string;
  classId?: string;
}

export interface WeekTest {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passMark: number;
  /** Uploaded PDF / Markdown exam papers (mock localStorage). */
  resources: Resource[];
  /** Marking memo / answer key — admin only; used for paper-scan correction. */
  memoResources: Resource[];
}

export interface PreExam {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passMark: number;
  /** Uploaded PDF / Markdown exam papers (mock localStorage). */
  resources: Resource[];
  /** Marking memo / answer key — admin only; used for paper-scan correction. */
  memoResources: Resource[];
}

/** Optional per-term previous exam pack for student practice (not pass/fail). */
export interface PastPaper {
  id: string;
  title: string;
  description: string;
  /** Feedback band only — does not change pass/fail. */
  passMark: number;
  /** Student-visible previous exam paper(s). */
  resources: Resource[];
  /** Marking memo / answer key — admin only; used for paper-scan correction. */
  memoResources: Resource[];
}

export interface Week {
  id: string;
  number: 1 | 2 | 3 | 4;
  topic: string;
  lessons: Lesson[];
  weekTest: WeekTest;
}

export interface Term {
  id: string;
  number: 1 | 2 | 3 | 4;
  title: string;
  weeks: Week[];
  preExam: PreExam;
  pastPaper: PastPaper;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface StudentProgress {
  studentId: string;
  completedLessonIds: string[];
  testScores: Record<string, number>; // weekTestId, preExamId, or lessonTestId → %
  badgeIds: string[];
  overallPercent: number;
  status: "passing" | "failing" | "pending";
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  termId?: string;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  pendingStudentIds: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  studentId?: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface QuestionFeedback {
  questionId: string;
  prompt: string;
  correct: boolean;
  note: string;
}

export interface CorrectionResult {
  id: string;
  studentId: string;
  fileName: string;
  score: number;
  feedback: string[];
  summary: string;
  createdAt: string;
  /** Set when the scan is tied to a Saturday test or pre-exam. */
  assessmentId?: string;
  assessmentTitle?: string;
  mode?: "paper-scan" | "practice" | "past-paper";
  questionFeedback?: QuestionFeedback[];
}

export interface AppState {
  users: User[];
  terms: Term[];
  progress: StudentProgress[];
  badges: Badge[];
  groups: StudyGroup[];
  classes: SchoolClass[];
  messages: Message[];
  corrections: CorrectionResult[];
  teacherLessons: Lesson[];
}
