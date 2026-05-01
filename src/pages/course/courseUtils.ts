import {
  CourseAssetBundle,
  CourseCatalogItem,
  CourseCatalogMetrics,
  CourseMaterialRecord,
  CourseQuestionRecord,
  CourseRecord,
  CourseTestRecord,
  CourseTopicRecord,
  CourseVideoRecord,
  LearningLesson,
  LearningMaterial,
  LearningTopic,
  LessonProgressDto,
  ModuleProgressDto,
  ProgressSnapshot,
  ProgressStatus,
} from './types.ts';

const asArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

export const normalizeStatus = (value?: unknown): ProgressStatus => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (
    normalized === 'NOT_STARTED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'COMPLETED' ||
    normalized === 'FAILED' ||
    normalized === 'LOCKED'
  ) {
    return normalized;
  }

  return 'NOT_STARTED';
};

export const pickCourseTitle = (course?: Partial<CourseRecord>) => {
  return (
    course?.titleuz?.trim() ||
    course?.titleru?.trim() ||
    'Kurs nomi kiritilmagan'
  );
};

export const pickCourseSubtitle = (course?: Partial<CourseRecord>) => {
  return (
    course?.titleru?.trim() ||
    course?.titleuz?.trim() ||
    'Masofaviy ta’lim kursi'
  );
};

export const pickCourseDescription = (course?: Partial<CourseRecord>) => {
  return (
    course?.descriptionuz?.trim() ||
    course?.descriptionru?.trim() ||
    'Ushbu kurs modullar, video darslar, materiallar va testlar asosida tashkil qilingan.'
  );
};

export const normalizeProgressSnapshot = (raw: any, courseId: string): ProgressSnapshot => {
  const course = raw?.course ?? {};
  const modules = asArray<ModuleProgressDto>(raw?.modules).map((module) => ({
    moduleId: String((module as any)?.moduleId ?? ''),
    status: normalizeStatus((module as any)?.status),
    progressPercent: Number((module as any)?.progressPercent ?? 0) || 0,
    startedAt: (module as any)?.startedAt ?? null,
    completedAt: (module as any)?.completedAt ?? null,
  }));
  const lessons = asArray<LessonProgressDto>(raw?.lessons).map((lesson) => ({
    lessonItemId: String((lesson as any)?.lessonItemId ?? ''),
    status: normalizeStatus((lesson as any)?.status),
    score:
      typeof (lesson as any)?.score === 'number'
        ? (lesson as any).score
        : null,
    startedAt: (lesson as any)?.startedAt ?? null,
    completedAt: (lesson as any)?.completedAt ?? null,
  }));

  return {
    course: {
      courseId: String(course?.courseId ?? courseId),
      courseTitle: course?.courseTitle ?? null,
      instructor: course?.instructor ?? null,
      status: normalizeStatus(course?.status),
      progressPercent: Number(course?.progressPercent ?? 0) || 0,
      startedAt: course?.startedAt ?? null,
      completedAt: course?.completedAt ?? null,
    },
    modules,
    lessons,
  };
};

export const createEmptyProgressSnapshot = (courseId: string): ProgressSnapshot => ({
  course: {
    courseId,
    status: 'NOT_STARTED',
    progressPercent: 0,
    startedAt: null,
    completedAt: null,
  },
  modules: [],
  lessons: [],
});

export const getLessonItemId = (lesson: LearningLesson) => {
  if (lesson.type === 'TEST' && lesson.testId) {
    return `${lesson.topicId}-test-${lesson.testId}`;
  }

  return lesson.id;
};

export const buildLearningTopics = (
  topics: CourseTopicRecord[],
  assetsMap: Record<string, CourseAssetBundle>
): LearningTopic[] => {
  return topics.map((topic) => {
    const bundle = assetsMap[topic.id] ?? { videos: [], tests: [] };
    const materials = asArray<CourseMaterialRecord>(topic.files);

    const videoLessons: LearningLesson[] = bundle.videos.map((video) => ({
      id: video.id,
      title: video.title || 'Video dars',
      type: 'VIDEO',
      topicId: topic.id,
      externalUrl: video.link,
    }));

    const materialItems: LearningMaterial[] = materials.map((file, index) => {
      const fileName = file.objectName || file.url.split('/').pop() || '';
      const title = buildMaterialTitle(fileName, index);
      return {
        id: file.id,
        title,
        fileName,
        url: file.url,
        previewUrl: resolveDocumentPreviewUrl(file.url),
        extension: extractFileExtension(fileName),
      };
    });

    const testLessons: LearningLesson[] = bundle.tests.map((test) => ({
      id: `${topic.id}-test-${test.id}`,
      title: test.title || 'Yakuniy test',
      type: 'TEST',
      topicId: topic.id,
      testId: test.id,
      questionCount: test.questionCount || 0,
    }));

    return {
      id: topic.id,
      title: topic.title || 'Mavzu',
      lessons: [...videoLessons, ...testLessons],
      materials: materialItems,
    };
  });
};

const extractFileExtension = (fileName: string) => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
};

