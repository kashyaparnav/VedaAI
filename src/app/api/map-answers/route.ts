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

type Mapping = {
  answerId: string;
  questionId: string;
  questionNumber: string;
  page: number;
  boundingBoxes: BoundingBox[];
  confidence: number;
  source: "direct" | "number" | "ai";
  reason?: string;
};

function normalizeQuestionNumber(value: string = "") {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-–—]/g, "")
    .replace(/[.)]+$/g, "");
}

function clampConfidence(value: unknown, fallback = 0.8) {
  if (typeof value !== "number") {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
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
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * 1. DIRECT / EXACT MAPPING
     * ============================================================
     *
     * First try:
     *   answer.questionId
     *
     * Then:
     *   answer.questionNumber
     *
     * IMPORTANT:
     * We intentionally DO NOT mark a question as used.
     *
     * This allows answers to span multiple pages or appear as
     * multiple extracted answer fragments.
     */

    const mappings: Mapping[] = [];

    const unmatchedForAI: Answer[] = [];

    const usedAnswerIds = new Set<string>();

    for (const answer of answers) {
      let question: Question | undefined;
      let source: "direct" | "number" | null = null;

      // ----------------------------------------------------------
      // First priority: exact questionId
      // ----------------------------------------------------------

      if (answer.questionId) {
        question = questions.find(
          (item) => item.id === answer.questionId
        );

        if (question) {
          source = "direct";
        }
      }

      // ----------------------------------------------------------
      // Second priority: question number
      // ----------------------------------------------------------

      if (!question && answer.questionNumber) {
        const normalizedAnswerNumber =
          normalizeQuestionNumber(answer.questionNumber);

        question = questions.find(
          (item) =>
            normalizeQuestionNumber(item.number) ===
            normalizedAnswerNumber
        );

        if (question) {
          source = "number";
        }
      }

      // ----------------------------------------------------------
      // Create direct mapping
      // ----------------------------------------------------------

      if (question && source) {
        mappings.push({
          answerId: answer.id,
          questionId: question.id,
          questionNumber: question.number,
          page: answer.page,
          boundingBoxes: answer.boundingBoxes ?? [],
          confidence: clampConfidence(
            answer.confidence,
            source === "direct" ? 1 : 0.95
          ),
          source,
        });

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
      /*
       * All questions remain available.
       *
       * This is intentional because:
       * - answers can span multiple pages
       * - extraction can produce multiple answer fragments
       * - multiple fragments may belong to the same question
       */

      const availableQuestions = questions;

      const mappingPrompt = `
You are an expert exam answer-mapping system.

Your job is to map extracted student answers to the correct
questions from an exam paper.

IMPORTANT RULES:

1. Use ONLY the question IDs provided below.

2. Use ONLY the answer IDs provided below.

3. Never invent IDs.

4. Match answers using:
   - question number
   - question wording
   - subject/topic
   - answer content
   - labelled sub-parts such as 11(a), 11(b)

5. Answers may appear OUT OF ORDER.

6. Some answers may span MULTIPLE PAGES.

7. Some extracted answer objects may represent different
   fragments of the SAME question.

8. Multiple answer objects MAY map to the same question when
   they clearly belong to that question.

9. Some answers may not belong to any question.

10. Some questions may have NO answer.

11. If an answer clearly does not belong to any question,
    return questionId: null.

12. DO NOT force a match.

13. Return exactly ONE mapping object for EVERY answer supplied.

14. Preserve exact IDs.

15. Confidence must be between 0 and 1.

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

Do not include any text outside the JSON.
`;

      try {
        const aiResult = await generateGeminiJSON([
          {
            text: mappingPrompt,
          },
        ]);

        const aiMappings: AIMapping[] = Array.isArray(
          aiResult?.mappings
        )
          ? aiResult.mappings
          : [];

        for (const aiMapping of aiMappings) {
          if (!aiMapping?.answerId) {
            continue;
          }

          // ------------------------------------------------------
          // Find answer
          // ------------------------------------------------------

          const answer = unmatchedForAI.find(
            (item) => item.id === aiMapping.answerId
          );

          if (!answer) {
            continue;
          }

          // Already mapped
          if (usedAnswerIds.has(answer.id)) {
            continue;
          }

          // ------------------------------------------------------
          // Unmatched answer
          // ------------------------------------------------------

          if (!aiMapping.questionId) {
            continue;
          }

          // ------------------------------------------------------
          // Find question
          // ------------------------------------------------------

          const question = availableQuestions.find(
            (item) => item.id === aiMapping.questionId
          );

          if (!question) {
            continue;
          }

          // ------------------------------------------------------
          // Add AI mapping
          // ------------------------------------------------------

          mappings.push({
            answerId: answer.id,
            questionId: question.id,
            questionNumber: question.number,
            page: answer.page,
            boundingBoxes: answer.boundingBoxes ?? [],
            confidence: clampConfidence(
              aiMapping.confidence,
              0.8
            ),
            source: "ai",
            reason: aiMapping.reason,
          });

          usedAnswerIds.add(answer.id);
        }
      } catch (aiError) {
        console.error(
          "AI answer mapping failed:",
          aiError
        );

        /*
         * We intentionally continue.
         *
         * Answers that AI cannot map will appear under
         * unmatchedAnswers.
         */
      }
    }

    /*
     * ============================================================
     * 3. UNMATCHED ANSWERS
     * ============================================================
     */

    const unmatchedAnswers = answers
      .filter(
        (answer) => !usedAnswerIds.has(answer.id)
      )
      .map((answer) => ({
        answerId: answer.id,
        questionNumber:
          answer.questionNumber ?? null,
        page: answer.page,
        text: answer.text,
        boundingBoxes:
          answer.boundingBoxes ?? [],
        confidence: clampConfidence(
          answer.confidence,
          0
        ),
      }));

    /*
     * ============================================================
     * 4. UNANSWERED QUESTIONS
     * ============================================================
     */

    const answeredQuestionIds = new Set(
      mappings.map(
        (mapping) => mapping.questionId
      )
    );

    const unansweredQuestions = questions
      .filter(
        (question) =>
          !answeredQuestionIds.has(question.id)
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
      const questionDifference =
        (questionOrder.get(a.questionId) ??
          999999) -
        (questionOrder.get(b.questionId) ??
          999999);

      if (questionDifference !== 0) {
        return questionDifference;
      }

      // If same question has multiple pages,
      // keep answers in page order.
      return a.page - b.page;
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
        answeredQuestions:
          answeredQuestionIds.size,
        unansweredQuestions:
          unansweredQuestions.length,
        unmatchedAnswers:
          unmatchedAnswers.length,
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
      {
        status: 500,
      }
    );
  }
}