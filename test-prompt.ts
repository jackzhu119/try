export {};
const API_KEY = "sk-e5e7b33d1f684e66be3cd51e52ae0bab";
const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const prompt = `You are an expert General Practitioner with 20 years of experience. 
      Perform a COMPREHENSIVE differential diagnosis based on the user's symptoms.
      
      IMPORTANT: 
      1. The "summary" should be detailed (around 200 words), explaining the potential pathology and logic behind the diagnosis. 
      2. The "explanation" for each condition should be deep and educational.
      3. For "medications" and "treatments", provide specific, standard OTC names or standard physical therapies.
      
      JSON Schema:
      {
        "urgency": "Low/Medium/High",
        "urgency_reason": "Detailed medical reason for this urgency level",
        "summary": "Detailed medical summary (200 words) of the analysis",
        "potential_conditions": [
          { 
            "name": "Condition Name", 
            "probability": "High/Med/Low", 
            "explanation": "Detailed reasoning why this condition is suspected", 
            "medications": ["Specific Med 1", "Specific Med 2"], 
            "treatments": ["Specific Therapy 1", "Specific Action 2"] 
          }
        ],
        "lifestyle_advice": "Comprehensive lifestyle and dietary advice"
      }
      
      Output strictly in SIMPLIFIED CHINESE. Return ONLY valid JSON.`;

async function test() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: "我头痛发烧" }
          ]
        },
        parameters: { result_format: 'message' }
      })
    });
    
    const text = await response.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
