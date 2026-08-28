"use client";

import { useState } from "react";

import UploadCard, {
  UploadedFile,
} from "./UploadCard";

import {
  saveFile,
  deleteFile,
} from "@/lib/file-storage";

interface FileUploadProps {
  onFilesReady: (
    questionPaper: UploadedFile,
    answerSheet: UploadedFile
  ) => void;
}

export default function FileUpload({
  onFilesReady,
}: FileUploadProps) {
  const [questionPaper, setQuestionPaper] =
    useState<UploadedFile | null>(null);

  const [answerSheet, setAnswerSheet] =
    useState<UploadedFile | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const validateFile = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please upload a PDF, PNG or JPG file."
      );

      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(
        "Maximum file size is 10MB."
      );

      return false;
    }

    return true;
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "question" | "answer"
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
      };

      if (type === "question") {
        await saveFile(
          "question-paper",
          file
        );

        setQuestionPaper(uploadedFile);
      } else {
        await saveFile(
          "answer-sheet",
          file
        );

        setAnswerSheet(uploadedFile);
      }
    } catch (error) {
      console.error(
        "File upload error:",
        error
      );

      alert(
        "Something went wrong while saving the file."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeQuestionPaper =
    async () => {
      await deleteFile(
        "question-paper"
      );

      setQuestionPaper(null);
    };

  const removeAnswerSheet =
    async () => {
      await deleteFile(
        "answer-sheet"
      );

      setAnswerSheet(null);
    };

  const startMapping = () => {
    if (
      !questionPaper ||
      !answerSheet
    ) {
      return;
    }

    onFilesReady(
      questionPaper,
      answerSheet
    );
  };

  const bothUploaded =
    Boolean(
      questionPaper &&
      answerSheet
    );

  return (
    <div className="flex w-full flex-col items-center">

      {/* ================= UPLOAD CARDS ================= */}

      <div className="grid w-full max-w-[850px] grid-cols-1 gap-[2px] rounded-[17px] bg-white p-[7px] shadow-[0_2px_15px_rgba(0,0,0,0.04)] md:grid-cols-2">

        <UploadCard
          title="Question Paper"
          file={questionPaper}
          onUpload={(event) =>
            handleUpload(
              event,
              "question"
            )
          }
          onRemove={
            removeQuestionPaper
          }
        />

        <UploadCard
          title="Answer Sheet"
          file={answerSheet}
          onUpload={(event) =>
            handleUpload(
              event,
              "answer"
            )
          }
          onRemove={
            removeAnswerSheet
          }
        />

      </div>

      {/* ================= START MAPPING ================= */}

      <button
        type="button"
        disabled={
          !bothUploaded ||
          uploading
        }
        onClick={startMapping}
        className={`mt-[17px] flex h-[33px] items-center gap-[7px] rounded-full px-[19px] text-[10px] font-medium transition-all ${
          bothUploaded &&
          !uploading
            ? "bg-[#292929] text-white shadow-[0_2px_7px_rgba(0,0,0,0.15)] hover:bg-black"
            : "bg-[#bdbdbd] text-white"
        }`}
      >
        {uploading
          ? "Uploading..."
          : "Start Mapping"}

        {!uploading && (
          <span className="text-[13px]">
            →
          </span>
        )}
      </button>

      <p className="mt-[8px] text-[9px] text-[#999]">
        {bothUploaded
          ? "Both files uploaded. Ready to map answers with questions."
          : "Once both files are uploaded, you'll be able to map answers with questions"}
      </p>

    </div>
  );
}