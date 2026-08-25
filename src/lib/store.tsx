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
import {
  getProfile,
  getProfileWithRetry,
  getSessionUser,
  signInWithPassword,
  signOut as supabaseSignOut,
  signUpWithPassword,
  type ProfileRow,
} from "@/lib/auth-client";
import { createInitialState } from "@/lib/mock/seed";
import { SEED_TERMS } from "@/lib/mock/curriculum";
import { isValidMunicipality } from "@/lib/sa-geography";
import {
  addGroupMember,
  deleteProgress,
  deleteStudyGroup,
  insertMessage,
  insertSchoolClass,
  insertStudyGroup,
  insertTeacherLesson,
  loadAppState,
  markMessageReadDb,
  removeGroupMember,
  saveCurriculum,
  saveTheme,
  updateProfileRow,
  upsertClassMember,
} from "@/lib/supabase/app-state";
import type {
  AppState,
  CorrectionResult,
  Lesson,
  Message,
  Resource,
  Role,
  SchoolClass,
  StudentProgress,
  StudyGroup,
  Term,
  User,
  WeekDay,
} from "@/lib/types";

export type Theme = "light" | "dark";

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

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

function profileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: "",
    role: profile.role,
    createdAt: profile.created_at,
    parentId: profile.parent_id ?? undefined,
    childIds: profile.role === "parent" ? [] : undefined,
    classIds: profile.role === "student" || profile.role === "teacher" ? [] : undefined,
    province: profile.province ?? undefined,
    municipality: profile.municipality ?? undefined,
  };
}

/** Merge a freshly loaded profile into AppState using Auth UUID as the user id. */
function mergeProfileUser(prev: AppState, profile: ProfileRow): AppState {
  const user = profileToUser(profile);
  const existingIdx = prev.users.findIndex((u) => u.id === profile.id);
  let users: User[];
  if (existingIdx >= 0) {
    users = prev.users.map((u, i) =>
      i === existingIdx
        ? {
            ...u,
            name: user.name,
            email: user.email,
            role: user.role,
            parentId: user.parentId,
            province: user.province,
            municipality: user.municipality,
          }
        : u,
    );
  } else {
    users = [...prev.users, user];
  }
  let next: AppState = { ...prev, users };
  if (user.role === "student") next = ensureStudentProgress(next, user.id);
  return next;
}

function roleAccountArticle(role: Role): "a" | "an" {
  return role === "admin" ? "an" : "a";
}

