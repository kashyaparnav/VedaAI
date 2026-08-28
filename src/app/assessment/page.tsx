"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

import QuestionList from "@/components/assessment/QuestionList";
import { AnswerViewer } from "@/components/assessment/AnswerViewer";
import { AIReview } from "@/components/assessment/AIReview";

import type { Question } from "@/types/question";
import type { Answer } from "@/types/answer";

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

type GradingData = {
  total: number;
  outOf: number;
  percentage: number;
  results: GradeResult[];
  overallFeedback: string;
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

export default function AssessmentPage() {
  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [answers, setAnswers] =
    useState<Answer[]>([]);

  const [mappings, setMappings] =
    useState<Mapping[]>([]);

  const [unansweredQuestions, setUnansweredQuestions] =
    useState<UnansweredQuestion[]>([]);

  const [unmatchedAnswers, setUnmatchedAnswers] =
    useState<UnmatchedAnswer[]>([]);

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
          : Array.isArray(mappingResponse?.mappings)
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
       * APPLY GRADING + MAPPING TO QUESTIONS
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
           * No grading result.
           */
          if (!result) {
            return {
              ...question,
              answerId: answer?.id,
              aiFeedback: undefined,
              obtainedMarks: answer
                ? question.obtainedMarks
                : 0,
              status: answer
                ? "answered"
                : "unanswered",
            };
          }

          const obtained = Number(
            result.obtainedMarks ?? 0
          );

          const maxMarks = Number(
            result.maxMarks ??
              question.marks ??
              0
          );

          let status: Question["status"];

          if (
            result.status === "unanswered"
          ) {
            status = "unanswered";
          } else if (
            obtained >= maxMarks &&
            maxMarks > 0
          ) {
            status = "answered";
          } else if (obtained > 0) {
            status = "partial";
          } else {
            status = "unanswered";
          }

          return {
            ...question,
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
   * FIND MAPPING FOR ACTIVE QUESTION
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
   * FIND ANSWER USING MAPPING
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
   * PAGE + ALL BOUNDING BOXES
   * =========================================================
   */

  const answerPage =
    mapping?.page ??
    answer?.page ??
    1;

  const boundingBoxes =
    mapping?.boundingBoxes?.length
      ? mapping.boundingBoxes
      : answer?.boundingBoxes ?? [];

  /*
   * Keep the existing AnswerViewer interface
   * by sending the first box.
   *
   * We will upgrade it to accept multiple
   * boxes in the next step.
   */

  const region =
    boundingBoxes[0];

  /*
   * =========================================================
   * SCORE
   * =========================================================
   */

  const totalMarks =
    grading?.outOf ??
    questions.reduce(
      (sum, item) =>
        sum +
        Number(item.marks || 0),
      0
    );

  const obtainedMarks =
    grading?.total ??
    questions.reduce(
      (sum, item) =>
        sum +
        Number(
          item.obtainedMarks || 0
        ),
      0
    );

  const percentage =
    grading?.percentage ??
    (totalMarks > 0
      ? Math.round(
          (obtainedMarks /
            totalMarks) *
            100
        )
      : 0);

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
              {obtainedMarks}
            </div>
          </div>

          <div className="ml-auto rounded-full bg-[#e9f8ed] px-4 py-2 text-[10px] font-medium text-[#4da85b]">
            {percentage}% Score
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

            {/* Unanswered summary */}

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

            {/* Unmatched summary */}

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

            <AIReview
              feedback={
                grading?.overallFeedback
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
                region={region}
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