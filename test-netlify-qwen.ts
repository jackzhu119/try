import { handler } from './netlify/functions/qwen';

async function test() {
  const event = {
    httpMethod: 'POST',
    path: '/.netlify/functions/qwen',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-e5e7b33d1f684e66be3cd51e52ae0bab'
    },
    body: JSON.stringify({
      model: 'qwen-vl-max',
      input: {
        messages: [
          { role: 'user', content: [{ text: 'Hello' }] }
        ]
      },
      parameters: {}
    }),
    isBase64Encoded: false
  };

  const context = {};
  
  const response = await handler(event as any, context as any);
  console.log(response.statusCode);
  console.log(response.body);
}
test();
