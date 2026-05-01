import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  clearAccessToken,
  readAccessToken,
  saveAccessToken,
  syncStoredRole,
} from './authSession.ts';
import type { CurrentUser } from './authApi.ts';

interface AuthState {
  accessToken: string | null;
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: readAccessToken(),
  currentUser: null,
  isAuthenticated: !!readAccessToken(),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      saveAccessToken(action.payload);
    },
    setCurrentUser: (state, action: PayloadAction<CurrentUser | null>) => {
      state.currentUser = action.payload;
      syncStoredRole(action.payload?.roles);
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      clearAccessToken();
    },
  },
});

export const { logout, setSession, setCurrentUser, setAuthLoading, setAuthError } =
  authSlice.actions;
export default authSlice.reducer;
