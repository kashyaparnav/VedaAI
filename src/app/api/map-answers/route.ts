import { NextResponse } from "next/server";
import { generateGeminiJSON } from "@/lib/gemini";

type Question = {
  id: string;
  number: string;
  text: string;
  marks: number;
};

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Answer = {
  id: string;
  questionId?: string;
  questionNumber?: string;
  text: string;
  page: number;
  confidence: number;
  boundingBoxes: BoundingBox[];
};

type AIMapping = {
  answerId: string;
  questionId: string | null;
  confidence?: number;
  reason?: string;
};

function normalizeQuestionNumber(value: string = "") {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-–—]/g, "")
    .replace(/[.)]+$/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const questions: Question[] = Array.isArray(body?.questions)
      ? body.questions
      : [];

    const answers: Answer[] = Array.isArray(body?.answers)
      ? body.answers
      : [];

    if (!questions.length) {
      return NextResponse.json(
        {
          error: "Questions are required for mapping.",
        },
        { status: 400 }
      );
    }

    if (!answers.length) {
      return NextResponse.json({
        mappings: [],
        unansweredQuestions: questions.map((question) => ({
          questionId: question.id,
          questionNumber: question.number,
        })),
        unmatchedAnswers: [],
      });
    }

    /*
     * ============================================================
     * 1. DIRECT / EXACT MAPPING
     * ============================================================
     */

    const mappings: {
      answerId: string;
      questionId: string;
      questionNumber: string;
      page: number;
      boundingBoxes: BoundingBox[];
      confidence: number;
      source: "direct" | "number" | "ai";
    }[] = [];

    const unmatchedForAI: Answer[] = [];

    const usedQuestionIds = new Set<string>();
    const usedAnswerIds = new Set<string>();

    for (const answer of answers) {
      let question: Question | undefined;

      // First priority: exact questionId
      if (answer.questionId) {
        question = questions.find(
          (item) => item.id === answer.questionId
        );
      }

      // Second priority: question number
      if (!question && answer.questionNumber) {
        const normalizedAnswerNumber =
          normalizeQuestionNumber(answer.questionNumber);

        question = questions.find(
          (item) =>
            normalizeQuestionNumber(item.number) ===
            normalizedAnswerNumber
        );
      }

      if (question && !usedQuestionIds.has(question.id)) {
        mappings.push({
          answerId: answer.id,
          questionId: question.id,
          questionNumber: question.number,
          page: answer.page,
          boundingBoxes: answer.boundingBoxes ?? [],
          confidence: answer.confidence ?? 1,
          source: answer.questionId ? "direct" : "number",
        });

        usedQuestionIds.add(question.id);
        usedAnswerIds.add(answer.id);
      } else {
        unmatchedForAI.push(answer);
      }
    }

    /*
     * ============================================================
     * 2. AI MAPPING FOR REMAINING ANSWERS
     * ============================================================
     */

    if (unmatchedForAI.length > 0) {
      const availableQuestions = questions.filter(
        (question) => !usedQuestionIds.has(question.id)
      );

      if (availableQuestions.length > 0) {
        const mappingPrompt = `
You are an expert exam answer-mapping system.

Your job is to map student answers to the correct extracted exam questions.

IMPORTANT RULES:

1. Use ONLY the question IDs provided below.
2. Use ONLY the answer IDs provided below.
3. Never invent IDs.
4. Match based on:
   - question number
   - question wording
   - subject/topic
   - answer content
   - labelled sub-parts such as 11(a), 11(b)
5. Answers may appear OUT OF ORDER.
6. Some answers may not belong to any question.
7. Some questions may have NO answer.
8. If an answer clearly does not belong to any question, return questionId: null.
9. Do not force a match.
10. Return one mapping for EVERY answer supplied.
11. A question can only be assigned to one answer in this mapping call.
12. Preserve the exact IDs.

QUESTIONS:

${JSON.stringify(
  availableQuestions.map((question) => ({
    id: question.id,
    number: question.number,
    text: question.text,
    marks: question.marks,
  })),
  null,
  2
)}

STUDENT ANSWERS:

${JSON.stringify(
  unmatchedForAI.map((answer) => ({
    id: answer.id,
    questionNumber: answer.questionNumber ?? null,
    text: answer.text,
    page: answer.page,
  })),
  null,
  2
)}

Return ONLY valid JSON in exactly this structure:

{
  "mappings": [
    {
      "answerId": "answer-id",
      "questionId": "question-id-or-null",
      "confidence": 0.95,
      "reason": "Short explanation"
    }
  ]
}

Confidence must be between 0 and 1.

Do not include any text outside the JSON.
`;

        try {
          const aiResult = await generateGeminiJSON([
            {
              text: mappingPrompt,
            },
          ]);

          const aiMappings: AIMapping[] =
            Array.isArray(aiResult?.mappings)
              ? aiResult.mappings
              : [];

          for (const aiMapping of aiMappings) {
            if (!aiMapping?.answerId) {
              continue;
            }

            const answer = unmatchedForAI.find(
              (item) => item.id === aiMapping.answerId
            );

            if (!answer) {
              continue;
            }

            if (!aiMapping.questionId) {
              continue;
            }

            const question = availableQuestions.find(
              (item) => item.id === aiMapping.questionId
            );

            if (!question) {
              continue;
            }

            if (usedQuestionIds.has(question.id)) {
              continue;
            }

            if (usedAnswerIds.has(answer.id)) {
              continue;
            }

            mappings.push({
              answerId: answer.id,
              questionId: question.id,
              questionNumber: question.number,
              page: answer.page,
              boundingBoxes: answer.boundingBoxes ?? [],
              confidence:
                typeof aiMapping.confidence === "number"
                  ? Math.max(
                      0,
                      Math.min(1, aiMapping.confidence)
                    )
                  : 0.8,
              source: "ai",
            });

            usedQuestionIds.add(question.id);
            usedAnswerIds.add(answer.id);
          }
        } catch (aiError) {
          console.error(
            "AI answer mapping failed:",
            aiError
          );

          // We intentionally continue.
          // Answers that AI cannot map will be marked unmatched.
        }
      }
    }

    /*
     * ============================================================
     * 3. UNMATCHED ANSWERS
     * ============================================================
     */

    const unmatchedAnswers = answers
      .filter((answer) => !usedAnswerIds.has(answer.id))
      .map((answer) => ({
        answerId: answer.id,
        questionNumber: answer.questionNumber ?? null,
        page: answer.page,
        text: answer.text,
        boundingBoxes: answer.boundingBoxes ?? [],
      }));

    /*
     * ============================================================
     * 4. UNANSWERED QUESTIONS
     * ============================================================
     */

    const unansweredQuestions = questions
      .filter(
        (question) => !usedQuestionIds.has(question.id)
      )
      .map((question) => ({
        questionId: question.id,
        questionNumber: question.number,
      }));

    /*
     * ============================================================
     * 5. SORT MAPPINGS IN QUESTION PAPER ORDER
     * ============================================================
     */

    const questionOrder = new Map(
      questions.map((question, index) => [
        question.id,
        index,
      ])
    );

    mappings.sort((a, b) => {
      return (
        (questionOrder.get(a.questionId) ?? 999999) -
        (questionOrder.get(b.questionId) ?? 999999)
      );
    });

    /*
     * ============================================================
     * 6. FINAL RESPONSE
     * ============================================================
     */

    return NextResponse.json({
      mappings,
      unansweredQuestions,
      unmatchedAnswers,

      summary: {
        totalQuestions: questions.length,
        totalAnswers: answers.length,
        mappedAnswers: mappings.length,
        unansweredQuestions: unansweredQuestions.length,
        unmatchedAnswers: unmatchedAnswers.length,
      },
    });
  } catch (error) {
    console.error(
      "Answer mapping error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Answer mapping failed.",
      },
      { status: 500 }
    );
  }
}