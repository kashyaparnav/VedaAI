"use client";

import { useState } from "react";

import { Question } from "@/types/question";

import QuestionCard from "./QuestionCard";

interface QuestionListProps {
  questions: Question[];

  selectedId: string;

  onSelect: (question: Question) => void;
}

export default function QuestionList({
  questions,
  selectedId,
  onSelect,
}: QuestionListProps) {
  const [expandedId, setExpandedId] =
  useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-[#eeeeee] px-[13px] py-[11px]">

        <h2 className="text-[11px] font-semibold text-[#333]">
          Extracted Questions
          <span className="ml-1 font-normal text-[#999]">
            (from question paper)
          </span>
        </h2>

        <button
  type="button"
  onClick={() => {
    setExpandedId(
      expandedId ? null : questions[0]?.id ?? null
    );
  }}
  className="text-[9px] text-[#777]"
>
  {expandedId ? "Collapse" : "Expand"}
</button>

      </div>

      {/* Questions */}

      <div className="min-h-0 flex-1 space-y-[5px] overflow-y-auto p-[8px]">

        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            selected={
              selectedId === question.id
            }
            expanded={
              expandedId === question.id
            }
            onClick={() => {
              onSelect(question);

              setExpandedId(
                expandedId === question.id
                  ? null
                  : question.id
              );
            }}
          />
        ))}

      </div>

    </div>
  );
}