import type {
  CourseAccessMode,
  CourseSearchItem,
  StudentGroupCourse,
  StudentGroupDetails,
  StudentGroupItem,
  StudentGroupStudent,
  UserCourseAccessOverride,
  UserEffectiveCourseAccess,
  UserListItem,
} from './groupTypes.ts';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const toRecord = (value: unknown): UnknownRecord | null => (isRecord(value) ? value : null);

const pickUnknown = (source: UnknownRecord | null, keys: string[]) => {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const pickString = (source: UnknownRecord | null, keys: string[]) => {
  const value = pickUnknown(source, keys);
  return typeof value === 'string' ? value.trim() : undefined;
};

const pickBoolean = (source: UnknownRecord | null, keys: string[]) => {
  const value = pickUnknown(source, keys);
  return typeof value === 'boolean' ? value : undefined;
};

const pickNumber = (source: UnknownRecord | null, keys: string[]) => {
  const value = pickUnknown(source, keys);
  return typeof value === 'number' ? value : undefined;
};

const readArray = (source: UnknownRecord | null, keys: string[]) => {
  const value = pickUnknown(source, keys);
  return Array.isArray(value) ? value : [];
};

const buildFullName = (...parts: Array<string | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

const normalizeRoles = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      const record = toRecord(item);
      return (
        pickString(record, ['name', 'role', 'roleName', 'authority', 'code']) || undefined
      );
    })
    .filter((item): item is string => Boolean(item));
};

const titleFromCourseRecord = (course: UnknownRecord | null) =>
  pickString(course, ['courseTitle', 'title', 'titleuz', 'titleru', 'name']);

export const normalizeGroupItem = (raw: unknown): StudentGroupItem => {
  const record = toRecord(raw);

  return {
    id: pickString(record, ['id', 'groupId']) || '',
    name: pickString(record, ['name', 'title']) || 'Nomsiz guruh',
    description: pickString(record, ['description', 'comment']) || null,
    active: pickBoolean(record, ['active', 'enabled']) ?? false,
    studentCount: pickNumber(record, ['studentCount', 'usersCount', 'memberCount']) ?? 0,
    courseCount: pickNumber(record, ['courseCount', 'coursesCount']) ?? 0,
    createdAt:
      pickString(record, ['createdAt', 'createAt', 'createdDate', 'created']) || '',
  };
};

export const normalizeStudent = (raw: unknown): StudentGroupStudent => {
  const record = toRecord(raw);
  const nestedUser = toRecord(pickUnknown(record, ['user', 'student', 'account']));

  const fullName =
    pickString(record, ['fullName', 'userFullName']) ||
    pickString(nestedUser, ['fullName', 'userFullName']) ||
    buildFullName(
      pickString(record, ['firstname', 'firstName']),
      pickString(record, ['lastname', 'lastName']),
      pickString(record, ['middlename', 'middleName'])
    ) ||
    buildFullName(
      pickString(nestedUser, ['firstname', 'firstName']),
      pickString(nestedUser, ['lastname', 'lastName']),
      pickString(nestedUser, ['middlename', 'middleName'])
    ) ||
    pickString(record, ['email']) ||
    pickString(nestedUser, ['email']) ||
    'Talaba';

  const rootRoles = normalizeRoles(pickUnknown(record, ['roles']));
  const nestedRoles = normalizeRoles(pickUnknown(nestedUser, ['roles']));
  const roles = rootRoles.length > 0 ? rootRoles : nestedRoles;

  return {
    id:
      pickString(record, ['id', 'userId', 'studentId', 'memberId']) ||
      pickString(nestedUser, ['id', 'userId']) ||
      '',
    fullName,
    email:
      pickString(record, ['email']) ||
      pickString(nestedUser, ['email']) ||
      'Email ko‘rsatilmagan',
    status:
      pickString(record, ['status', 'accountStatus']) ||
      pickString(nestedUser, ['status', 'accountStatus']) ||
      null,
    roles,
  };
};

