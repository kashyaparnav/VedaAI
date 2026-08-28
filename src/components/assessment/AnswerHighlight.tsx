"use client";

import type { BoundingBox } from "@/types/answer";

interface AnswerHighlightProps {
  box: BoundingBox;
  label: string;
}

export function AnswerHighlight({
  box,
  label,
}: AnswerHighlightProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-[5px] border-2 border-[#ff5630] bg-[#ff5630]/10"
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
    >
      <span className="absolute -top-[22px] left-0 whitespace-nowrap rounded-[4px] bg-[#ff5630] px-[6px] py-[3px] text-[8px] font-semibold text-white shadow-sm">
        {label}
      </span>
    </div>
  );
}