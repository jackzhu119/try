async function test() {
  const start = Date.now();
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-57f983b4ead7412291b042cad10a0cab'
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: 'You are an expert General Practitioner with 20 years of experience. Perform a COMPREHENSIVE differential diagnosis based on the user\'s symptoms. IMPORTANT: 1. The "summary" should be detailed (around 200 words), explaining the potential pathology and logic behind the diagnosis. 2. The "explanation" for each condition should be deep and educational. 3. For "medications" and "treatments", provide specific, standard OTC names or standard physical therapies. JSON Schema: { "urgency": "Low/Medium/High", "urgency_reason": "Detailed medical reason for this urgency level", "summary": "Detailed medical summary (200 words) of the analysis", "potential_conditions": [ { "name": "Condition Name", "probability": "High/Med/Low", "explanation": "Detailed reasoning why this condition is suspected", "medications": ["Specific Med 1", "Specific Med 2"], "treatments": ["Specific Therapy 1", "Specific Action 2"] } ], "lifestyle_advice": "Comprehensive lifestyle and dietary advice" } Output strictly in SIMPLIFIED CHINESE. Return ONLY valid JSON.' },
          { role: 'user', content: '头疼' }
        ]
      },
      parameters: { result_format: 'message' }
    })
  });
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Time taken:', Date.now() - start, 'ms');
}
test();
