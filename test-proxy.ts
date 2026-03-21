export {};
async function test() {
  try {
    const response = await fetch('http://localhost:3000/api/qwen/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk-e5e7b33d1f684e66be3cd51e52ae0bab`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        },
        parameters: { result_format: 'message' }
      })
    });
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();