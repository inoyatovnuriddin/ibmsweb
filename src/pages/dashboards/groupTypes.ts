import type { ListResult, Response } from '../../types/response.ts';

export type CourseAccessMode = 'ALLOW' | 'DENY';

export interface StudentGroupItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  studentCount: number;
  courseCount: number;
  createdAt: string;
}

export interface GroupsOverview {
  totalGroups: number;
  activeGroups: number;
  totalStudentAssignments: number;
  totalCourseAssignments: number;
}

export interface StudentGroupStudent {
  id: string;
  fullName: string;
  email: string;
  status: string | null;
  roles: string[];
}

export interface StudentGroupCourse {
  courseId: string;
  courseTitle: string | null;
  instructor: string | null;
}

export interface StudentGroupDetails {
  group: StudentGroupItem;
  students: StudentGroupStudent[];
  courses: StudentGroupCourse[];
}

export interface UserCourseAccessOverride {
  id: string;
  courseId: string;
  courseTitle: string | null;
  instructor: string | null;
  accessMode: CourseAccessMode;
}

export interface UserEffectiveCourseAccess {
  userId: string;
  groups: StudentGroupItem[];
  effectiveCourses: StudentGroupCourse[];
  overrides: UserCourseAccessOverride[];
}

export interface GroupCreatePayload {
  name: string;
  description: string | null;
  active: boolean;
}

export interface GroupUpdatePayload extends GroupCreatePayload {}

export interface GroupAssignmentsSyncPayload {
  studentIds: string[];
  courseIds: string[];
  replaceStudents: boolean;
  replaceCourses: boolean;
}

export interface SaveUserOverridePayload {
  courseId: string;
  accessMode: CourseAccessMode;
}

export interface UserListItem {
  id: string;
  firstname?: string;
  lastname?: string;
  middlename?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  status?: string | null;
  roles?: string[];
}

export interface CourseSearchItem {
  id: string;
  titleuz?: string | null;
  titleru?: string | null;
  instructor?: string | null;
}

export type ApiResponse<T> = Response<T>;
export type ApiListResult<T> = ListResult<T>;
