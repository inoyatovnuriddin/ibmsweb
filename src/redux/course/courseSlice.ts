// src/redux/course/courseSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CourseResponse } from './types.ts';
import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from './courseService';

// Define the state interface
interface CourseState {
  courses: CourseResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  loading: false,
  error: null,
};

// Async thunk to fetch courses from API
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (filter: { searchKey: string; start: number; limit: number }) => {
    return await getCourses(filter);
  }
);

// Async thunk to create a new course
export const createNewCourse = createAsyncThunk(
  'courses/createCourse',
  async (course: CourseResponse) => {
    return await createCourse(course);
  }
);

// Async thunk to update an existing course
export const updateExistingCourse = createAsyncThunk(
  'courses/updateCourse',
  async (course: CourseResponse) => {
    return await updateCourse(course);
  }
);

// Async thunk to delete a course
export const deleteExistingCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (id: string) => {
    return await deleteCourse(id);
  }
);

// Create slice for course management
const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Handling fetchCourses action
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.list; // Store courses in state
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch courses';
      });

    // Handling createNewCourse action
    builder
      .addCase(createNewCourse.pending, (state) => {
        state.loading = true;
      })
      .addCase(createNewCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.push(action.payload); // Add new course to the list
      })
      .addCase(createNewCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create course';
      });

    // Handling updateExistingCourse action
    builder
      .addCase(updateExistingCourse.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExistingCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.courses.findIndex(course => course.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload; // Update course in the list
        }
      })
      .addCase(updateExistingCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update course';
      });

    // Handling deleteExistingCourse action
    builder
      .addCase(deleteExistingCourse.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteExistingCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(course => course.id !== action.payload); // Remove deleted course
      })
      .addCase(deleteExistingCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete course';
      });
  },
});

export default courseSlice.reducer;
