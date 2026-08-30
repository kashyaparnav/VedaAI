"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

import QuestionList from "@/components/assessment/QuestionList";
import { AnswerViewer } from "@/components/assessment/AnswerViewer";
import { AIReview } from "@/components/assessment/AIReview";

import type { Question } from "@/types/question";
import type { Answer } from "@/types/answer";

type GradeStatus =
  | "correct"
  | "partially_correct"
  | "incorrect"
  | "unanswered";

type GradeResult = {
  questionId: string;
  questionNumber: string;
  obtainedMarks: number;
  maxMarks: number;
  status: GradeStatus;
  feedback: string;
};

type GradingData = {
  total: number;
  outOf: number;
  percentage: number;
  results: GradeResult[];
  overallFeedback: string;
  aiUnavailable?: boolean;
  error?: string;
};

type Mapping = {
  answerId: string;
  questionId?: string | null;
  questionNumber?: string | null;
  page?: number;
  boundingBoxes?: Answer["boundingBoxes"];
  confidence?: number;
  source?: "direct" | "number" | "ai";
};

type UnansweredQuestion = {
  questionId: string;
  questionNumber: string;
};

type UnmatchedAnswer = {
  answerId: string;
  questionNumber: string | null;
  page: number;
  text: string;
  boundingBoxes: Answer["boundingBoxes"];
};

/**
 * Safely convert any value to a number.
 */
