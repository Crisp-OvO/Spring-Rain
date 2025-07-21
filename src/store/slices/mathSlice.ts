import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MathProblem {
  id: string;
  expression: string;
  steps: string[];
  result: string;
  timestamp: string;
  type: string;
  difficulty: string;
  imageUri?: string;
  latex?: string;
  method: string;
  explanation: string;
}

export interface MathState {
  problems: MathProblem[];
  currentProblem: MathProblem | null;
  isLoading: boolean;
  error: string | null;
  ocrResult: {
    text: string;
    confidence: number;
    boundingBoxes: any[];
    status: string;
  } | null;
}

const initialState: MathState = {
  problems: [],
  currentProblem: null,
  isLoading: false,
  error: null,
  ocrResult: null,
};

const mathSlice = createSlice({
  name: 'math',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addProblem: (state, action: PayloadAction<MathProblem>) => {
      state.problems.unshift(action.payload);
    },
    setCurrentProblem: (state, action: PayloadAction<MathProblem | null>) => {
      state.currentProblem = action.payload;
    },
    setOcrResult: (state, action: PayloadAction<any>) => {
      state.ocrResult = action.payload;
    },
    clearOcrResult: (state) => {
      state.ocrResult = null;
    },
    deleteProblem: (state, action: PayloadAction<string>) => {
      state.problems = state.problems.filter(
        (problem) => problem.id !== action.payload
      );
    },
    clearProblems: (state) => {
      state.problems = [];
    },
  },
});

export const {
  setLoading,
  setError,
  addProblem,
  setCurrentProblem,
  setOcrResult,
  clearOcrResult,
  deleteProblem,
  clearProblems,
} = mathSlice.actions;

export default mathSlice.reducer; 