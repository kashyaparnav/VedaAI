import { NextResponse } from "next/server";
import { generateGeminiJSON } from "@/lib/gemini";

type Question = {
  id: string;
  number?: string;
  questionNumber?: string;
  text?: string;
  marks?: number;
  obtainedMarks?: number;
  status?: string;
  options?: string[];
};

type Answer = {
  id: string;
  questionNumber?: string;
  questionId?: string;
  text?: string;
  page?: number;
};

type Mapping = {
  answerId: string;
  questionId?: string | null;
  questionNumber?: string | null;
};

type GradeResult = {
  questionId: string;
  questionNumber: string;
  obtainedMarks: number;
  maxMarks: number;
  status:
    | "correct"
    | "partially_correct"
    | "incorrect"
    | "unanswered";
  feedback: string;
};

type GradingResponse = {
  total: number;
  outOf: number;
  percentage: number;
  results: GradeResult[];
  overallFeedback: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const questions: Question[] = Array.isArray(
      body?.questions
    )
      ? body.questions
      : [];

    const answers: Answer[] = Array.isArray(
      body?.answers
    )
      ? body.answers
      : [];

    const mappings: Mapping[] = Array.isArray(
      body?.mappings
    )
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

    /*
     * =========================================================
     * BUILD EXPLICIT QUESTION -> ANSWER PAIRS
     * =========================================================
     */

    const questionAnswerPairs = questions.map(
      (question) => {
        const mapping = mappings.find(
          (item) =>
            item.questionId === question.id
        );

        const answer = mapping
          ? answers.find(
              (item) =>
                item.id === mapping.answerId
            )
          : undefined;

        return {
          question,
          mapping: mapping ?? null,
          answer: answer ?? null,
        };
      }
    );

    /*
     * =========================================================
     * GRADING PROMPT
     * =========================================================
     */

    const prompt = `
You are an expert school exam evaluator.

Evaluate the student's answers against the extracted exam questions.

This is a strict educational grading task.

=========================================================
MOST IMPORTANT RULE
=========================================================

ONLY grade an answer when there is an explicit mapping between
the question and the answer.

Never invent a mapping.

Never assume an answer belongs to a question.

If a question has no mapping:

obtainedMarks = 0
status = "unanswered"
feedback = "No answer provided."

If an answer is listed under UNMATCHED ANSWERS:

it must receive NO marks.

=========================================================
MCQ GRADING
=========================================================

Many questions are multiple-choice questions.

For every MCQ:

1. Read the complete question.
2. Identify every option.
3. Determine what option the student selected.
4. Solve the question independently.
5. Determine the objectively correct option.
6. Compare the student's selected option with the correct option.

If student's option is correct:

- Award FULL marks.
- status = "correct".

If student's option is wrong:

- Award 0 marks.
- status = "incorrect".

IMPORTANT:

A student may write only:

A
B
C
D

or:

Answer B

or:

(B)

or:

Option B

or the actual option text.

These are valid answers.

DO NOT mark a correct MCQ answer incorrect merely because:

- the student did not explain the reasoning,
- the student gave a short answer,
- OCR text is imperfect,
- the student wrote only the option letter,
- the student wrote the option text instead of the letter.

=========================================================
EXAMPLE
=========================================================

Question:

A particle moves in a straight line with initial velocity 10 m/s
and acceleration 2 m/s². The distance travelled in the 5th second is:

(A) 18 m
(B) 19 m
(C) 20 m
(D) 21 m

Student answer:

Answer B

Correct answer:

B = 19 m

Therefore:

obtainedMarks = full marks
status = "correct"

Do NOT mark this answer incorrect because the student only wrote
"Answer B".

=========================================================
NUMERICAL QUESTIONS
=========================================================

For numerical questions:

- Understand the question.
- Verify the student's calculation.
- Independently calculate the expected answer.
- Compare the student's final result.
- Award marks according to correctness and maximum marks.

If the final numerical answer is correct, award full marks unless
important required reasoning is materially missing.

If the method is substantially correct but the final answer has a
minor arithmetic error, partial marks may be awarded.

=========================================================
DESCRIPTIVE QUESTIONS
=========================================================

Evaluate:

- correctness
- relevance
- completeness
- reasoning
- important concepts
- required steps

Do not give marks simply because keywords appear.

Do not penalize different wording when the meaning is correct.

=========================================================
SUB-PARTS
=========================================================

Treat these as separate questions:

11(a)
11(b)
12(i)
12(ii)

Preserve their exact numbering.

=========================================================
UNANSWERED QUESTIONS
=========================================================

If there is no mapping:

obtainedMarks = 0
status = "unanswered"

Do not search the answer sheet for another answer.

=========================================================
UNMATCHED ANSWERS
=========================================================

Unmatched answers receive ZERO marks.

Do not assign them to any question.

=========================================================
MARK RULES
=========================================================

For every question:

obtainedMarks >= 0

obtainedMarks <= maxMarks

Never award more than the question's maximum marks.

=========================================================
STATUS RULES
=========================================================

Allowed statuses:

"correct"
"partially_correct"
"incorrect"
"unanswered"

Use:

correct
when completely correct.

partially_correct
when meaningful correct work exists but the answer is incomplete
or partially wrong.

incorrect
when the mapped answer is clearly wrong.

unanswered
ONLY when there is no mapped answer.

IMPORTANT:

A mapped but wrong answer is "incorrect", NOT "unanswered".

=========================================================
EVERY QUESTION
=========================================================

Every question supplied in QUESTIONS must appear exactly once.

Never omit a question.

Never duplicate a question.

Preserve:

questionId
questionNumber

=========================================================
QUESTIONS + ANSWERS
=========================================================

QUESTION / ANSWER PAIRS:

${JSON.stringify(
  questionAnswerPairs,
  null,
  2
)}

=========================================================
UNANSWERED QUESTIONS
=========================================================

${JSON.stringify(
  unansweredQuestions,
  null,
  2
)}

=========================================================
UNMATCHED ANSWERS
=========================================================

${JSON.stringify(
  unmatchedAnswers,
  null,
  2
)}

=========================================================
FINAL RESPONSE
=========================================================

Return ONLY valid JSON.

Return exactly this structure:

{
  "total": 0,
  "outOf": 0,
  "percentage": 0,
  "results": [
    {
      "questionId": "q1",
      "questionNumber": "1",
      "obtainedMarks": 1,
      "maxMarks": 1,
      "status": "correct",
      "feedback": "Correct answer."
    }
  ],
  "overallFeedback": "Short overall assessment feedback."
}

Rules:

1. total = sum of obtainedMarks.
2. outOf = sum of maxMarks.
3. percentage = total / outOf * 100.
4. Include every question exactly once.
5. Never invent answers.
6. Never invent mappings.
7. Never award marks to unmatched answers.
8. Never give an unanswered question marks.
9. Return JSON only.
`;

    const rawResult =
      await generateGeminiJSON([
        {
          text: prompt,
        },
      ]);

    const aiResult =
      rawResult as Partial<GradingResponse>;

    const aiResults = Array.isArray(
      aiResult?.results
    )
      ? aiResult.results
      : [];

    /*
     * =========================================================
     * BUILD FINAL RESULTS FROM QUESTIONS
     * =========================================================
     */

    const results: GradeResult[] =
      questions.map((question) => {
        const questionNumber = String(
          question.number ??
            question.questionNumber ??
            question.id
        );

        const maxMarks = Math.max(
          0,
          Number(question.marks ?? 0)
        );

        const mapping = mappings.find(
          (item) =>
            item.questionId === question.id
        );

        const answer = mapping
          ? answers.find(
              (item) =>
                item.id === mapping.answerId
            )
          : undefined;

        /*
         * No mapping = unanswered.
         */

        if (!mapping || !answer) {
          return {
            questionId: question.id,
            questionNumber,
            obtainedMarks: 0,
            maxMarks,
            status: "unanswered",
            feedback: "No answer provided.",
          };
        }

        /*
         * Find AI grading result.
         */

        const aiItem = aiResults.find(
          (item) =>
            item?.questionId === question.id
        );

        if (!aiItem) {
          return {
            questionId: question.id,
            questionNumber,
            obtainedMarks: 0,
            maxMarks,
            status: "incorrect",
            feedback:
              "Unable to evaluate this answer.",
          };
        }

        /*
         * Clamp marks.
         */

        let obtainedMarks = Number(
          aiItem.obtainedMarks ?? 0
        );

        if (!Number.isFinite(obtainedMarks)) {
          obtainedMarks = 0;
        }

        obtainedMarks = Math.max(
          0,
          Math.min(
            obtainedMarks,
            maxMarks
          )
        );

        /*
         * Normalize status.
         */

        let status:
          | "correct"
          | "partially_correct"
          | "incorrect"
          | "unanswered";

        if (
          obtainedMarks >= maxMarks &&
          maxMarks > 0
        ) {
          status = "correct";
          obtainedMarks = maxMarks;
        } else if (
          obtainedMarks > 0
        ) {
          status = "partially_correct";
        } else {
          status = "incorrect";
        }

        /*
         * Mapped answer can NEVER be unanswered.
         */

        return {
          questionId: question.id,
          questionNumber,
          obtainedMarks,
          maxMarks,
          status,
          feedback:
            typeof aiItem.feedback ===
              "string" &&
            aiItem.feedback.trim()
              ? aiItem.feedback.trim()
              : obtainedMarks > 0
                ? "Answer evaluated successfully."
                : "Answer is incorrect.",
        };
      });

    /*
     * =========================================================
     * CALCULATE SCORE OURSELVES
     * =========================================================
     */

    const total = results.reduce(
      (sum, result) =>
        sum + result.obtainedMarks,
      0
    );

    const outOf = results.reduce(
      (sum, result) =>
        sum + result.maxMarks,
      0
    );

    const percentage =
      outOf > 0
        ? Number(
            (
              (total / outOf) *
              100
            ).toFixed(2)
          )
        : 0;

    /*
     * =========================================================
     * OVERALL FEEDBACK
     * =========================================================
     */

    const overallFeedback =
      typeof aiResult?.overallFeedback ===
        "string" &&
      aiResult.overallFeedback.trim()
        ? aiResult.overallFeedback.trim()
        : total === outOf && outOf > 0
          ? "Excellent work. All answers were correct."
          : total > 0
            ? "Good attempt. Review the incorrect and partially correct answers."
            : "Review the unanswered and incorrect answers.";

    const finalResult: GradingResponse = {
      total,
      outOf,
      percentage,
      results,
      overallFeedback,
    };

    return NextResponse.json(
      finalResult
    );
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