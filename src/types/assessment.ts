import { Question } from "./question";
import { Answer } from "./answer";

export interface Assessment {
  id: string;

  questions: Question[];

  answers: Answer[];

  selectedQuestionId: string;

  totalMarks: number;

  obtainedMarks: number;
}