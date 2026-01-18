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

export interface DiagnosisInfo {
  conditions: string[];      // 可能的疾病名称列表
  explanation: string;       // 病情分析/原因
  medications: string[];     // 推荐的非处方药(OTC)
  treatments: string[];      // 物理治疗/非药物治疗建议
  lifestyle_advice: string;  // 生活饮食建议
  urgency: 'Low' | 'Medium' | 'High'; // 紧急程度
  urgency_reason: string;    // 判断紧急程度的理由
  summary: string;           // 用于语音播报的总结
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