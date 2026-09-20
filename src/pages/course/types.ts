export type ProgressStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'LOCKED';

export type LessonType = 'VIDEO' | 'DOCUMENT' | 'TEST';

export type CourseRecord = {
  id: string;
  title?: string;
  titleuz?: string;
  titleru?: string;
  description?: string;
  descriptionuz?: string;
  descriptionru?: string;
  instructor?: string;
  moduleCount?: number | null;
  videoCount?: number | null;
  materialCount?: number | null;
  testCount?: number | null;
};

export type CourseTopicRecord = {
  id: string;
  title: string;
  course?: CourseRecord;
  files?: CourseMaterialRecord[];
};

export type CourseMaterialRecord = {
  id: string;
  url: string;
  objectName: string;
};

export type LearningMaterial = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  previewUrl: string;
  extension: string;
};

export type CourseVideoRecord = {
  id: string;
  title: string;
  link: string;
  topic?: {
    id: string;
    title: string;
  };
};

export type CourseTestRecord = {
  id: string;
  title: string;
  topicId: string;
  topicTitle?: string;
  questionCount?: number;
  passScore?: number;
};

export type CourseQuestionRecord = {
  id: string;
  text: string;
  answers: string[];
};

export type CourseProgressDto = {
  courseId: string;
  courseTitle?: string | null;
  instructor?: string | null;
  status: ProgressStatus;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt?: string | null;
  completedLessonCount?: number | null;
  totalLessonCount?: number | null;
};

export type MyCoursesProgressResponse = {
  list: CourseProgressDto[];
};

export type ModuleProgressDto = {
  moduleId: string;
  status: ProgressStatus;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
};

export type LessonProgressDto = {
  lessonItemId: string;
  status: ProgressStatus;
  score?: number | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type ProgressSnapshot = {
  course: CourseProgressDto;
  modules: ModuleProgressDto[];
  lessons: LessonProgressDto[];
};

export type LearningLesson = {
  id: string;
  title: string;
  type: LessonType;
  topicId: string;
  url?: string;
  externalUrl?: string;
  testId?: string;
  questionCount?: number;
};

export type LearningTopic = {
  id: string;
  title: string;
  lessons: LearningLesson[];
  materials: LearningMaterial[];
};

export type CourseCatalogMetrics = {
  moduleCount: number;
  lessonCount: number;
  videoCount: number;
  materialCount: number;
  testCount: number;
};

export type CourseCatalogItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: string;
  metrics: CourseCatalogMetrics;
};

export type CourseAccessGroupSummary = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  studentCount: number;
  courseCount: number;
  createdAt?: string | null;
};

export type CourseAccessCourseSummary = {
  courseId: string;
  courseTitle: string;
  instructor?: string | null;
};

export type CourseAccessOverrideSummary = {
  id: string;
  courseId: string;
  courseTitle: string;
  instructor?: string | null;
  accessMode: 'ALLOW' | 'DENY';
};

export type MyEffectiveCourseAccessResponse = {
  userId: string;
  groups: CourseAccessGroupSummary[];
  effectiveCourses: CourseAccessCourseSummary[];
  overrides: CourseAccessOverrideSummary[];
};

export type StartCoursePayload = {
  courseId: string;
  firstModuleId: string;
  firstLessonItemId: string;
};

export type OpenLessonPayload = {
  courseId: string;
  moduleId: string;
  lessonItemId: string;
};

export type CompleteLessonPayload = {
  courseId: string;
  moduleId: string;
  lessonItemId: string;
  lessonType: Exclude<LessonType, 'TEST'>;
};

export type SubmitTestPayload = {
  courseId: string;
  moduleId: string;
  lessonItemId: string;
  testId: string;
  answers?: Record<string, number>;
};

export type CourseAssetBundle = {
  videos: CourseVideoRecord[];
  tests: CourseTestRecord[];
};
