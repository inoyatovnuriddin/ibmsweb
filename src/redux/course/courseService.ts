// src/services/courseService.ts
import { CourseResponse } from './types';
import { ListResult, Response } from '../../types/response';
import { apiClient } from '../../services/api';

// Fetch list of courses with pagination and filters
export const getCourses = async (filter: { searchKey: string; start: number; limit: number }): Promise<ListResult<CourseResponse>> => {
  const response = await apiClient.get<Response<ListResult<CourseResponse>>>('/v1/course/list', {
    params: filter,
  });
  return response.data.payload; // Returns list of courses and count
};

// Create a new course
export const createCourse = async (course: CourseResponse): Promise<CourseResponse> => {
  const response = await apiClient.post<Response<CourseResponse>>('/v1/course/create', course);
  return response.data.payload;
};

// Update an existing course
export const updateCourse = async (course: CourseResponse): Promise<CourseResponse> => {
  const response = await apiClient.put<Response<CourseResponse>>('/v1/course/update', course);
  return response.data.payload;
};

// Delete a course
export const deleteCourse = async (id: string): Promise<string> => {
  const response = await apiClient.delete<Response<string>>('/v1/course/delete', { params: { id } });
  return response.data.payload; // Assuming the payload is a success message
};
