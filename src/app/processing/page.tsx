"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getFile } from "@/lib/file-storage";

type StepStatus =
  | "pending"
  | "processing"
  | "completed";

type ProcessingStep = {
  label: string;
  status: StepStatus;
};

export default function ProcessingPage() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] =
    useState("Starting...");

  const [error, setError] =
    useState("");

  const [steps, setSteps] = useState<
    ProcessingStep[]
  >([
    {
      label: "Reading uploaded files",
      status: "processing",
    },
    {
      label: "Extracting questions",
      status: "pending",
    },
    {
      label: "Extracting answers",
      status: "pending",
    },
    {
      label: "Mapping answers",
      status: "pending",
    },
    {
      label: "Evaluating answers",
      status: "pending",
    },
    {
      label: "Assessment ready",
      status: "pending",
    },
  ]);

  function updateSteps(
    currentStep: number
  ) {
    setSteps((previous) =>
      previous.map((step, index) => {
        if (index < currentStep) {
          return {
            ...step,
            status: "completed",
          };
        }

        if (index === currentStep) {
          return {
            ...step,
            status: "processing",
          };
        }

        return {
          ...step,
          status: "pending",
        };
      })
    );
  }

  useEffect(() => {
    let mounted = true;

    async function runProcessing() {
      try {
        /*
         * =====================================================
         * 1. LOAD FILES
         * =====================================================
         */

        if (mounted) {
          setProgress(5);
          setStatus(
            "Reading uploaded files..."
          );
          updateSteps(0);
        }

        const questionPaper =
          await getFile("question-paper");

        const answerSheet =
          await getFile("answer-sheet");

        if (!questionPaper) {
          throw new Error(
            "Question paper not found. Please upload it again."
          );
        }

        if (!answerSheet) {
          throw new Error(
            "Answer sheet not found. Please upload it again."
          );
        }

        /*
         * =====================================================
         * 2. EXTRACT QUESTIONS
         * =====================================================
         */

        if (mounted) {
          setProgress(15);
          setStatus(
            "Extracting questions from question paper..."
          );
          updateSteps(1);
        }

        const questionFormData =
          new FormData();

        questionFormData.append(
          "file",
          questionPaper
        );

        const questionResponse =
          await fetch(
            "/api/extract-questions",
            {
              method: "POST",
              body: questionFormData,
            }
          );

        const questionResult =
          await questionResponse.json();

        if (!questionResponse.ok) {
          throw new Error(
            questionResult?.error ||
              "Question extraction failed."
          );
        }

        if (
          !questionResult?.questions ||
          !Array.isArray(
            questionResult.questions
          )
        ) {
          throw new Error(
            "Invalid questions response from AI."
          );
        }

        sessionStorage.setItem(
          "veda-extracted-questions",
          JSON.stringify(
            questionResult.questions
          )
        );

        if (mounted) {
          setProgress(35);
          setStatus(
            `Extracted ${questionResult.questions.length} questions`
          );
          updateSteps(2);
        }

        /*
         * =====================================================
         * 3. EXTRACT ANSWERS
         * =====================================================
         */

        if (mounted) {
          setProgress(45);
          setStatus(
            "Extracting answers from answer sheet..."
          );
          updateSteps(2);
        }

        const answerFormData =
          new FormData();

        answerFormData.append(
          "file",
          answerSheet
        );

        const answerResponse =
          await fetch(
            "/api/extract-answers",
            {
              method: "POST",
              body: answerFormData,
            }
          );

        const answerResult =
          await answerResponse.json();

        if (!answerResponse.ok) {
          throw new Error(
            answerResult?.error ||
              "Answer extraction failed."
          );
        }

        if (
          !answerResult?.answers ||
          !Array.isArray(
            answerResult.answers
          )
        ) {
          throw new Error(
            "Invalid answers response from AI."
          );
        }

        sessionStorage.setItem(
          "veda-extracted-answers",
          JSON.stringify(
            answerResult.answers
          )
        );

        if (mounted) {
          setProgress(65);
          setStatus(
            `Extracted ${answerResult.answers.length} answers`
          );
          updateSteps(3);
        }

        /*
         * =====================================================
         * 4. MAP ANSWERS
         * =====================================================
         */

        if (mounted) {
          setProgress(72);
          setStatus(
            "Mapping answers to questions..."
          );
          updateSteps(3);
        }

        const mapResponse =
          await fetch(
            "/api/map-answers",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                questions:
                  questionResult.questions,
                answers:
                  answerResult.answers,
              }),
            }
          );

        const mapResult =
          await mapResponse.json();

        if (!mapResponse.ok) {
          throw new Error(
            mapResult?.error ||
              "Answer mapping failed."
          );
        }

        sessionStorage.setItem(
          "veda-answer-mappings",
          JSON.stringify(mapResult)
        );

        if (mounted) {
          setProgress(82);
          setStatus(
            "Answers mapped successfully."
          );
          updateSteps(4);
        }

        /*
         * =====================================================
         * 5. GRADE
         * =====================================================
         */

        if (mounted) {
          setProgress(88);
          setStatus(
            "Evaluating answers..."
          );
          updateSteps(4);
        }

        const gradeResponse =
          await fetch(
            "/api/grade",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                questions:
                  questionResult.questions,
                answers:
                  answerResult.answers,
                mappings:
                  mapResult?.mappings ?? [],
              }),
            }
          );

        const gradeResult =
          await gradeResponse.json();

        if (!gradeResponse.ok) {
          throw new Error(
            gradeResult?.error ||
              "Grading failed."
          );
        }

        sessionStorage.setItem(
          "veda-grading-result",
          JSON.stringify(gradeResult)
        );

        /*
         * =====================================================
         * 6. COMPLETE
         * =====================================================
         */

        if (mounted) {
          setProgress(100);
          setStatus(
            "Assessment ready!"
          );

          setSteps([
            {
              label:
                "Reading uploaded files",
              status: "completed",
            },
            {
              label:
                "Extracting questions",
              status: "completed",
            },
            {
              label:
                "Extracting answers",
              status: "completed",
            },
            {
              label:
                "Mapping answers",
              status: "completed",
            },
            {
              label:
                "Evaluating answers",
              status: "completed",
            },
            {
              label:
                "Assessment ready",
              status: "completed",
            },
          ]);
        }

        /*
         * =====================================================
         * GO TO ASSESSMENT
         * =====================================================
         */

        setTimeout(() => {
          if (mounted) {
            window.location.href =
              "/assessment";
          }
        }, 700);
      } catch (err) {
        console.error(
          "Assessment processing error:",
          err
        );

        if (mounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Something went wrong.";

          setError(message);
          setStatus(
            "Processing failed"
          );

          setSteps((previous) =>
            previous.map((step) =>
              step.status ===
              "processing"
                ? {
                    ...step,
                    status: "processing",
                  }
                : step
            )
          );
        }
      }
    }

    runProcessing();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col">
          <Header />

          <div className="flex h-[42px] items-center gap-[7px] px-[20px] text-[11px] text-[#858585]">
            <ArrowLeft
              size={16}
              strokeWidth={1.7}
            />

            <span>Exams</span>
          </div>

          <section className="flex flex-1 items-center justify-center px-5 pb-12">
            <div className="flex w-full max-w-[500px] flex-col items-center text-center">
              
              {/* ICON */}

              <div className="relative flex h-[88px] w-[88px] items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-[#ffb29f] opacity-60" />

                <div className="absolute inset-[8px] rounded-full border border-[#ffd0c5]" />

                <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#fff0eb]">
                  <Sparkles
                    size={30}
                    strokeWidth={1.7}
                    className="text-[#ff6848]"
                  />
                </div>
              </div>

              {/* TITLE */}

              <h1 className="mt-7 text-[20px] font-semibold text-[#303030]">
                {error
                  ? "Processing Failed"
                  : "Processing..."}
              </h1>

              <p className="mt-2 max-w-[420px] text-[11px] leading-[17px] text-[#8a8a8a]">
                {error || status}
              </p>

              {/* PROGRESS */}

              <div className="mt-7 h-[5px] w-[230px] overflow-hidden rounded-full bg-[#e4e4e4]">
                <div
                  className="h-full rounded-full bg-[#ff6848] transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-[9px] text-[#999]">
                Processing assessment{" "}
                {progress}%
              </p>

              {/* =================================================
                  PROCESSING STEPS
              ================================================= */}

              <div className="mt-7 w-full max-w-[360px] rounded-[12px] border border-[#e5e5e5] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col">
                  {steps.map(
                    (step, index) => {
                      const isLast =
                        index ===
                        steps.length - 1;

                      return (
                        <div
                          key={step.label}
                          className="relative flex items-center gap-3"
                        >
                          {/* CONNECTING LINE */}

                          {!isLast && (
                            <div
                              className={`absolute left-[10px] top-[23px] h-[20px] w-px ${
                                step.status ===
                                "completed"
                                  ? "bg-[#42c866]"
                                  : "bg-[#e5e5e5]"
                              }`}
                            />
                          )}

                          {/* STATUS ICON */}

                          <div
                            className={`relative z-10 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border ${
                              step.status ===
                              "completed"
                                ? "border-[#42c866] bg-[#42c866]"
                                : step.status ===
                                    "processing"
                                  ? "border-[#ff6848] bg-white"
                                  : "border-[#e5e5e5] bg-[#f4f4f4]"
                            }`}
                          >
                            {step.status ===
                              "completed" ? (
                              <Check
                                size={12}
                                strokeWidth={3}
                                className="text-white"
                              />
                            ) : step.status ===
                              "processing" ? (
                              <span className="h-[7px] w-[7px] rounded-full bg-[#ff6848]" />
                            ) : (
                              <span className="text-[8px] text-[#aaa]">
                                {index + 1}
                              </span>
                            )}
                          </div>

                          {/* LABEL */}

                          <div
                            className={`flex min-h-[32px] flex-1 items-center text-left text-[10px] ${
                              step.status ===
                              "processing"
                                ? "font-medium text-[#ff6848]"
                                : step.status ===
                                    "completed"
                                  ? "text-[#333]"
                                  : "text-[#999]"
                            }`}
                          >
                            {step.label}

                            {step.status ===
                              "processing" && (
                              <span className="ml-1">
                                ...
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* ERROR BUTTON */}

              {error && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/upload";
                  }}
                  className="mt-6 rounded-[6px] bg-[#ff6848] px-4 py-2 text-[11px] font-medium text-white"
                >
                  Upload Again
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}