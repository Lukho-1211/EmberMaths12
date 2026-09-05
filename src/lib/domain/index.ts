export {
  canCompleteLesson,
  findAssessment,
  findLesson,
  type AssessmentKind,
  type FoundAssessment,
} from "@/lib/domain/find-curriculum";
export {
  emptyStudentProgress,
  recomputeProgress,
} from "@/lib/domain/recompute-progress";
export {
  stripCurriculumPayload,
  stripCurriculumSecrets,
  stripQuestion,
} from "@/lib/domain/strip-curriculum";
