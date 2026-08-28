export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Answer {
  id: string;

  questionId?: string;

  questionNumber?: string;

  text: string;

  page: number;

  confidence: number;

  boundingBoxes: BoundingBox[];
}