import { Assessment } from "@/types/assessment";

export const demoAssessment: Assessment = {
  id: "demo-assessment",

  selectedQuestionId: "q1",

  totalMarks: 10,

  obtainedMarks: 8,

  questions: [
    {
      id: "q1",
      number: "1",
      text: "Which of the following organelles is primarily involved in photosynthesis?",
      marks: 2,
      obtainedMarks: 2,
      status: "answered",
      answerId: "a1",
      aiFeedback:
        "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis.",
    },

    {
      id: "q2",
      number: "2",
      text: "Which blood vessel carries blood away from the heart?",
      marks: 2,
      obtainedMarks: 2,
      status: "answered",
      answerId: "a2",
      aiFeedback:
        "Correct. Arteries carry blood away from the heart.",
    },

    {
      id: "q3",
      number: "3",
      text: "Explain the role of chloroplasts in photosynthesis.",
      marks: 2,
      obtainedMarks: 2,
      status: "answered",
      answerId: "a3",
    },

    {
      id: "q4",
      number: "4",
      text: "Describe the flow of blood through the human heart starting from the right atrium and ending at the aorta.",
      marks: 2,
      obtainedMarks: 0,
      status: "unanswered",
    },

    {
      id: "q5",
      number: "5",
      text: "Draw a labelled diagram of an alveolus showing capillaries and air space.",
      marks: 2,
      obtainedMarks: 2,
      status: "answered",
      answerId: "a5",
    },
  ],

  answers: [
    {
      id: "a1",
      questionId: "q1",
      questionNumber: "1",
      text: "Photosynthesis mainly takes place inside chloroplasts.",
      page: 1,
      confidence: 0.98,
      boundingBoxes: [
  {
    x: 5,
    y: 14,
    width: 90,
    height: 4,
      },
     ],
    },

    {
      id: "a2",
      questionId: "q2",
      questionNumber: "2",
      text: "Arteries carry blood away from the heart.",
      page: 1,
      confidence: 0.97,
      boundingBoxes: [
        {
          x: 12,
          y: 40,
          width: 74,
          height: 12,
        },
      ],
    },

    {
      id: "a3",
      questionId: "q3",
      questionNumber: "3",
      text: "Chloroplasts contain chlorophyll and are the main site of photosynthesis.",
      page: 1,
      confidence: 0.95,
      boundingBoxes: [
        {
          x: 10,
          y: 58,
          width: 80,
          height: 15,
        },
      ],
    },

    {
      id: "a5",
      questionId: "q5",
      questionNumber: "5",
      text: "The alveolus is surrounded by a network of capillaries where gas exchange occurs.",
      page: 2,
      confidence: 0.93,
      boundingBoxes: [
        {
          x: 10,
          y: 25,
          width: 80,
          height: 25,
        },
      ],
    },
  ],
};