export const normalizeGroupCourse = (raw: unknown): StudentGroupCourse => {
  const record = toRecord(raw);
  const nestedCourse = toRecord(pickUnknown(record, ['course']));

  return {
    courseId:
      pickString(record, ['courseId', 'id']) ||
      pickString(nestedCourse, ['id', 'courseId']) ||
      '',
    courseTitle: titleFromCourseRecord(record) || titleFromCourseRecord(nestedCourse) || null,
    instructor:
      pickString(record, ['instructor']) ||
      pickString(nestedCourse, ['instructor']) ||
      null,
  };
};

export const normalizeGroupDetails = (raw: unknown): StudentGroupDetails => {
  const record = toRecord(raw);

  return {
    group: normalizeGroupItem(pickUnknown(record, ['group']) || record),
    students: readArray(record, ['students', 'users', 'members']).map(normalizeStudent),
    courses: readArray(record, ['courses']).map(normalizeGroupCourse),
  };
};

export const normalizeUserListItem = (raw: unknown): UserListItem => {
  const record = toRecord(raw);

  return {
    id: pickString(record, ['id', 'userId']) || '',
    firstname: pickString(record, ['firstname', 'firstName']),
    lastname: pickString(record, ['lastname', 'lastName']),
    middlename: pickString(record, ['middlename', 'middleName']) || null,
    email: pickString(record, ['email']) || null,
    phoneNumber: pickString(record, ['phoneNumber', 'phone']) || null,
    status: pickString(record, ['status', 'accountStatus']) || null,
    roles: normalizeRoles(pickUnknown(record, ['roles'])),
  };
};

export const normalizeCourseSearchItem = (raw: unknown): CourseSearchItem => {
  const record = toRecord(raw);
  const nestedCourse = toRecord(pickUnknown(record, ['course']));

  return {
    id:
      pickString(record, ['id', 'courseId']) ||
      pickString(nestedCourse, ['id', 'courseId']) ||
      '',
    titleuz:
      pickString(record, ['titleuz', 'title', 'courseTitle']) ||
      pickString(nestedCourse, ['titleuz', 'title', 'courseTitle']) ||
      null,
    titleru: pickString(record, ['titleru']) || pickString(nestedCourse, ['titleru']) || null,
    instructor:
      pickString(record, ['instructor']) ||
      pickString(nestedCourse, ['instructor']) ||
      null,
  };
};

export const normalizeOverride = (raw: unknown): UserCourseAccessOverride => {
  const record = toRecord(raw);
  const normalizedMode =
    pickString(record, ['accessMode', 'mode']) === 'DENY' ? 'DENY' : 'ALLOW';
  const normalizedCourse = normalizeGroupCourse(record);

  return {
    id: pickString(record, ['id']) || '',
    courseId: normalizedCourse.courseId,
    courseTitle: normalizedCourse.courseTitle,
    instructor: normalizedCourse.instructor,
    accessMode: normalizedMode as CourseAccessMode,
  };
};

export const normalizeEffectiveAccess = (raw: unknown): UserEffectiveCourseAccess => {
  const record = toRecord(raw);

  return {
    userId: pickString(record, ['userId', 'id']) || '',
    groups: readArray(record, ['groups']).map(normalizeGroupItem),
    effectiveCourses: readArray(record, ['effectiveCourses', 'courses']).map(
      normalizeGroupCourse
    ),
    overrides: readArray(record, ['overrides']).map(normalizeOverride),
  };
};

export const getRoleLabel = (role: string) => {
  if (role === 'ROLE_ADMIN') return 'Administrator';
  if (role === 'ROLE_INSTRUCTOR') return 'O‘qituvchi';
  if (role === 'ROLE_USER') return 'Talaba';
  return role;
};

export const getUserStatusLabel = (status: string | null) => {
  if (status === 'ACTIVE') return 'Faol';
  if (status === 'INACTIVE') return 'Nofaol';
  if (status === 'BLOCKED') return 'Bloklangan';
  return status || 'Aniqlanmagan';
};

export const getAccessModeLabel = (mode: CourseAccessMode) =>
  mode === 'DENY' ? 'Ruxsat olib tashlangan' : 'Qo‘lda ruxsat berilgan';
