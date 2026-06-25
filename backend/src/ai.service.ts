export async function processReceiptWithAI(rawText: string) {
  const cleanText = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 1)
    .join('\n');

  const prompt = `
Return ONLY valid JSON.
No markdown. No explanation.

Schema:
{"vendor":{"name":"","address":"","phone":""},"items":[{"name":"","quantity":0,"unit_price":0,"total_price":0,"category":""}]}

Translate Malayalam/Hindi/Kannada to English if needed.
Preserve all numbers exactly.
Missing text = "".
Missing number = 0.

OCR:
${cleanText}
`;

  const timerName = `AI-${Date.now()}`;
  console.time(timerName);

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3.1',
      prompt,
      stream: false,
      keep_alive: '10m',
      options: {
        temperature: 0,
        num_predict: 300,
        num_ctx: 1024,
      },
    }),
  });

  const data = await response.json();

  console.timeEnd(timerName);

  if (!data.response) {
    throw new Error('No response received from AI model');
  }

  console.log('AI RESPONSE:');
  console.log(data.response);

  const cleaned = data.response
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('AI did not return valid JSON');
  }

  const jsonOnly = cleaned.substring(firstBrace, lastBrace + 1);

  let parsed: any;

  try {
    parsed = JSON.parse(jsonOnly);
  } catch (error) {
    console.error('Invalid AI JSON:', jsonOnly);
    throw new Error('AI returned broken JSON');
  }

  parsed.raw_text = cleanText;

  return JSON.stringify(parsed);
}