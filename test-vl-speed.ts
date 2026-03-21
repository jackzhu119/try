async function test() {
  const start = Date.now();
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-57f983b4ead7412291b042cad10a0cab'
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      input: {
        messages: [
          { role: 'user', content: [{ text: 'Hello' }] }
        ]
      },
      parameters: {}
    })
  });
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Time taken:', Date.now() - start, 'ms');
}
test();
