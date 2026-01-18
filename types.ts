export interface DrugInfo {
  name: string;
  indications: string; // 适应症
  dosage: string;      // 用法用量
  contraindications: string; // 禁忌
  storage: string;     // 贮藏
  sideEffects: string; // 不良反应
  summary: string;     // For TTS
}

export enum AppMode {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  SCAN = 'SCAN',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}