const buildMaterialTitle = (fileName: string, index: number) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '').trim();
  const looksLikeGeneratedName =
    !withoutExtension ||
    /^[0-9a-f-]{20,}$/i.test(withoutExtension) ||
    /^[0-9a-f-]{8,}\s*(\(\d+\))?$/i.test(withoutExtension);

  if (looksLikeGeneratedName) {
    return `Qo‘shimcha material ${index + 1}`;
  }

  return withoutExtension;
};

export const getCourseMetrics = (
  courseId: string,
  topics: CourseTopicRecord[],
  videos: CourseVideoRecord[],
  tests: CourseTestRecord[]
): CourseCatalogMetrics => {
  const courseTopics = topics.filter((topic) => topic.course?.id === courseId);
  const topicIds = new Set(courseTopics.map((topic) => topic.id));
  const courseVideos = videos.filter((video) => topicIds.has(video.topic?.id || ''));
  const courseTests = tests.filter((test) => topicIds.has(test.topicId));
  const materialCount = courseTopics.reduce(
    (total, topic) => total + asArray<CourseMaterialRecord>(topic.files).length,
    0
  );

  return {
    moduleCount: courseTopics.length,
    lessonCount: courseVideos.length + materialCount + courseTests.length,
    videoCount: courseVideos.length,
    materialCount,
    testCount: courseTests.length,
  };
};

export const buildCourseCatalogItems = (
  courses: CourseRecord[],
  topics: CourseTopicRecord[],
  videos: CourseVideoRecord[],
  tests: CourseTestRecord[]
): CourseCatalogItem[] => {
  return courses.map((course) => ({
    id: course.id,
    title: pickCourseTitle(course),
    subtitle: pickCourseSubtitle(course),
    description: pickCourseDescription(course),
    instructor: course.instructor?.trim() || 'IBMS mutaxassisi',
    metrics: getCourseMetrics(course.id, topics, videos, tests),
  }));
};

export const findFirstLesson = (topics: LearningTopic[]) => {
  return topics.find((topic) => topic.lessons.length > 0)?.lessons[0] ?? null;
};

export const findFirstTopicEntry = (topics: LearningTopic[]) => {
  for (const topic of topics) {
    if (topic.lessons.length > 0) {
      return {
        topicId: topic.id,
        lesson: topic.lessons[0],
        material: null,
      };
    }

    if (topic.materials.length > 0) {
      return {
        topicId: topic.id,
        lesson: null,
        material: topic.materials[0],
      };
    }
  }

  return null;
};

export const getModuleProgress = (
  snapshot: ProgressSnapshot | null,
  moduleId: string
) => {
  return snapshot?.modules.find((module) => module.moduleId === moduleId);
};

export const getLessonProgress = (
  snapshot: ProgressSnapshot | null,
  lessonId: string
) => {
  return snapshot?.lessons.find((lesson) => lesson.lessonItemId === lessonId);
};

export const getTopicCompletion = (
  snapshot: ProgressSnapshot | null,
  topic: LearningTopic
) => {
  const completedLessons = topic.lessons.filter((lesson) => {
    const progress = getLessonProgress(snapshot, getLessonItemId(lesson));
    return progress?.status === 'COMPLETED';
  }).length;
  const completedMaterials = topic.materials.filter((material) => {
    const progress = getLessonProgress(snapshot, material.id);
    return progress?.status === 'COMPLETED';
  }).length;
  const total = topic.lessons.length + topic.materials.length;
  const completed = completedLessons + completedMaterials;

  return {
    completed,
    total,
    percent: total
      ? Math.round((completed / total) * 100)
      : 0,
  };
};

export const getLessonVisualState = (
  snapshot: ProgressSnapshot | null,
  topic: LearningTopic,
  lesson: LearningLesson
) => {
  const moduleProgress = getModuleProgress(snapshot, topic.id);
  const lessonProgress = getLessonProgress(snapshot, getLessonItemId(lesson));

  if (lessonProgress?.status === 'COMPLETED') return 'completed';
  if (lessonProgress?.status === 'FAILED') return 'failed';
  if (lessonProgress?.status === 'IN_PROGRESS') return 'active';
  if (lessonProgress?.status === 'LOCKED' || moduleProgress?.status === 'LOCKED') {
    return 'locked';
  }

  return 'available';
};

export const resolveVideoEmbedUrl = (url?: string) => {
  if (!url) return '';

  if (url.includes('youtube.com/watch')) {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  return url;
};

export const resolveDocumentPreviewUrl = (url?: string) => {
  if (!url) return '';

  const normalized = url.toLowerCase();

  if (normalized.endsWith('.pdf')) {
    return url;
  }

  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
};

export const calculateTestResult = (
  questions: Array<CourseQuestionRecord & { correctIndex?: number }>,
  answers: Record<string | number, number>
) => {
  const totalQuestions = questions.length;
  const solvedCount = Object.keys(answers).length;
  const correctCount = questions.reduce((count, question, index) => {
    if (typeof question.correctIndex !== 'number') {
      return count;
    }
    return answers[question.id || index] === question.correctIndex ? count + 1 : count;
  }, 0);
  const scorePercent = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  return {
    totalQuestions,
    solvedCount,
    correctCount,
    scorePercent,
  };
};
