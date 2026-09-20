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
import type { AppLanguage } from '../../i18n/index.ts';

const asArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const normalizeUzbekApostrophes = (value: string) =>
  value.replace(/[ʻʼ‘’`´]/g, "'");

export const transliterateUzbekToCyrillic = (value?: string | null) => {
  if (!value) return '';

  let result = normalizeUzbekApostrophes(value);

  const compoundRules: Array<[RegExp, string]> = [
    [/O'/g, 'Ў'],
    [/o'/g, 'ў'],
    [/G'/g, 'Ғ'],
    [/g'/g, 'ғ'],
    [/SH/g, 'Ш'],
    [/Sh/g, 'Ш'],
    [/sh/g, 'ш'],
    [/CH/g, 'Ч'],
    [/Ch/g, 'Ч'],
    [/ch/g, 'ч'],
    [/YO/g, 'Ё'],
    [/Yo/g, 'Ё'],
    [/yo/g, 'ё'],
    [/YU/g, 'Ю'],
    [/Yu/g, 'Ю'],
    [/yu/g, 'ю'],
    [/YA/g, 'Я'],
    [/Ya/g, 'Я'],
    [/ya/g, 'я'],
  ];

  compoundRules.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });

  const singleCharMap: Record<string, string> = {
    A: 'А',
    a: 'а',
    B: 'Б',
    b: 'б',
    D: 'Д',
    d: 'д',
    E: 'Е',
    e: 'е',
    F: 'Ф',
    f: 'ф',
    G: 'Г',
    g: 'г',
    H: 'Ҳ',
    h: 'ҳ',
    I: 'И',
    i: 'и',
    J: 'Ж',
    j: 'ж',
    K: 'К',
    k: 'к',
    L: 'Л',
    l: 'л',
    M: 'М',
    m: 'м',
    N: 'Н',
    n: 'н',
    O: 'О',
    o: 'о',
    P: 'П',
    p: 'п',
    Q: 'Қ',
    q: 'қ',
    R: 'Р',
    r: 'р',
    S: 'С',
    s: 'с',
    T: 'Т',
    t: 'т',
    U: 'У',
    u: 'у',
    V: 'В',
    v: 'в',
    X: 'Х',
    x: 'х',
    Y: 'Й',
    y: 'й',
    Z: 'З',
    z: 'з',
    "'": 'ъ',
  };

  return Array.from(result)
    .map((char) => singleCharMap[char] ?? char)
    .join('');
};

export const localizeCourseText = (
  value: string | null | undefined,
  language: AppLanguage
) => {
  const normalized = value?.trim() || '';
  if (!normalized) return '';
  return language === 'uz-Cyrl'
    ? transliterateUzbekToCyrillic(normalized)
    : normalized;
};

const pickLocalizedCourseField = (
  course: Partial<CourseRecord> | undefined,
  language: AppLanguage,
  primaryKey: 'title' | 'description',
  uzKey: 'titleuz' | 'descriptionuz',
  ruKey: 'titleru' | 'descriptionru',
  fallback: string
) => {
  const preferredValue =
    language === 'ru'
      ? course?.[ruKey]?.trim() ||
        course?.[primaryKey]?.trim() ||
        course?.[uzKey]?.trim()
      : course?.[primaryKey]?.trim() ||
        course?.[uzKey]?.trim() ||
        course?.[ruKey]?.trim();

  if (!preferredValue) {
    return localizeCourseText(fallback, language);
  }

  if (language === 'uz-Cyrl') {
    const cyrillicSource =
      course?.[uzKey]?.trim() ||
      course?.[primaryKey]?.trim() ||
      preferredValue;
    return transliterateUzbekToCyrillic(cyrillicSource);
  }

  return preferredValue;
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

export const pickCourseTitle = (
  course?: Partial<CourseRecord>,
  language: AppLanguage = 'uz',
  fallback = 'Kurs nomi kiritilmagan'
) => {
  return pickLocalizedCourseField(
    course,
    language,
    'title',
    'titleuz',
    'titleru',
    fallback
  );
};

export const pickCourseSubtitle = (
  course?: Partial<CourseRecord>,
  language: AppLanguage = 'uz',
  fallback = 'Masofaviy ta’lim kursi'
) => {
  return pickLocalizedCourseField(
    course,
    language,
    'title',
    'titleuz',
    'titleru',
    fallback
  );
};

export const pickCourseDescription = (
  course?: Partial<CourseRecord>,
  language: AppLanguage = 'uz',
  fallback = 'Ushbu kurs modullar, video darslar, materiallar va testlar asosida tashkil qilingan.'
) => {
  return pickLocalizedCourseField(
    course,
    language,
    'description',
    'descriptionuz',
    'descriptionru',
    fallback
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
  assetsMap: Record<string, CourseAssetBundle>,
  language: AppLanguage = 'uz'
): LearningTopic[] => {
  return topics.map((topic) => {
    const bundle = assetsMap[topic.id] ?? { videos: [], tests: [] };
    const materials = asArray<CourseMaterialRecord>(topic.files);

    const videoLessons: LearningLesson[] = bundle.videos.map((video) => ({
      id: video.id,
      title: localizeCourseText(video.title || 'Video dars', language),
      type: 'VIDEO',
      topicId: topic.id,
      externalUrl: video.link,
    }));

    const materialItems: LearningMaterial[] = materials.map((file, index) => {
      const fileName = file.objectName || file.url.split('/').pop() || '';
      const title = buildMaterialTitle(fileName, index, language);
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
      title: localizeCourseText(test.title || 'Yakuniy test', language),
      type: 'TEST',
      topicId: topic.id,
      testId: test.id,
      questionCount: test.questionCount || 0,
    }));

    return {
      id: topic.id,
      title: localizeCourseText(topic.title || 'Mavzu', language),
      lessons: [...videoLessons, ...testLessons],
      materials: materialItems,
    };
  });
};

const extractFileExtension = (fileName: string) => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
};

const buildMaterialTitle = (
  fileName: string,
  index: number,
  language: AppLanguage = 'uz'
) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '').trim();
  const looksLikeGeneratedName =
    !withoutExtension ||
    /^[0-9a-f-]{20,}$/i.test(withoutExtension) ||
    /^[0-9a-f-]{8,}\s*(\(\d+\))?$/i.test(withoutExtension);

  if (looksLikeGeneratedName) {
    return localizeCourseText(`Qo‘shimcha material ${index + 1}`, language);
  }

  return localizeCourseText(withoutExtension, language);
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

const hasBackendMetrics = (course: CourseRecord) =>
  typeof course.moduleCount === 'number' ||
  typeof course.videoCount === 'number' ||
  typeof course.materialCount === 'number' ||
  typeof course.testCount === 'number';

const metricsFromCourse = (course: CourseRecord): CourseCatalogMetrics => {
  const moduleCount = course.moduleCount ?? 0;
  const videoCount = course.videoCount ?? 0;
  const materialCount = course.materialCount ?? 0;
  const testCount = course.testCount ?? 0;

  return {
    moduleCount,
    videoCount,
    materialCount,
    testCount,
    lessonCount: videoCount + materialCount + testCount,
  };
};

export const buildCourseCatalogItems = (
  courses: CourseRecord[],
  topics: CourseTopicRecord[],
  videos: CourseVideoRecord[],
  tests: CourseTestRecord[],
  language: AppLanguage = 'uz'
): CourseCatalogItem[] => {
  return courses.map((course) => ({
    id: course.id,
    title: pickCourseTitle(course, language),
    subtitle: pickCourseSubtitle(course, language),
    description: pickCourseDescription(course, language),
    instructor: course.instructor?.trim() || 'IBMS mutaxassisi',
    metrics: hasBackendMetrics(course)
      ? metricsFromCourse(course)
      : getCourseMetrics(course.id, topics, videos, tests),
  }));
};

export type CourseOutlineItem = {
  key: string;
  topicId: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'TEST';
  embedUrl?: string;
  fileUrl?: string;
  fileName?: string;
  testId?: string;
  questionCount?: number;
};

export type FilePreviewKind = 'pdf' | 'image' | 'other';

// Faqat brauzer o'zi ko'rsata oladigan fayllar inline ochiladi.
// Office fayllar (ppt, docx...) iframe'da avto-download qilib yuboradi — ular uchun karta ko'rsatiladi.
export const getFilePreviewKind = (fileName?: string | null): FilePreviewKind => {
  const extension = (fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }
  return 'other';
};

export type CourseOutlineTopic = {
  id: string;
  title: string;
  items: CourseOutlineItem[];
};

// Backend katalogi bilan bir xil tartib: videolar -> materiallar -> testlar
export const buildCourseOutline = (
  topics: CourseTopicRecord[],
  assetsMap: Record<string, CourseAssetBundle>,
  language: AppLanguage = 'uz'
): CourseOutlineTopic[] => {
  return topics.map((topic) => {
    const bundle = assetsMap[topic.id] ?? { videos: [], tests: [] };
    const materials = asArray<CourseMaterialRecord>(topic.files);

    const items: CourseOutlineItem[] = [
      ...bundle.videos.map((video) => ({
        key: video.id,
        topicId: topic.id,
        title: localizeCourseText(video.title || 'Video dars', language),
        type: 'VIDEO' as const,
        embedUrl: resolveVideoEmbedUrl(video.link),
      })),
      ...materials.map((file, index) => {
        const fileName = file.objectName || file.url.split('/').pop() || '';
        return {
          key: file.id,
          topicId: topic.id,
          title: buildMaterialTitle(fileName, index, language),
          type: 'DOCUMENT' as const,
          fileUrl: file.url,
          fileName,
        };
      }),
      ...bundle.tests.map((test) => ({
        key: `${topic.id}-test-${test.id}`,
        topicId: topic.id,
        title: localizeCourseText(test.title || 'Yakuniy test', language),
        type: 'TEST' as const,
        testId: test.id,
        questionCount: test.questionCount || 0,
      })),
    ];

    return {
      id: topic.id,
      title: localizeCourseText(topic.title || 'Mavzu', language),
      items,
    };
  });
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
  // Materiallar ixtiyoriy — foiz faqat video va testlar bo'yicha hisoblanadi (backend bilan bir xil)
  const completed = topic.lessons.filter((lesson) => {
    const progress = getLessonProgress(snapshot, getLessonItemId(lesson));
    return progress?.status === 'COMPLETED';
  }).length;
  const total = topic.lessons.length;

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

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// "15", "90s", "1m30s", "1h2m3s" ko'rinishidagi t= parametrini sekundga o'giradi
const parseYoutubeStartSeconds = (value: string | null) => {
  if (!value) return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10) || null;
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return null;
  const total =
    Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  return total > 0 ? total : null;
};

const extractYoutubeVideo = (
  rawUrl: string
): { videoId: string; startSeconds: number | null } | null => {
  const trimmed = rawUrl.trim();

  // Admin faqat video ID kiritgan bo'lsa ham qabul qilamiz
  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return { videoId: trimmed, startSeconds: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\.|^m\./, '');
  const segments = parsed.pathname.split('/').filter(Boolean);
  let videoId: string | null = null;

  if (host === 'youtu.be') {
    videoId = segments[0] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (segments[0] === 'watch') {
      videoId = parsed.searchParams.get('v');
    } else if (['shorts', 'live', 'embed', 'v'].includes(segments[0] || '')) {
      videoId = segments[1] || null;
    } else {
      videoId = parsed.searchParams.get('v');
    }
  } else {
    return null;
  }

  if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) {
    return null;
  }

  return {
    videoId,
    startSeconds: parseYoutubeStartSeconds(
      parsed.searchParams.get('t') || parsed.searchParams.get('start')
    ),
  };
};

export const resolveVideoEmbedUrl = (url?: string) => {
  if (!url) return '';

  const youtube = extractYoutubeVideo(url);
  if (youtube) {
    const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
    if (youtube.startSeconds) {
      params.set('start', String(youtube.startSeconds));
    }
    return `https://www.youtube.com/embed/${youtube.videoId}?${params.toString()}`;
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
