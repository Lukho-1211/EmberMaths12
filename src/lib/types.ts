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
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "link" | "worksheet";
  url: string;
}

export interface Lesson {
  id: string;
  day: WeekDay;
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: number;
  resources: Resource[];
  /** teacher-created extras */
  createdByTeacherId?: string;
  classId?: string;
}

export interface WeekTest {
  id: string;
  title: string;
  description: string;
  questions: { id: string; prompt: string; options: string[]; answerIndex: number }[];
  passMark: number;
}

export interface PreExam {
  id: string;
  title: string;
  description: string;
  questions: { id: string; prompt: string; options: string[]; answerIndex: number }[];
  passMark: number;
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
  testScores: Record<string, number>; // weekTestId or preExamId → %
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

export interface CorrectionResult {
  id: string;
  studentId: string;
  fileName: string;
  score: number;
  feedback: string[];
  summary: string;
  createdAt: string;
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
