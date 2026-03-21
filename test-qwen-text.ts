export {};
async function test() {
  const response = await fetch('http://localhost:3000/api/qwen/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-e5e7b33d1f684e66be3cd51e52ae0bab'
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
  console.log(response.status);
  const text = await response.text();
  console.log(text);
}
test();
