// src/redux/store.ts

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeReducer, { ThemeState } from './theme/themeSlice';
import courseReducer from './course/courseSlice';
import authReducer from './auth/authSlice';
import { PersistConfig, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Define the state shape
interface RootState {
  theme: ThemeState;
  course: ReturnType<typeof courseReducer>;
  auth: ReturnType<typeof authReducer>;
}

// Combine reducers
const rootReducer = combineReducers({
  theme: themeReducer,
  course: courseReducer,
  auth: authReducer
});

// Persist config with RootState
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage,
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Persistor
export const persistor = persistStore(store);

// Type for RootState
export type { RootState };
