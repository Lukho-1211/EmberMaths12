"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createInitialState, SESSION_KEY, STORAGE_KEY } from "@/lib/mock/seed";
import { SEED_TERMS } from "@/lib/mock/curriculum";
import type {
  AppState,
  CorrectionResult,
  Lesson,
  Message,
  Resource,
  Role,
  SchoolClass,
  StudyGroup,
  Term,
  User,
  WeekDay,
} from "@/lib/types";

/** Older demo saves may lack exam file / memo attachments, past papers, or daily lesson tests. */
function normalizeAppState(raw: AppState): AppState {
  return {
    ...raw,
    terms: (raw.terms ?? []).map((term) => {
      const seedTerm = SEED_TERMS.find((t) => t.id === term.id);
      const seedPast = seedTerm?.pastPaper;
      const pastPaper = term.pastPaper
        ? {
            ...term.pastPaper,
            resources: term.pastPaper.resources ?? [],
            memoResources: term.pastPaper.memoResources ?? [],
          }
        : seedPast
          ? { ...seedPast, resources: [], memoResources: [] }
          : {
              id: `pastpaper-${term.id}`,
              title: `Term ${term.number} past papers`,
              description:
                "Previous exam papers for practice. Download, write on paper, then scan for mock AI feedback.",
              passMark: 50,
              resources: [],
              memoResources: [],
            };
      return {
        ...term,
        preExam: {
          ...term.preExam,
          resources: term.preExam.resources ?? [],
          memoResources: term.preExam.memoResources ?? [],
        },
        pastPaper,
        weeks: (term.weeks ?? []).map((week) => {
          const seedWeek = seedTerm?.weeks.find((w) => w.id === week.id);
          return {
            ...week,
            weekTest: {
              ...week.weekTest,
              resources: week.weekTest.resources ?? [],
              memoResources: week.weekTest.memoResources ?? [],
            },
            lessons: (week.lessons ?? []).map((lesson) => {
              if (lesson.lessonTest) return lesson;
              const seedLesson = seedWeek?.lessons.find((l) => l.id === lesson.id || l.day === lesson.day);
              return seedLesson?.lessonTest
                ? { ...lesson, lessonTest: seedLesson.lessonTest }
                : lesson;
            }),
          };
        }),
      };
    }),
  };
}

interface Session {
  userId: string;
}

