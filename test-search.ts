import { getDrugInfoFromText } from './services/qwenService.js';

async function test() {
  try {
    const res = await getDrugInfoFromText("Aspirin", "en");
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();