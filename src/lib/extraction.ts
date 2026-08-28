import { generateGeminiJSON } from "./gemini";

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  return Buffer.from(arrayBuffer).toString("base64");
}

export async function extractQuestions(file: File) {
  const base64 = await fileToBase64(file);

  const result = await generateGeminiJSON([
    {
      inlineData: {
        mimeType: file.type || "application/pdf",
        data: base64,
      },
    },
    {
      text: `
You are an exam question extraction system.

Read the uploaded question paper carefully.

Extract every question from the document.

Return ONLY valid JSON in this exact format:

{
  "questions": [
    {
      "id": "q1",
      "number": "1",
      "text": "full question text",
      "marks": 2,
      "obtainedMarks": 0,
      "status": "unanswered"
    }
  ]
}

Rules:
- Include all questions.
- Preserve the question wording.
- Detect marks if visible.
- If marks are not visible, use 1.
- id must be q1, q2, q3...
- obtainedMarks must initially be 0.
- status must initially be "unanswered".
- Do not add explanations.
      `,
    },
  ]);

  return result;
}

export async function extractAnswers(file: File) {
  const base64 = await fileToBase64(file);

  const result = await generateGeminiJSON([
    {
      inlineData: {
        mimeType: file.type || "application/pdf",
        data: base64,
      },
    },
    {
      text: `
You are an exam answer-sheet extraction system.

Read the uploaded student answer sheet carefully.

Extract each answer and identify which question it belongs to.

Return ONLY valid JSON in this exact format:

{
  "answers": [
    {
      "id": "a1",
      "questionNumber": "1",
      "text": "complete extracted answer",
      "page": 1,
      "confidence": 0.95,
      "boundingBoxes": [
        {
          "x": 10,
          "y": 20,
          "width": 80,
          "height": 12
        }
      ]
    }
  ]
}

Rules:
- Extract handwritten or printed answers as accurately as possible.
- questionNumber should correspond to the visible question number.
- id must be a1, a2, a3...
- confidence must be between 0 and 1.
- Coordinates must be percentages from 0 to 100.
- If an exact bounding box cannot be determined, provide your best estimate.
- Include one answer object for each identifiable answer.
- Do not add explanations.
      `,
    },
  ]);

  return result;
}