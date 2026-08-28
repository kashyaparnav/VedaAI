"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";

import type { BoundingBox } from "@/types/answer";
import { AnswerHighlight } from "./AnswerHighlight";
import { getFile } from "@/lib/file-storage";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

interface AnswerViewerProps {
  region?: BoundingBox;
  label: string;
  page?: number;
}

type PDFModule = typeof import("react-pdf");

export function AnswerViewer({
  region,
  label,
  page = 1,
}: AnswerViewerProps) {
  const [pdfModule, setPdfModule] =
    useState<PDFModule | null>(null);

  const [fileUrl, setFileUrl] =
    useState<string | null>(null);

  const [numPages, setNumPages] =
    useState(0);

  const [currentPage, setCurrentPage] =
    useState(page || 1);

  const [scale, setScale] =
    useState(1);

  const [error, setError] =
    useState("");

  const [loadingPdf, setLoadingPdf] =
    useState(true);

  /*
   * =========================================================
   * LOAD REACT-PDF ONLY IN THE BROWSER
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadPDFLibrary() {
      try {
        const module = await import("react-pdf");

        /*
         * Configure PDF.js worker after the module
         * has been loaded in the browser.
         */
        module.pdfjs.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${module.pdfjs.version}/build/pdf.worker.min.mjs`;

        if (mounted) {
          setPdfModule(module);
          setLoadingPdf(false);
        }
      } catch (err) {
        console.error(
          "Failed to initialize react-pdf:",
          err
        );

        if (mounted) {
          setError(
            "Unable to initialize PDF viewer."
          );
          setLoadingPdf(false);
        }
      }
    }

    loadPDFLibrary();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =========================================================
   * LOAD ANSWER SHEET
   * =========================================================
   */

  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadAnswerSheet() {
      try {
        setError("");

        const file =
          await getFile("answer-sheet");

        if (!file) {
          setError(
            "Answer sheet not found. Please upload it again."
          );
          return;
        }

        /*
         * Make sure the retrieved object is a File/Blob.
         */
        if (!(file instanceof Blob)) {
          setError(
            "Invalid answer sheet file."
          );
          return;
        }

        objectUrl =
          URL.createObjectURL(file);

        setFileUrl(objectUrl);
      } catch (err) {
        console.error(
          "Failed to load answer sheet:",
          err
        );

        setError(
          "Unable to load answer sheet."
        );
      }
    }

    loadAnswerSheet();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  /*
   * =========================================================
   * CHANGE PAGE WHEN QUESTION CHANGES
   * =========================================================
   */

  useEffect(() => {
    if (
      page &&
      page >= 1 &&
      (!numPages || page <= numPages)
    ) {
      setCurrentPage(page);
    }
  }, [page, numPages]);

  /*
   * =========================================================
   * PDF LOAD SUCCESS
   * =========================================================
   */

  function handleDocumentLoadSuccess({
    numPages: totalPages,
  }: {
    numPages: number;
  }) {
    setNumPages(totalPages);

    const requestedPage =
      page && page >= 1
        ? page
        : 1;

    const safePage = Math.min(
      Math.max(requestedPage, 1),
      totalPages
    );

    setCurrentPage(safePage);
  }

  /*
   * =========================================================
   * PAGE CONTROLS
   * =========================================================
   */

  function previousPage() {
    setCurrentPage((value) =>
      Math.max(1, value - 1)
    );
  }

  function nextPage() {
    setCurrentPage((value) =>
      Math.min(
        numPages || value,
        value + 1
      )
    );
  }

  /*
   * =========================================================
   * ZOOM CONTROLS
   * =========================================================
   */

  function zoomOut() {
    setScale((value) =>
      Math.max(0.7, value - 0.1)
    );
  }

  function zoomIn() {
    setScale((value) =>
      Math.min(1.8, value + 0.1)
    );
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loadingPdf) {
    return (
      <div className="viewer-wrap">
        <div className="viewer-toolbar">
          <span className="text-[10px] text-[#777]">
            Loading PDF viewer...
          </span>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f4f4f4]">
          <div className="text-sm text-[#777]">
            Initializing PDF viewer...
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error) {
    return (
      <div className="viewer-wrap">
        <div className="viewer-toolbar">
          <span className="text-[10px] text-[#777]">
            Answer Sheet
          </span>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f4f4f4]">
          <div className="text-center">
            <p className="text-sm text-[#555]">
              Failed to load PDF file.
            </p>

            <p className="mt-2 text-[11px] text-[#999]">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * PDF COMPONENTS
   * =========================================================
   */

  const PDFDocument =
    pdfModule?.Document;

  const PDFPage =
    pdfModule?.Page;

  return (
    <div className="viewer-wrap">
      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="viewer-toolbar">
        {/* Zoom out */}

        <button
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          disabled={!pdfModule}
        >
          <Minus size={13} />
        </button>

        <b>
          {Math.round(scale * 100)}%
        </b>

        {/* Zoom in */}

        <button
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          disabled={!pdfModule}
        >
          <Plus size={13} />
        </button>

        <span className="toolbar-divider" />

        {/* Previous page */}

        <button
          type="button"
          onClick={previousPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={13} />
        </button>

        <b>
          Page {currentPage} of{" "}
          {numPages || 1}
        </b>

        {/* Next page */}

        <button
          type="button"
          onClick={nextPage}
          disabled={
            !numPages ||
            currentPage >= numPages
          }
          aria-label="Next page"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* =====================================================
          PDF AREA
      ===================================================== */}

      <div
        className="
          flex
          min-h-0
          flex-1
          items-start
          justify-center
          overflow-auto
          bg-[#f4f4f4]
          p-6
        "
      >
        {!fileUrl && (
          <div className="mt-10 text-sm text-[#777]">
            Loading answer sheet...
          </div>
        )}

        {fileUrl &&
          PDFDocument &&
          PDFPage && (
            <PDFDocument
              file={fileUrl}
              onLoadSuccess={
                handleDocumentLoadSuccess
              }
              onLoadError={(err) => {
                console.error(
                  "PDF render error:",
                  err
                );

                setError(
                  "Unable to render answer sheet PDF."
                );
              }}
              loading={
                <div className="mt-10 text-sm text-[#777]">
                  Loading PDF...
                </div>
              }
            >
              <div
                className="
                  relative
                  bg-white
                  shadow-[0_2px_12px_rgba(0,0,0,0.12)]
                "
              >
                <PDFPage
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                />

                {/* =================================================
                    AI ANSWER HIGHLIGHT
                ================================================= */}

                {region && (
                  <AnswerHighlight
                    box={region}
                    label={label}
                  />
                )}
              </div>
            </PDFDocument>
          )}
      </div>
    </div>
  );
}