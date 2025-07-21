import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  apiConfig: {
    qwenMathApiKey: string;
    qwenOcrApiKey: string;
    baseUrl: string;
    timeout: number;
  };
  appConfig: {
    language: 'zh' | 'en';
    fontSize: 'small' | 'medium' | 'large';
    autoSave: boolean;
    offlineMode: boolean;
  };
  developerMode: boolean;
}

const initialState: SettingsState = {
  apiConfig: {
    qwenMathApiKey: '',
    qwenOcrApiKey: '',
    baseUrl: 'http://localhost:3001',
    timeout: 30000,
  },
  appConfig: {
    language: 'zh',
    fontSize: 'medium',
    autoSave: true,
    offlineMode: false,
  },
  developerMode: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateApiConfig: (state, action: PayloadAction<Partial<SettingsState['apiConfig']>>) => {
      state.apiConfig = { ...state.apiConfig, ...action.payload };
    },
    updateAppConfig: (state, action: PayloadAction<Partial<SettingsState['appConfig']>>) => {
      state.appConfig = { ...state.appConfig, ...action.payload };
    },
    toggleDeveloperMode: (state) => {
      state.developerMode = !state.developerMode;
    },
    resetSettings: () => initialState,
  },
});

export const {
  updateApiConfig,
  updateAppConfig,
  toggleDeveloperMode,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer; 