"use client";

import { Sparkles } from "lucide-react";

interface AIReviewProps {
  feedback?: string;
}

export function AIReview({
  feedback,
}: AIReviewProps) {
  return (
    <section className="ai-review">
      <Sparkles size={17} />

      <div>
        <b>AI Feedback</b>

        <p>
          {feedback ||
            "AI feedback is not available yet."}
        </p>
      </div>
    </section>
  );
}