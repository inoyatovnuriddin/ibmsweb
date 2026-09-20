import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppLanguage, DEFAULT_LANGUAGE, readAppLanguage } from '../../i18n';

export interface LanguageState {
  current: AppLanguage;
}

const initialState: LanguageState = {
  current: readAppLanguage() || DEFAULT_LANGUAGE,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<AppLanguage>) => {
      state.current = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;

export default languageSlice.reducer;