function safeNumber(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/**
 * Clamp marks so the UI can never show
 * negative marks or marks greater than max.
 */
function clampMarks(
  value: unknown,
  maxMarks: unknown
) {
  const max = Math.max(
    0,
    safeNumber(maxMarks)
  );

  const obtained = safeNumber(value);

  return Math.min(
    max,
    Math.max(0, obtained)
  );
}

/**
 * Convert backend grading status to the status
 * expected by QuestionList.
 */
function questionStatus(
  status: GradeStatus,
  obtainedMarks: number,
  maxMarks: number
): Question["status"] {
  if (status === "unanswered") {
    return "unanswered";
  }

  if (
    status === "correct" ||
    (maxMarks > 0 &&
      obtainedMarks >= maxMarks)
  ) {
    return "answered";
  }

  if (
    status === "partially_correct" ||
    obtainedMarks > 0
  ) {
    return "partial";
  }

  return "unanswered";
}

export default function AssessmentPage() {
  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [answers, setAnswers] =
    useState<Answer[]>([]);

  const [mappings, setMappings] =
    useState<Mapping[]>([]);

  const [
    unansweredQuestions,
    setUnansweredQuestions,
  ] = useState<UnansweredQuestion[]>([]);

  const [
    unmatchedAnswers,
    setUnmatchedAnswers,
  ] = useState<UnmatchedAnswer[]>([]);

  const [grading, setGrading] =
    useState<GradingData | null>(null);

  const [active, setActive] =
    useState("");

  const [tab, setTab] = useState<
    "questions" | "answers"
  >("questions");

  const [loading, setLoading] =
    useState(true);

  /*
   * =========================================================
   * LOAD ASSESSMENT DATA
   * =========================================================
   */

  useEffect(() => {
    try {
      const questionsData =
        sessionStorage.getItem(
          "veda-extracted-questions"
        );

      const answersData =
        sessionStorage.getItem(
          "veda-extracted-answers"
        );

      const mappingsData =
        sessionStorage.getItem(
          "veda-answer-mappings"
        );

      const gradingData =
        sessionStorage.getItem(
          "veda-grading-result"
        );

      const extractedQuestions: Question[] =
        questionsData
          ? JSON.parse(questionsData)
          : [];

      const extractedAnswers: Answer[] =
        answersData
          ? JSON.parse(answersData)
          : [];

      const mappingResponse = mappingsData
        ? JSON.parse(mappingsData)
        : {};

      const extractedMappings: Mapping[] =
        Array.isArray(mappingResponse)
          ? mappingResponse
          : Array.isArray(
                mappingResponse?.mappings
              )
            ? mappingResponse.mappings
            : [];

      const extractedUnanswered: UnansweredQuestion[] =
        Array.isArray(
          mappingResponse?.unansweredQuestions
        )
          ? mappingResponse.unansweredQuestions
          : [];

      const extractedUnmatched: UnmatchedAnswer[] =
        Array.isArray(
          mappingResponse?.unmatchedAnswers
        )
          ? mappingResponse.unmatchedAnswers
          : [];

      const extractedGrading: GradingData | null =
        gradingData
          ? JSON.parse(gradingData)
          : null;

      /*
       * =======================================================
       * BUILD FINAL QUESTIONS
       * =======================================================
       */

      const gradedQuestions: Question[] =
        extractedQuestions.map((question) => {
          const result =
            extractedGrading?.results?.find(
              (item) =>
                item.questionId === question.id
            );

          const mapping =
            extractedMappings.find(
              (item) =>
                item.questionId === question.id
            );

          const answer =
            mapping
              ? extractedAnswers.find(
                  (item) =>
                    item.id === mapping.answerId
                )
              : undefined;

          /*
           * ---------------------------------------------------
           * NO AI GRADING RESULT
           * ---------------------------------------------------
           */

          if (!result) {
            return {
              ...question,
              answerId: answer?.id,
              aiFeedback: undefined,
              obtainedMarks: 0,
              status: answer
                ? "answered"
                : "unanswered",
            };
          }

          /*
           * ---------------------------------------------------
           * NORMALIZE AI RESULT
           * ---------------------------------------------------
           */

          const maxMarks = Math.max(
            0,
            safeNumber(
              result.maxMarks,
              safeNumber(question.marks)
            )
          );

          const obtained = clampMarks(
            result.obtainedMarks,
            maxMarks
          );

          /*
           * IMPORTANT:
           *
           * Do NOT convert an explicit "incorrect"
           * result into "unanswered".
           *
           * Previously the UI did:
           *
           * obtained = 0
           *       ↓
           * status = unanswered
           *
           * even when Gemini explicitly said
           * "incorrect".
           */

          const status =
            result.status === "unanswered"
              ? "unanswered"
              : questionStatus(
                  result.status,
                  obtained,
                  maxMarks
                );

          return {
            ...question,
            marks: maxMarks,
            obtainedMarks: obtained,
            status,
            answerId: answer?.id,
            aiFeedback:
              result.feedback || undefined,
          };
        });

      setQuestions(gradedQuestions);
      setAnswers(extractedAnswers);
      setMappings(extractedMappings);

      setUnansweredQuestions(
        extractedUnanswered
      );

      setUnmatchedAnswers(
        extractedUnmatched
      );

      setGrading(extractedGrading);

      if (gradedQuestions.length > 0) {
        setActive(
          gradedQuestions[0].id
        );
      }
    } catch (error) {
      console.error(
        "Failed to load assessment:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * =========================================================
   * ACTIVE QUESTION
   * =========================================================
   */

  const question = useMemo(
    () =>
      questions.find(
        (item) => item.id === active
      ) ?? questions[0],
    [questions, active]
  );

  /*
   * =========================================================
   * FIND MAPPING
   * =========================================================
   */

  const mapping = useMemo(() => {
    if (!question) {
      return undefined;
    }

    return mappings.find(
      (item) =>
        item.questionId === question.id
    );
  }, [mappings, question]);

  /*
   * =========================================================
   * FIND ANSWER
   * =========================================================
   */

  const answer = useMemo(() => {
    if (!mapping) {
      return undefined;
    }

    return answers.find(
      (item) =>
        item.id === mapping.answerId
    );
  }, [answers, mapping]);

  /*
   * =========================================================
   * ANSWER PAGE
   * =========================================================
   */

  const answerPage =
    mapping?.page ??
    answer?.page ??
    1;

  /*
   * =========================================================
   * BOUNDING BOXES
   * =========================================================
   */

  const boundingBoxes =
    mapping?.boundingBoxes?.length
      ? mapping.boundingBoxes
      : answer?.boundingBoxes ?? [];

  /*
   * =========================================================
   * SCORE
   *
   * IMPORTANT:
   * Calculate from the actual question results.
   *
   * This avoids showing stale "0" from the backend
   * when the result object is incomplete.
   * =========================================================
   */

  const totalMarks = useMemo(() => {
    return questions.reduce(
      (sum, item) =>
        sum +
        safeNumber(item.marks),
      0
    );
  }, [questions]);

  const obtainedMarks = useMemo(() => {
    return questions.reduce(
      (sum, item) =>
        sum +
        clampMarks(
          item.obtainedMarks,
          item.marks
        ),
      0
    );
  }, [questions]);

  const percentage = useMemo(() => {
    if (totalMarks <= 0) {
      return 0;
    }

    return Math.round(
      (obtainedMarks /
        totalMarks) *
        100
    );
  }, [obtainedMarks, totalMarks]);

  /*
   * =========================================================
   * AI STATUS
   * =========================================================
   */

  const aiUnavailable =
    grading?.aiUnavailable === true;

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4]">
        <p className="text-sm text-[#777]">
          Loading assessment...
        </p>
      </div>
    );
  }

  /*
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */

  if (!questions.length) {
    return (
      <main className="app-shell">
        <Sidebar />

        <section className="main-area">
          <Header />

          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-[#333]">
                No assessment data found
              </h1>

              <p className="mt-2 text-sm text-[#777]">
                Please upload the question
                paper and answer sheet again.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/upload";
                }}
                className="mt-5 rounded-md bg-[#ff5630] px-4 py-2 text-sm font-medium text-white"
              >
                Upload Again
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN UI
   * =========================================================
   */

  return (
    <main className="app-shell">
      <Sidebar />

      <section className="main-area">
        <Header />

        {/* =====================================================
            ASSESSMENT HEADER
        ===================================================== */}

        <div className="assessment-head">
          <div className="segmented">
            <button
              type="button"
              className={
                tab === "questions"
                  ? "on"
                  : ""
              }
              onClick={() =>
                setTab("questions")
              }
            >
              Questions
            </button>

            <button
              type="button"
              className={
                tab === "answers"
                  ? "on"
                  : ""
              }
              onClick={() =>
                setTab("answers")
              }
            >
              Answer Sheet
            </button>
          </div>

          <span>
            Student: Naman Kumar Chaudhary
          </span>
        </div>

        {/* =====================================================
            AI UNAVAILABLE WARNING
        ===================================================== */}

        {aiUnavailable && (
          <div className="mx-4 mt-3 rounded-[8px] border border-[#f5c2b8] bg-[#fff5f2] px-4 py-3">
            <div className="text-[11px] font-semibold text-[#d83a17]">
              AI grading is temporarily unavailable
            </div>

            <div className="mt-1 text-[10px] text-[#777]">
              {grading?.error ||
                "The answers were extracted and mapped, but AI grading could not be completed."}
            </div>
          </div>
        )}

        {/* =====================================================
            SCORE SUMMARY
        ===================================================== */}

        <div className="flex shrink-0 items-center gap-8 border-b border-[#e5e5e5] bg-white px-5 py-3">
          <div>
            <div className="text-[9px] text-[#999]">
              Questions
            </div>

            <div className="text-[13px] font-semibold text-[#333]">
              {questions.length}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-[#999]">
              Total Marks
            </div>

            <div className="text-[13px] font-semibold text-[#333]">
              {totalMarks}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-[#999]">
              Obtained
            </div>

            <div className="text-[13px] font-semibold text-[#ff5630]">
              {aiUnavailable
                ? "—"
                : obtainedMarks}
            </div>
          </div>

          <div
            className={
              aiUnavailable
                ? "ml-auto rounded-full bg-[#f4f4f4] px-4 py-2 text-[10px] font-medium text-[#777]"
                : "ml-auto rounded-full bg-[#e9f8ed] px-4 py-2 text-[10px] font-medium text-[#4da85b]"
            }
          >
            {aiUnavailable
              ? "AI Grading Pending"
              : `${percentage}% Score`}
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="assessment-grid">
          {/* ===================================================
              QUESTIONS
          =================================================== */}

          <div
            className={`questions-pane ${
              tab === "answers"
                ? "hide-mobile"
                : ""
            }`}
          >
            <QuestionList
              questions={questions}
              selectedId={active}
              onSelect={(selected) => {
                setActive(selected.id);
              }}
            />

            {/* =================================================
                UNANSWERED SUMMARY
            ================================================= */}

            {unansweredQuestions.length >
              0 && (
              <div className="mx-2 mb-2 rounded-[8px] border border-[#eeeeee] bg-white p-3">
                <div className="text-[10px] font-semibold text-[#555]">
                  Unanswered
                </div>

                <div className="mt-1 text-[9px] text-[#999]">
                  {
                    unansweredQuestions.length
                  }{" "}
                  question
                  {unansweredQuestions.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  without an answer
                </div>
              </div>
            )}

            {/* =================================================
                UNMATCHED ANSWERS
            ================================================= */}

            {unmatchedAnswers.length >
              0 && (
              <div className="mx-2 mb-2 rounded-[8px] border border-[#eeeeee] bg-white p-3">
                <div className="text-[10px] font-semibold text-[#555]">
                  Unmatched Answers
                </div>

                <div className="mt-1 text-[9px] text-[#999]">
                  {
                    unmatchedAnswers.length
                  }{" "}
                  answer
                  {unmatchedAnswers.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  could not be matched
                </div>
              </div>
            )}

            {/* =================================================
                AI FEEDBACK
            ================================================= */}

            <AIReview
              feedback={
                aiUnavailable
                  ? "AI grading is currently unavailable. Answer extraction and mapping are still available."
                  : grading?.overallFeedback
              }
            />
          </div>

          {/* ===================================================
              ANSWER SHEET
          =================================================== */}

          <div
            className={`answer-pane ${
              tab === "questions"
                ? "hide-mobile"
                : ""
            }`}
          >
            {question && (
              <AnswerViewer
                regions={boundingBoxes}
                label={`Q${question.number}`}
                page={answerPage}
              />
            )}

            {!answer && (
              <div className="flex h-full items-center justify-center bg-[#f4f4f4]">
                <div className="text-center">
                  <p className="text-sm font-medium text-[#555]">
                    No answer found
                  </p>

                  <p className="mt-1 text-[10px] text-[#999]">
                    This question appears to
                    be unanswered.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}