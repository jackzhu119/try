import { analyzeSymptoms } from './services/qwenService';

async function run() {
  try {
    const res = await analyzeSymptoms("I have a headache and a fever", undefined, 'en');
    console.log("Success:", res);
  } catch (e) {
    console.error("Failed:", e);
  }
}
run();
