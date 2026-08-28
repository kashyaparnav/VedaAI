"use client";

import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
} from "lucide-react";

import type { Question } from "@/types/question";

interface QuestionCardProps {
  question: Question;
  selected: boolean;
  expanded: boolean;
  onClick: () => void;
}

export default function QuestionCard({
  question,
  selected,
  expanded,
  onClick,
}: QuestionCardProps) {
  const isCorrect =
    question.status === "answered" &&
    question.obtainedMarks === question.marks;

  const isPartial =
    question.status === "partial";

  const isUnanswered =
    question.status === "unanswered";

  const isIncorrect =
    question.status === "answered" &&
    question.obtainedMarks === 0;

  const statusLabel = isUnanswered
    ? "Unanswered"
    : isCorrect
      ? "Correct"
      : isPartial
        ? "Partially correct"
        : isIncorrect
          ? "Incorrect"
          : "Reviewed";

  const StatusIcon = isUnanswered
    ? Circle
    : isCorrect
      ? CheckCircle2
      : isPartial
        ? AlertCircle
        : isIncorrect
          ? XCircle
          : Circle;

  const statusClass = isUnanswered
    ? "bg-[#ffe5df] text-[#e85535]"
    : isCorrect
      ? "bg-[#e5f6e1] text-[#3a9d31]"
      : isPartial
        ? "bg-[#fff0d8] text-[#bd7900]"
        : isIncorrect
          ? "bg-[#ffe5e5] text-[#d33b3b]"
          : "bg-[#eeeeee] text-[#777]";

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-[9px] border transition-all ${
        selected
          ? "border-[#ff6b4a] bg-[#fffaf8] shadow-[0_1px_4px_rgba(255,107,74,0.08)]"
          : "border-[#e4e4e4] bg-white hover:border-[#cfcfcf]"
      }`}
    >
      <div className="flex gap-3 p-[10px]">

        {/* =================================================
            QUESTION NUMBER
        ================================================= */}

        <div
          className={`flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
            selected
              ? "bg-[#ff6848]"
              : "bg-[#555]"
          }`}
        >
          {question.number}
        </div>

        {/* =================================================
            QUESTION CONTENT
        ================================================= */}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-2">

            <p className="text-[11px] leading-[16px] text-[#333]">
              {question.text}
            </p>

            <span
              className={`shrink-0 rounded-full px-[8px] py-[3px] text-[9px] font-semibold ${
                isUnanswered
                  ? "bg-[#ffe5df] text-[#e85535]"
                  : isCorrect
                    ? "bg-[#e5f6e1] text-[#3a9d31]"
                    : isPartial
                      ? "bg-[#fff0d8] text-[#bd7900]"
                      : "bg-[#ffe5e5] text-[#d33b3b]"
              }`}
            >
              {question.obtainedMarks}/
              {question.marks}
            </span>
          </div>

          {/* =================================================
              STATUS
          ================================================= */}

          <div className="mt-[7px] flex items-center gap-[5px]">

            <StatusIcon
              size={12}
              strokeWidth={2}
              className={
                isUnanswered
                  ? "text-[#e85535]"
                  : isCorrect
                    ? "text-[#3a9d31]"
                    : isPartial
                      ? "text-[#bd7900]"
                      : isIncorrect
                        ? "text-[#d33b3b]"
                        : "text-[#777]"
              }
            />

            <span
              className={`text-[9px] font-medium ${
                isUnanswered
                  ? "text-[#e85535]"
                  : isCorrect
                    ? "text-[#3a9d31]"
                    : isPartial
                      ? "text-[#bd7900]"
                      : isIncorrect
                        ? "text-[#d33b3b]"
                        : "text-[#777]"
              }`}
            >
              {statusLabel}
            </span>

          </div>

          {/* =================================================
              AI FEEDBACK
          ================================================= */}

          {expanded && (
            <div className="mt-[9px] rounded-[8px] border border-[#eeeeee] bg-[#f7f7f7] p-[9px]">

              <p className="text-[9px] font-semibold text-[#333]">
                AI Feedback
              </p>

              <p className="mt-[4px] text-[9px] leading-[14px] text-[#777]">
                {question.aiFeedback ||
                  (isUnanswered
                    ? "No answer was provided for this question."
                    : "No specific feedback was generated.")}
              </p>

            </div>
          )}

        </div>

        {/* =================================================
            EXPAND ICON
        ================================================= */}

        <div className="flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-[#f3f3f3]">

          {expanded ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )}

        </div>

      </div>
    </div>
  );
}