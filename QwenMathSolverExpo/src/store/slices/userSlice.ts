import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription: {
    type: 'free' | 'premium' | 'edu';
    expiresAt: string;
  };
}

export interface UserState {
  profile: UserProfile | null;
  isLoggedIn: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notificationsEnabled: boolean;
    syncEnabled: boolean;
    ocr: {
      autoCorrect: boolean;
      highAccuracyMode: boolean;
    };
    solver: {
      showSteps: boolean;
      detailedExplanation: boolean;
      mathFormat: 'normal' | 'latex';
    };
    privacy: {
      shareData: boolean;
      saveHistory: boolean;
    };
  };
  statistics: {
    totalProblems: number;
    masteredProblems: number;
    typeDistribution: Record<string, number>;
    difficultyDistribution: Record<string, number>;
    weeklyActivity: Record<string, number>;
  };
}

const initialState: UserState = {
  profile: null,
  isLoggedIn: false,
  preferences: {
    theme: 'system',
    notificationsEnabled: true,
    syncEnabled: true,
    ocr: {
      autoCorrect: true,
      highAccuracyMode: false,
    },
    solver: {
      showSteps: true,
      detailedExplanation: true,
      mathFormat: 'normal',
    },
    privacy: {
      shareData: false,
      saveHistory: true,
    },
  },
  statistics: {
    totalProblems: 0,
    masteredProblems: 0,
    typeDistribution: {},
    difficultyDistribution: {},
    weeklyActivity: {},
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.profile = null;
      state.isLoggedIn = false;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    updateStatistics: (state, action: PayloadAction<Partial<UserState['statistics']>>) => {
      state.statistics = { ...state.statistics, ...action.payload };
    },
  },
});

export const { setProfile, logout, updatePreferences, updateStatistics } = userSlice.actions;

export default userSlice.reducer; 