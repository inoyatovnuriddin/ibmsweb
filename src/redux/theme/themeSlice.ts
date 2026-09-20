import { createSlice } from '@reduxjs/toolkit';

export interface ThemeState {
  mytheme: 'light' | 'dark';
}

const getInitialTheme = (): ThemeState['mytheme'] => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem('ibms-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const initialState: ThemeState = {
  mytheme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'mytheme',
  initialState,
  reducers: {
    toggleTheme: (state: ThemeState) => {
      state.mytheme = state.mytheme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state: ThemeState, action: { payload: ThemeState['mytheme'] }) => {
      state.mytheme = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
