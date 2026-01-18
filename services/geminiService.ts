import { DrugInfo } from "../types";

// 模拟数据库数据
const MOCK_DATA: DrugInfo = {
  name: "布洛芬缓释胶囊 (演示数据)",
  indications: "用于缓解轻至中度疼痛如头痛、关节痛、偏头痛、牙痛、肌肉痛、神经痛、痛经。也用于普通感冒或流行性感冒引起的发热。",
  dosage: "口服。成人，一次1粒，一日2次（早晚各一次）。",
  contraindications: "1. 对其他非甾体抗炎药过敏者禁用。\n2. 孕妇及哺乳期妇女禁用。\n3. 对阿司匹林过敏的哮喘患者禁用。",
  storage: "密封，在干燥处保存。",
  sideEffects: "少数病人可出现恶心、呕吐、胃烧灼感或轻度消化不良、胃肠道溃疡及出血等。",
  summary: "这是布洛芬缓释胶囊。主要用于止痛和退烧。成人通常早晚各吃一粒。孕妇、哺乳期妇女以及对阿司匹林过敏的人请不要服用。"
};

/**
 * 模拟从文本获取药品信息
 */
export const getDrugInfoFromText = async (query: string): Promise<DrugInfo> => {
  console.log("Mocking text search for:", query);
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 如果用户搜特定词，可以扩展这里的逻辑，目前统一返回布洛芬作为演示
  return {
    ...MOCK_DATA,
    name: query.length > 1 ? `${query} (演示结果)` : MOCK_DATA.name
  };
};

/**
 * 模拟从图片获取药品信息
 */
export const getDrugInfoFromImage = async (base64Image: string): Promise<DrugInfo> => {
  console.log("Mocking image analysis");
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    ...MOCK_DATA,
    name: "智能识别结果: 布洛芬缓释胶囊"
  };
};

/**
 * 模拟生成语音 (不再使用，由前端直接合成)
 */
export const generateDrugAudio = async (textToSay: string): Promise<string> => {
  return ""; 
};