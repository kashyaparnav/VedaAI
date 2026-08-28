"use client";

import { ArrowLeft, Sparkles } from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/upload/FileUpload";
import type { UploadedFile } from "@/components/upload/UploadCard";

export default function UploadPage() {
  const handleFilesReady = (
    questionPaper: UploadedFile,
    answerSheet: UploadedFile
  ) => {
    /*
     * Save file metadata for the next screen.
     * The actual File objects are already stored by
     * FileUpload.tsx using IndexedDB.
     */

    sessionStorage.setItem(
      "veda-assessment-files",
      JSON.stringify({
        questionPaper: {
          name: questionPaper.name,
          size: questionPaper.size,
          type: questionPaper.type,
        },
        answerSheet: {
          name: answerSheet.name,
          size: answerSheet.size,
          type: answerSheet.type,
        },
      })
    );

    /*
     * Move to processing screen.
     */

    window.location.href = "/processing";
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <Sidebar />

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="flex min-w-0 flex-1 flex-col">

          <Header />

          {/* =================================================
              BREADCRUMB
          ================================================= */}

          <div className="flex h-[42px] items-center gap-[7px] px-[20px] text-[11px] text-[#858585]">
            <ArrowLeft
              size={16}
              strokeWidth={1.7}
            />

            <span>
              Exams
            </span>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section className="flex flex-1 items-start justify-center px-[20px] pb-[30px] pt-[18px]">

            <div className="w-full max-w-[850px]">

              {/* =================================================
                  HEADING
              ================================================= */}

              <div className="text-center">

                <h1 className="text-[26px] font-bold tracking-[-1px] text-[#2d2d2d] md:text-[29px]">

                  Upload{" "}

                  <span className="text-[#ff5630]">
                    Question Paper & Answer Sheets
                  </span>

                </h1>

                <p className="mt-[5px] text-[11px] text-[#555]">
                  Upload both files to get started
                </p>

              </div>

              {/* =================================================
                  TEACHER ILLUSTRATION
              ================================================= */}

              <div className="my-[22px] flex justify-center">

                <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#ffe0d8]">

                  <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#ffb9a8]">

                    <Sparkles
                      size={27}
                      strokeWidth={1.6}
                      className="text-white"
                    />

                  </div>

                  {/* Decorative dots */}

                  <span className="absolute left-[5px] top-[27px] h-[6px] w-[6px] rounded-full border border-[#ff6848] bg-white" />

                  <span className="absolute right-[5px] top-[39px] h-[6px] w-[6px] rounded-full border border-[#ff6848] bg-white" />

                  <span className="absolute right-[21px] top-[3px] h-[6px] w-[6px] rounded-full border border-[#ff6848] bg-white" />

                </div>

              </div>

              {/* =================================================
                  FILE UPLOAD COMPONENT
              ================================================= */}

              <FileUpload
                onFilesReady={handleFilesReady}
              />

            </div>

          </section>

        </main>

      </div>
    </div>
  );
}