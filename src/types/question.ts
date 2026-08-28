export type QuestionStatus =
  | "answered"
  | "unanswered"
  | "partial";

export interface Question {
  id: string;
  number: string;
  text: string;
  marks: number;
  obtainedMarks: number;
  status: QuestionStatus;
  answerId?: string;
  aiFeedback?: string;
}