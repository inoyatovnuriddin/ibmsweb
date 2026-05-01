import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginWithIdentifier } from './authApi.ts';

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (
    payload: { identifier?: string; email?: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const tokenPayload = await loginWithIdentifier(payload);
      const token = tokenPayload?.id_token;
      if (!token) throw new Error('Token not found');

      return {
        accessToken: token,
        refreshToken: null,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);
