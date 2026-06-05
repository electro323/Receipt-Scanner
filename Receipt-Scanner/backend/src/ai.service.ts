export async function processReceiptWithAI(rawText: string) {

  const prompt = `
You are an AI receipt parser.

Extract receipt information and return ONLY valid JSON.

Required JSON format:

{
  "vendor": {
    "name": "",
    "address": "",
    "phone": ""
  },
  "transaction": {
    "date": "",
    "time": "",
    "receipt_number": "",
    "currency": ""
  },
  "items": [
    {
      "name": "",
      "quantity": 0,
      "unit_price": 0,
      "total_price": 0,
      "category": ""
    }
  ],
  "totals": {
    "subtotal": 0,
    "tax": 0,
    "discounts": [],
    "total": 0
  },
  "payment": {
    "method": "",
    "amount": 0
  },
  "raw_text": ""
}

Rules:
- Return ONLY JSON.
- No explanations.
- No markdown.
- No comments.
- If a field is missing, use empty string "" or 0.

OCR TEXT:

${rawText}
`;

  const response = await fetch(
    'http://localhost:11434/api/generate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt,
        stream: false,
      }),
    },
  );

  const data = await response.json();

 return data.response
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim();
}