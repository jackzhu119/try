export interface DrugInfo {
  name: string;
  indications: string;
  dosage: string;
  contraindications: string;
  storage: string;
  sideEffects: string;
  usage_tips: string;
  summary: string;
}

export interface ConditionDetail {
  name: string;             // 疾病名称 (e.g. "偏头痛")
  probability: string;      // 可能性描述 (e.g. "高", "中", "低")
  explanation: string;      // 针对该特定疾病的解释
  medications: string[];    // 针对该特定疾病的药物
  treatments: string[];     // 针对该特定疾病的物理治疗
}

export interface DiagnosisInfo {
  urgency: 'Low' | 'Medium' | 'High'; // 总体紧急程度
  urgency_reason: string;    // 判断紧急程度的理由
  summary: string;           // 总体语音播报总结
  potential_conditions: ConditionDetail[]; // 多种可能的病因详情
  lifestyle_advice: string;  // 通用的生活饮食建议 (适用于所有可能性)
}

export enum AppMode {
  HOME = 'HOME',
  SEARCH = 'SEARCH', // Keep for backward compatibility logic
  SCAN = 'SCAN',     // Keep for backward compatibility logic
  RESULT = 'RESULT',
  DIAGNOSIS_RESULT = 'DIAGNOSIS_RESULT' // New mode for diagnosis result
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}