interface StoreContextValue {
  ready: boolean;
  state: AppState;
  user: User | null;
  /** Suppress portal→login redirect while logout hard-navigates home. */
  signingOut: boolean;
  login: (
    email: string,
    password: string,
    expectedRole: Role,
  ) => Promise<{ ok: true; role: Role } | { ok: false; error: string }>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    province?: string;
    municipality?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateProfile: (input: {
    name: string;
    email: string;
    password?: string;
    province?: string;
    municipality?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  deleteUser: (userId: string) => Promise<void>;
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
  completeLesson: (
    studentId: string,
    lessonId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Apply server-scored progress row into the in-memory cache. */
  applyProgress: (progress: StudentProgress) => void;
  /** Apply server-created correction into the in-memory cache. */
  applyCorrection: (correction: CorrectionResult) => void;
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

function persistTerms(next: AppState) {
  void saveCurriculum(next.terms, next.badges);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setThemeState] = useState<Theme>("light");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const authUser = await getSessionUser();
        if (!authUser) {
          if (!cancelled) {
            setState(createInitialState());
            setSession(null);
            setThemeState("light");
            applyThemeClass("light");
            setReady(true);
          }
          return;
        }

        const loaded = await loadAppState();
        if (cancelled) return;
        setState(normalizeAppState(loaded.state));
        setSession(loaded.userId ? { userId: loaded.userId } : null);
        setThemeState(loaded.theme);
        applyThemeClass(loaded.theme);
        setReady(true);
      } catch {
        if (!cancelled) {
          setState(createInitialState());
          setSession(null);
          setReady(true);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyThemeClass(next);
      if (session?.userId) void saveTheme(session.userId, next);
    },
    [session],
  );

  const user = useMemo(
    () => state.users.find((u) => u.id === session?.userId) ?? null,
    [state.users, session],
  );

  const reloadFromSupabase = useCallback(async () => {
    const loaded = await loadAppState();
    setState(normalizeAppState(loaded.state));
    setSession(loaded.userId ? { userId: loaded.userId } : null);
    setThemeState(loaded.theme);
    applyThemeClass(loaded.theme);
  }, []);

  const login = useCallback(
    async (email: string, password: string, expectedRole: Role) => {
      const auth = await signInWithPassword(email, password);
      if (!auth.ok) {
        return { ok: false as const, error: "Invalid email or password." };
      }
      const profile = await getProfile(auth.user.id);
      if (!profile) {
        await supabaseSignOut();
        return { ok: false as const, error: "Profile not found. Contact support." };
      }
      if (profile.role !== expectedRole) {
        await supabaseSignOut();
        return {
          ok: false as const,
          error: `This account is not ${roleAccountArticle(expectedRole)} ${expectedRole} account.`,
        };
      }
      const loaded = await loadAppState();
      setState(normalizeAppState(loaded.state));
      setSession({ userId: profile.id });
      setThemeState(loaded.theme);
      applyThemeClass(loaded.theme);
      return { ok: true as const, role: profile.role };
    },
    [],
  );

  const signup = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role: Role;
      province?: string;
      municipality?: string;
    }) => {
      if (input.role === "student") {
        if (!input.province || !input.municipality) {
          return {
            ok: false as const,
            error: "Province and municipality are required for students.",
          };
        }
        if (!isValidMunicipality(input.province, input.municipality)) {
          return {
            ok: false as const,
            error: "Please select a valid municipality for the chosen province.",
          };
        }
      }

      const created = await signUpWithPassword(input);
      if (!created.ok) return created;

      const profile = await getProfileWithRetry(created.userId);
      if (!profile) {
        return { ok: false as const, error: "Account created but profile missing." };
      }
      if (profile.role !== input.role) {
        await supabaseSignOut();
        return {
          ok: false as const,
          error: `This account is not ${roleAccountArticle(input.role)} ${input.role} account.`,
        };
      }

      const loaded = await loadAppState();
      let next = normalizeAppState(loaded.state);
      next = mergeProfileUser(next, profile);
      if (profile.role === "student") {
        next = ensureStudentProgress(next, profile.id);
      }
      setState(next);
      setSession({ userId: profile.id });
      setThemeState(loaded.theme);
      applyThemeClass(loaded.theme);
      return { ok: true as const };
    },
    [],
  );

  const logout = useCallback(async () => {
    setSigningOut(true);
    await supabaseSignOut();
    setSession(null);
    setState(createInitialState());
    setThemeState("light");
    applyThemeClass("light");
  }, []);

  const updateProfile = useCallback(
    async (input: {
      name: string;
      email: string;
      password?: string;
      province?: string;
      municipality?: string;
    }) => {
      if (!session?.userId) {
        return { ok: false as const, error: "You must be signed in to update your profile." };
      }
      const current = state.users.find((u) => u.id === session.userId);
      if (!current) {
        return { ok: false as const, error: "User not found." };
      }
      if (current.role === "student") {
        if (!input.province || !input.municipality) {
          return {
            ok: false as const,
            error: "Province and municipality are required for students.",
          };
        }
        if (!isValidMunicipality(input.province, input.municipality)) {
          return {
            ok: false as const,
            error: "Please select a valid municipality for the chosen province.",
          };
        }
      }
      if (input.password && input.password.trim().length > 0 && input.password.trim().length < 6) {
        return { ok: false as const, error: "Password must be at least 6 characters." };
      }

      const result = await updateProfileRow(session.userId, input);
      if (!result.ok) return result;

      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => {
          if (u.id !== current.id) return u;
          return {
            ...u,
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            province: u.role === "student" ? input.province : u.province,
            municipality: u.role === "student" ? input.municipality : u.municipality,
          };
        }),
      }));
      return { ok: true as const };
    },
    [session, state.users],
  );

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await fetch("/api/auth/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      /* ignore network errors; still clear local cache */
    }
    void deleteProgress(userId);
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

  const updateTerms = useCallback((terms: Term[]) => {
    setState((prev) => {
      const next = { ...prev, terms };
      persistTerms(next);
      return next;
    });
  }, []);

  const upsertWeekLesson = useCallback(
    (termId: string, weekId: string, day: WeekDay, patch: Partial<Lesson>) => {
      setState((prev) => {
        const next = {
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
        };
        persistTerms(next);
        return next;
      });
    },
    [],
  );

  const setWeekTest = useCallback(
    (
      termId: string,
      weekId: string,
      patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
    ) => {
      setState((prev) => {
        const next = {
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
        };
        persistTerms(next);
        return next;
      });
    },
    [],
  );

  const setPreExam = useCallback(
    (
      termId: string,
      patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
    ) => {
      setState((prev) => {
        const next = {
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
        };
        persistTerms(next);
        return next;
      });
    },
    [],
  );

  const setPastPaper = useCallback(
    (
      termId: string,
      patch: { title?: string; resources?: Resource[]; memoResources?: Resource[] },
    ) => {
      setState((prev) => {
        const next = {
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
        };
        persistTerms(next);
        return next;
      });
    },
    [],
  );

  const createGroup = useCallback((input: { name: string; description: string; termId?: string }) => {
    const group: StudyGroup = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      termId: input.termId,
      memberIds: [],
      createdAt: new Date().toISOString(),
    };
    void insertStudyGroup(group);
    setState((prev) => ({ ...prev, groups: [...prev.groups, group] }));
  }, []);

  const addMemberToGroup = useCallback((groupId: string, studentId: string) => {
    void addGroupMember(groupId, studentId);
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
    void removeGroupMember(groupId, studentId);
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== studentId) } : g,
      ),
    }));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    void deleteStudyGroup(groupId);
    setState((prev) => ({ ...prev, groups: prev.groups.filter((g) => g.id !== groupId) }));
  }, []);

  const completeLesson = useCallback(
    async (studentId: string, lessonId: string) => {
      void studentId; // session identity is authoritative on the server
      try {
        const res = await fetch("/api/progress/complete-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ lessonId }),
        });
        const body = (await res.json()) as {
          ok?: boolean;
          error?: string;
          progress?: StudentProgress;
        };
        if (!res.ok || !body.ok || !body.progress) {
          return { ok: false as const, error: body.error ?? "Could not complete lesson." };
        }
        setState((prev) => {
          const without = prev.progress.filter((p) => p.studentId !== body.progress!.studentId);
          return { ...prev, progress: [...without, body.progress!] };
        });
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : "Could not complete lesson.",
        };
      }
    },
    [],
  );

  const applyProgress = useCallback((progress: StudentProgress) => {
    setState((prev) => {
      const without = prev.progress.filter((p) => p.studentId !== progress.studentId);
      return { ...prev, progress: [...without, progress] };
    });
  }, []);

  const applyCorrection = useCallback((correction: CorrectionResult) => {
    setState((prev) => ({
      ...prev,
      corrections: [correction, ...prev.corrections.filter((c) => c.id !== correction.id)],
    }));
  }, []);

  const createClass = useCallback((teacherId: string, name: string) => {
    const schoolClass: SchoolClass = {
      id: crypto.randomUUID(),
      name,
      teacherId,
      studentIds: [],
      pendingStudentIds: [],
      createdAt: new Date().toISOString(),
    };
    void insertSchoolClass(schoolClass);
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
    void upsertClassMember(classId, studentId, "pending");
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
    void upsertClassMember(classId, studentId, "enrolled");
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
    void upsertClassMember(classId, studentId, "enrolled");
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
      id: lesson.id ?? crypto.randomUUID(),
    };
    void insertTeacherLesson(full);
    setState((prev) => ({ ...prev, teacherLessons: [...prev.teacherLessons, full] }));
  }, []);

  const sendMessage = useCallback(
    (input: { fromUserId: string; toUserId: string; studentId?: string; body: string }) => {
      const message: Message = {
        id: crypto.randomUUID(),
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        studentId: input.studentId,
        body: input.body,
        createdAt: new Date().toISOString(),
        read: false,
      };
      void insertMessage(message);
      setState((prev) => ({ ...prev, messages: [message, ...prev.messages] }));
    },
    [],
  );

  const markMessageRead = useCallback((messageId: string) => {
    void markMessageReadDb(messageId);
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
    }));
  }, []);

  const value: StoreContextValue = {
    ready,
    state,
    user,
    signingOut,
    login,
    signup,
    updateProfile,
    logout,
    theme,
    setTheme,
    deleteUser,
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
    applyProgress,
    applyCorrection,
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
