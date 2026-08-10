import { SEED_TERMS } from "@/lib/mock/curriculum";
import type { AppState, Badge, SchoolClass, StudentProgress, StudyGroup, User } from "@/lib/types";

export const DEMO_PASSWORD = "ember12";

export const SEED_USERS: User[] = [
  {
    id: "admin-1",
    name: "Thandi Admin",
    email: "admin@ember12.za",
    password: DEMO_PASSWORD,
    role: "admin",
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "teacher-1",
    name: "Mr. Naidoo",
    email: "teacher@ember12.za",
    password: DEMO_PASSWORD,
    role: "teacher",
    classIds: ["class-1"],
    createdAt: "2026-01-06T08:00:00.000Z",
  },
  {
    id: "teacher-2",
    name: "Ms. Dlamini",
    email: "dlamini@ember12.za",
    password: DEMO_PASSWORD,
    role: "teacher",
    classIds: ["class-2"],
    createdAt: "2026-01-06T09:00:00.000Z",
  },
  {
    id: "student-1",
    name: "Lerato Molefe",
    email: "student@ember12.za",
    password: DEMO_PASSWORD,
    role: "student",
    parentId: "parent-1",
    classIds: ["class-1"],
    createdAt: "2026-01-07T08:00:00.000Z",
  },
  {
    id: "student-2",
    name: "Johan Botha",
    email: "johan@ember12.za",
    password: DEMO_PASSWORD,
    role: "student",
    parentId: "parent-2",
    classIds: ["class-1"],
    createdAt: "2026-01-07T09:00:00.000Z",
  },
  {
    id: "student-3",
    name: "Aisha Patel",
    email: "aisha@ember12.za",
    password: DEMO_PASSWORD,
    role: "student",
    classIds: ["class-2"],
    createdAt: "2026-01-07T10:00:00.000Z",
  },
  {
    id: "student-4",
    name: "Sipho Nkosi",
    email: "sipho@ember12.za",
    password: DEMO_PASSWORD,
    role: "student",
    createdAt: "2026-01-08T08:00:00.000Z",
  },
  {
    id: "parent-1",
    name: "Mrs. Molefe",
    email: "parent@ember12.za",
    password: DEMO_PASSWORD,
    role: "parent",
    childIds: ["student-1"],
    createdAt: "2026-01-07T11:00:00.000Z",
  },
  {
    id: "parent-2",
    name: "Mr. Botha",
    email: "botha.parent@ember12.za",
    password: DEMO_PASSWORD,
    role: "parent",
    childIds: ["student-2"],
    createdAt: "2026-01-07T12:00:00.000Z",
  },
];

export const SEED_BADGES: Badge[] = [
  {
    id: "badge-starter",
    name: "First Spark",
    description: "Completed your first lesson",
    icon: "flame",
  },
  {
    id: "badge-week",
    name: "Week Warrior",
    description: "Finished a full week of lessons",
    icon: "calendar",
  },
  {
    id: "badge-test",
    name: "Saturday Strong",
    description: "Passed a Saturday week test",
    icon: "trophy",
  },
  {
    id: "badge-preexam",
    name: "Term Ready",
    description: "Passed a term pre-exam",
    icon: "award",
  },
  {
    id: "badge-streak",
    name: "Consistent Ember",
    description: "Maintained steady progress across a term",
    icon: "zap",
  },
];

const student1Lessons = [
  "t1-w1-monday",
  "t1-w1-tuesday",
  "t1-w1-wednesday",
  "t1-w1-thursday",
  "t1-w1-friday",
  "t1-w2-monday",
  "t1-w2-tuesday",
];

export const SEED_PROGRESS: StudentProgress[] = [
  {
    studentId: "student-1",
    completedLessonIds: student1Lessons,
    testScores: { "test-t1-w1": 78 },
    badgeIds: ["badge-starter", "badge-week", "badge-test"],
    overallPercent: 72,
    status: "passing",
  },
  {
    studentId: "student-2",
    completedLessonIds: ["t1-w1-monday", "t1-w1-tuesday"],
    testScores: { "test-t1-w1": 42 },
    badgeIds: ["badge-starter"],
    overallPercent: 38,
    status: "failing",
  },
  {
    studentId: "student-3",
    completedLessonIds: [
      "t1-w1-monday",
      "t1-w1-tuesday",
      "t1-w1-wednesday",
      "t1-w1-thursday",
      "t1-w1-friday",
    ],
    testScores: { "test-t1-w1": 65 },
    badgeIds: ["badge-starter", "badge-week", "badge-test"],
    overallPercent: 61,
    status: "passing",
  },
  {
    studentId: "student-4",
    completedLessonIds: [],
    testScores: {},
    badgeIds: [],
    overallPercent: 0,
    status: "pending",
  },
];

export const SEED_GROUPS: StudyGroup[] = [
  {
    id: "group-1",
    name: "Sequences Study Circle",
    description: "Peer practice for Term 1 patterns and series",
    memberIds: ["student-1", "student-3"],
    termId: "term-1",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
];

export const SEED_CLASSES: SchoolClass[] = [
  {
    id: "class-1",
    name: "Grade 12 Maths — A",
    teacherId: "teacher-1",
    studentIds: ["student-1", "student-2"],
    pendingStudentIds: ["student-4"],
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "class-2",
    name: "Grade 12 Maths — B",
    teacherId: "teacher-2",
    studentIds: ["student-3"],
    pendingStudentIds: [],
    createdAt: "2026-01-10T09:00:00.000Z",
  },
];

export function createInitialState(): AppState {
  return {
    users: structuredClone(SEED_USERS),
    terms: structuredClone(SEED_TERMS),
    progress: structuredClone(SEED_PROGRESS),
    badges: structuredClone(SEED_BADGES),
    groups: structuredClone(SEED_GROUPS),
    classes: structuredClone(SEED_CLASSES),
    messages: [
      {
        id: "msg-1",
        fromUserId: "teacher-1",
        toUserId: "parent-1",
        studentId: "student-1",
        body: "Lerato is making strong progress on Term 1 Week 2. Please encourage Saturday test revision.",
        createdAt: "2026-02-10T14:00:00.000Z",
        read: false,
      },
    ],
    corrections: [],
    teacherLessons: [],
  };
}

export const STORAGE_KEY = "ember12-app-state-v1";
export const SESSION_KEY = "ember12-session-v1";
