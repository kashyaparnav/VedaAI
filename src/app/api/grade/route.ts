import { NextResponse } from "next/server";
import { generateGeminiJSON } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const questions = Array.isArray(body?.questions)
      ? body.questions
      : [];

    const answers = Array.isArray(body?.answers)
      ? body.answers
      : [];

    const mappings = Array.isArray(body?.mappings)
      ? body.mappings
      : [];

    const unansweredQuestions = Array.isArray(
      body?.unansweredQuestions
    )
      ? body.unansweredQuestions
      : [];

    const unmatchedAnswers = Array.isArray(
      body?.unmatchedAnswers
    )
      ? body.unmatchedAnswers
      : [];

    if (!questions.length) {
      return NextResponse.json(
        {
          error: "Questions are required.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert school exam evaluator.

Evaluate the student's answers against the extracted exam questions.

IMPORTANT:

- Grade every question independently.
- Include EVERY question in the final result.
- Award marks fairly according to the maximum marks.
- Do not give marks only because keywords are present.
- Consider correctness, completeness, relevance and reasoning.
- If a question has no mapped answer, give 0 marks.
- A missing answer must have status "unanswered".
- Do not invent information that the student did not write.
- Do not assume an answer exists if it is not mapped.
- Give concise teacher-style feedback.
- Preserve the original question numbering.
- Sub-parts such as 11(a) and 11(b) must remain separate.
- Answers that do not match any question must NOT receive marks.
- Do not give marks for unmatched answers.

QUESTIONS:
${JSON.stringify(questions, null, 2)}

STUDENT ANSWERS:
${JSON.stringify(answers, null, 2)}

ANSWER MAPPINGS:
${JSON.stringify(mappings, null, 2)}

UNANSWERED QUESTIONS:
${JSON.stringify(
  unansweredQuestions,
  null,
  2
)}

UNMATCHED ANSWERS:
${JSON.stringify(
  unmatchedAnswers,
  null,
  2
)}

Return ONLY valid JSON in exactly this structure:

{
  "total": 0,
  "outOf": 0,
  "percentage": 0,
  "results": [
    {
      "questionId": "q1",
      "questionNumber": "1",
      "obtainedMarks": 0,
      "maxMarks": 2,
      "status": "unanswered",
      "feedback": "No answer provided."
    }
  ],
  "overallFeedback": "Short overall assessment feedback."
}

RULES:

1. total = sum of obtainedMarks.
2. outOf = sum of maxMarks.
3. percentage = total / outOf * 100.
4. obtainedMarks must never be greater than maxMarks.
5. obtainedMarks must never be negative.
6. Use only these statuses:
   - "correct"
   - "partially_correct"
   - "incorrect"
   - "unanswered"
7. Include every question exactly once.
8. If question has no mapping, obtainedMarks = 0.
9. If question has no mapping, status = "unanswered".
10. Unmatched answers receive no marks.
11. Keep feedback concise.
12. Return JSON only.
`;

    const result = await generateGeminiJSON([
      {
        text: prompt,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "AI grading error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI grading failed.",
      },
      {
        status: 500,
      }
    );
  }
}