interface StoreContextValue {
  ready: boolean;
  state: AppState;
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => { ok: true; role: Role } | { ok: false; error: string };
  signup: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    province?: string;
    municipality?: string;
  }) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  resetDemo: () => void;
  deleteUser: (userId: string) => void;
  createTeacher: (input: { name: string; email: string; password: string }) => void;
  updateTerms: (terms: Term[]) => void;
  upsertWeekLesson: (
    termId: string,
    weekId: string,
    day: WeekDay,
    patch: Partial<Lesson>,
  ) => void;
  setWeekTest: (
    termId: string,
    weekId: string,
    patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
  ) => void;
  setPreExam: (
    termId: string,
    patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
  ) => void;
  setPastPaper: (
    termId: string,
    patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
  ) => void;
  createGroup: (input: { name: string; description: string; termId?: string }) => void;
  addMemberToGroup: (groupId: string, studentId: string) => void;
  removeMemberFromGroup: (groupId: string, studentId: string) => void;
  deleteGroup: (groupId: string) => void;
  completeLesson: (studentId: string, lessonId: string) => void;
  submitTestScore: (studentId: string, assessmentId: string, score: number) => void;
  addCorrection: (correction: Omit<CorrectionResult, "id" | "createdAt">) => CorrectionResult;
  createClass: (teacherId: string, name: string) => void;
  searchStudents: (query: string) => User[];
  requestJoinClass: (classId: string, studentId: string) => void;
  acceptStudent: (classId: string, studentId: string) => void;
  addStudentToClass: (classId: string, studentId: string) => void;
  createTeacherLesson: (lesson: Omit<Lesson, "id"> & { id?: string }) => void;
  sendMessage: (input: {
    fromUserId: string;
    toUserId: string;
    studentId?: string;
    body: string;
  }) => void;
  markMessageRead: (messageId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function recomputeProgress(
  progress: AppState["progress"][number],
): AppState["progress"][number] {
  const lessonCount = Math.max(progress.completedLessonIds.length, 1);
  const scores = Object.values(progress.testScores);
  const avgScore =
    scores.length === 0 ? progress.completedLessonIds.length * 4 : scores.reduce((a, b) => a + b, 0) / scores.length;
  const overall = Math.min(
    100,
    Math.round(avgScore * 0.7 + Math.min(100, lessonCount * 3) * 0.3),
  );
  const status =
    scores.length === 0 && progress.completedLessonIds.length === 0
      ? "pending"
      : overall >= 50
        ? "passing"
        : "failing";
  const badgeIds = new Set(progress.badgeIds);
  if (progress.completedLessonIds.length >= 1) badgeIds.add("badge-starter");
  if (progress.completedLessonIds.length >= 5) badgeIds.add("badge-week");
  if (scores.some((s) => s >= 50)) badgeIds.add("badge-test");
  if (Object.keys(progress.testScores).some((k) => k.startsWith("preexam-") && (progress.testScores[k] ?? 0) >= 50)) {
    badgeIds.add("badge-preexam");
  }
  if (overall >= 60) badgeIds.add("badge-streak");
  return {
    ...progress,
    overallPercent: overall,
    status,
    badgeIds: Array.from(badgeIds),
  };
}

function ensureStudentProgress(state: AppState, studentId: string): AppState {
  if (state.progress.some((p) => p.studentId === studentId)) return state;
  return {
    ...state,
    progress: [
      ...state.progress,
      {
        studentId,
        completedLessonIds: [],
        testScores: {},
        badgeIds: [],
        overallPercent: 0,
        status: "pending",
      },
    ],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalizeAppState(JSON.parse(raw) as AppState));
      const sess = localStorage.getItem(SESSION_KEY);
      if (sess) setSession(JSON.parse(sess) as Session);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session, ready]);

  const user = useMemo(
    () => state.users.find((u) => u.id === session?.userId) ?? null,
    [state.users, session],
  );

  const login = useCallback(
    (email: string, password: string) => {
      const found = state.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      if (!found) return { ok: false as const, error: "Invalid email or password." };
      setSession({ userId: found.id });
      return { ok: true as const, role: found.role };
    },
    [state.users],
  );

  const signup = useCallback(
    (input: {
      name: string;
      email: string;
      password: string;
      role: Role;
      province?: string;
      municipality?: string;
    }) => {
      if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        return { ok: false as const, error: "An account with this email already exists." };
      }
      if (input.role === "student" && (!input.province || !input.municipality)) {
        return {
          ok: false as const,
          error: "Province and municipality are required for students.",
        };
      }
      const id = `${input.role}-${crypto.randomUUID().slice(0, 8)}`;
      const newUser: User = {
        id,
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        createdAt: new Date().toISOString(),
        childIds: input.role === "parent" ? [] : undefined,
        classIds: input.role === "student" || input.role === "teacher" ? [] : undefined,
        province: input.role === "student" ? input.province : undefined,
        municipality: input.role === "student" ? input.municipality : undefined,
      };
      setState((prev) => {
        let next = { ...prev, users: [...prev.users, newUser] };
        if (input.role === "student") next = ensureStudentProgress(next, id);
        return next;
      });
      setSession({ userId: id });
      return { ok: true as const };
    },
    [state.users],
  );

  const logout = useCallback(() => setSession(null), []);

  const resetDemo = useCallback(() => {
    const initial = createInitialState();
    setState(initial);
    setSession(null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId && u.role !== "admin"),
      progress: prev.progress.filter((p) => p.studentId !== userId),
      classes: prev.classes.map((c) => ({
        ...c,
        studentIds: c.studentIds.filter((id) => id !== userId),
        pendingStudentIds: c.pendingStudentIds.filter((id) => id !== userId),
      })),
      groups: prev.groups.map((g) => ({
        ...g,
        memberIds: g.memberIds.filter((id) => id !== userId),
      })),
    }));
    setSession((s) => (s?.userId === userId ? null : s));
  }, []);

  const createTeacher = useCallback((input: { name: string; email: string; password: string }) => {
    setState((prev) => {
      if (prev.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) return prev;
      const teacher: User = {
        id: `teacher-${crypto.randomUUID().slice(0, 8)}`,
        name: input.name,
        email: input.email,
        password: input.password,
        role: "teacher",
        classIds: [],
        createdAt: new Date().toISOString(),
      };
      return { ...prev, users: [...prev.users, teacher] };
    });
  }, []);

  const updateTerms = useCallback((terms: Term[]) => {
    setState((prev) => ({ ...prev, terms }));
  }, []);

  const upsertWeekLesson = useCallback(
    (termId: string, weekId: string, day: WeekDay, patch: Partial<Lesson>) => {
      setState((prev) => ({
        ...prev,
        terms: prev.terms.map((term) => {
          if (term.id !== termId) return term;
          return {
            ...term,
            weeks: term.weeks.map((week) => {
              if (week.id !== weekId) return week;
              return {
                ...week,
                lessons: week.lessons.map((lesson) =>
                  lesson.day === day ? { ...lesson, ...patch } : lesson,
                ),
              };
            }),
          };
        }),
      }));
    },
    [],
  );

  const setWeekTest = useCallback(
    (
      termId: string,
      weekId: string,
      patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
    ) => {
      setState((prev) => ({
        ...prev,
        terms: prev.terms.map((term) =>
          term.id !== termId
            ? term
            : {
                ...term,
                weeks: term.weeks.map((w) =>
                  w.id !== weekId
                    ? w
                    : {
                        ...w,
                        weekTest: {
                          ...w.weekTest,
                          ...(patch.title !== undefined ? { title: patch.title } : {}),
                          ...(patch.resources !== undefined
                            ? { resources: patch.resources }
                            : {}),
                          ...(patch.memoResources !== undefined
                            ? { memoResources: patch.memoResources }
                            : {}),
                        },
                      },
                ),
              },
        ),
      }));
    },
    [],
  );

  const setPreExam = useCallback(
    (
      termId: string,
      patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
    ) => {
      setState((prev) => ({
        ...prev,
        terms: prev.terms.map((term) =>
          term.id !== termId
            ? term
            : {
                ...term,
                preExam: {
                  ...term.preExam,
                  ...(patch.title !== undefined ? { title: patch.title } : {}),
                  ...(patch.resources !== undefined ? { resources: patch.resources } : {}),
                  ...(patch.memoResources !== undefined
                    ? { memoResources: patch.memoResources }
                    : {}),
                },
              },
        ),
      }));
    },
    [],
  );

  const setPastPaper = useCallback(
    (
      termId: string,
      patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
    ) => {
      setState((prev) => ({
        ...prev,
        terms: prev.terms.map((term) =>
          term.id !== termId
            ? term
            : {
                ...term,
                pastPaper: {
                  ...term.pastPaper,
                  ...(patch.title !== undefined ? { title: patch.title } : {}),
                  ...(patch.resources !== undefined ? { resources: patch.resources } : {}),
                  ...(patch.memoResources !== undefined
                    ? { memoResources: patch.memoResources }
                    : {}),
                },
              },
        ),
      }));
    },
    [],
  );

  const createGroup = useCallback((input: { name: string; description: string; termId?: string }) => {
    const group: StudyGroup = {
      id: `group-${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      description: input.description,
      termId: input.termId,
      memberIds: [],
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, groups: [...prev.groups, group] }));
  }, []);

  const addMemberToGroup = useCallback((groupId: string, studentId: string) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId && !g.memberIds.includes(studentId)
          ? { ...g, memberIds: [...g.memberIds, studentId] }
          : g,
      ),
    }));
  }, []);

  const removeMemberFromGroup = useCallback((groupId: string, studentId: string) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== studentId) } : g,
      ),
    }));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setState((prev) => ({ ...prev, groups: prev.groups.filter((g) => g.id !== groupId) }));
  }, []);

  const completeLesson = useCallback((studentId: string, lessonId: string) => {
    setState((prev) => {
      const next = ensureStudentProgress(prev, studentId);
      return {
        ...next,
        progress: next.progress.map((p) => {
          if (p.studentId !== studentId) return p;
          if (p.completedLessonIds.includes(lessonId)) return p;
          return recomputeProgress({
            ...p,
            completedLessonIds: [...p.completedLessonIds, lessonId],
          });
        }),
      };
    });
  }, []);

  const submitTestScore = useCallback((studentId: string, assessmentId: string, score: number) => {
    setState((prev) => {
      const next = ensureStudentProgress(prev, studentId);
      return {
        ...next,
        progress: next.progress.map((p) => {
          if (p.studentId !== studentId) return p;
          return recomputeProgress({
            ...p,
            testScores: { ...p.testScores, [assessmentId]: score },
          });
        }),
      };
    });
  }, []);

  const addCorrection = useCallback(
    (correction: Omit<CorrectionResult, "id" | "createdAt">) => {
      const full: CorrectionResult = {
        ...correction,
        id: `corr-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, corrections: [full, ...prev.corrections] }));
      return full;
    },
    [],
  );

  const createClass = useCallback((teacherId: string, name: string) => {
    const schoolClass: SchoolClass = {
      id: `class-${crypto.randomUUID().slice(0, 8)}`,
      name,
      teacherId,
      studentIds: [],
      pendingStudentIds: [],
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      classes: [...prev.classes, schoolClass],
      users: prev.users.map((u) =>
        u.id === teacherId
          ? { ...u, classIds: [...(u.classIds ?? []), schoolClass.id] }
          : u,
      ),
    }));
  }, []);

  const searchStudents = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      return state.users.filter(
        (u) =>
          u.role === "student" &&
          (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
      );
    },
    [state.users],
  );

  const requestJoinClass = useCallback((classId: string, studentId: string) => {
    setState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => {
        if (c.id !== classId) return c;
        if (c.studentIds.includes(studentId) || c.pendingStudentIds.includes(studentId)) return c;
        return { ...c, pendingStudentIds: [...c.pendingStudentIds, studentId] };
      }),
    }));
  }, []);

  const acceptStudent = useCallback((classId: string, studentId: string) => {
    setState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          pendingStudentIds: c.pendingStudentIds.filter((id) => id !== studentId),
          studentIds: c.studentIds.includes(studentId)
            ? c.studentIds
            : [...c.studentIds, studentId],
        };
      }),
      users: prev.users.map((u) =>
        u.id === studentId
          ? { ...u, classIds: Array.from(new Set([...(u.classIds ?? []), classId])) }
          : u,
      ),
    }));
  }, []);

  const addStudentToClass = useCallback((classId: string, studentId: string) => {
    setState((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => {
        if (c.id !== classId) return c;
        if (c.studentIds.includes(studentId)) return c;
        return {
          ...c,
          studentIds: [...c.studentIds, studentId],
          pendingStudentIds: c.pendingStudentIds.filter((id) => id !== studentId),
        };
      }),
      users: prev.users.map((u) =>
        u.id === studentId
          ? { ...u, classIds: Array.from(new Set([...(u.classIds ?? []), classId])) }
          : u,
      ),
    }));
  }, []);

  const createTeacherLesson = useCallback((lesson: Omit<Lesson, "id"> & { id?: string }) => {
    const full: Lesson = {
      ...lesson,
      id: lesson.id ?? `tl-${crypto.randomUUID().slice(0, 8)}`,
    };
    setState((prev) => ({ ...prev, teacherLessons: [...prev.teacherLessons, full] }));
  }, []);

  const sendMessage = useCallback(
    (input: { fromUserId: string; toUserId: string; studentId?: string; body: string }) => {
      const message: Message = {
        id: `msg-${crypto.randomUUID().slice(0, 8)}`,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        studentId: input.studentId,
        body: input.body,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setState((prev) => ({ ...prev, messages: [message, ...prev.messages] }));
    },
    [],
  );

  const markMessageRead = useCallback((messageId: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
    }));
  }, []);

  const value: StoreContextValue = {
    ready,
    state,
    user,
    login,
    signup,
    logout,
    resetDemo,
    deleteUser,
    createTeacher,
    updateTerms,
    upsertWeekLesson,
    setWeekTest,
    setPreExam,
    setPastPaper,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteGroup,
    completeLesson,
    submitTestScore,
    addCorrection,
    createClass,
    searchStudents,
    requestJoinClass,
    acceptStudent,
    addStudentToClass,
    createTeacherLesson,
    sendMessage,
    markMessageRead,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useRequireRole(roles: Role[]) {
  const { user, ready } = useStore();
  return { user, ready, allowed: !!user && roles.includes(user.role) };
}
