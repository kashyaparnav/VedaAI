"use client";

import {
  FileText,
  Upload,
  X,
} from "lucide-react";

export type UploadedFile = {
  name: string;
  size: number;
  type: string;
};

interface UploadCardProps {
  title: string;
  file: UploadedFile | null;
  onUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onRemove: () => void;
}

export default function UploadCard({
  title,
  file,
  onUpload,
  onRemove,
}: UploadCardProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.max(
        1,
        Math.round(bytes / 1024)
      )}KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="relative flex min-h-[132px] items-center justify-center rounded-[12px] border border-dashed border-[#d6d6d6] bg-[#fafafa] px-5 py-4">

      {file ? (
        /* ================= UPLOADED STATE ================= */

        <div className="flex w-full max-w-[360px] items-center justify-between rounded-[8px] bg-[#f4f4f4] px-[10px] py-[9px]">

          <div className="flex min-w-0 items-center gap-[10px]">

            {/* PDF ICON */}

            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[6px] bg-white">
              <div className="relative flex h-[24px] w-[20px] items-center justify-center rounded-[3px] bg-[#e95545]">
                <FileText
                  size={12}
                  strokeWidth={2}
                  className="text-white"
                />

                <span className="absolute -bottom-[3px] rounded-[2px] bg-[#e95545] px-[2px] text-[5px] font-bold text-white">
                  PDF
                </span>
              </div>
            </div>

            {/* FILE INFO */}

            <div className="min-w-0">

              <p className="truncate text-[10px] font-medium text-[#333]">
                {file.name}
              </p>

              <p className="mt-[3px] text-[8px] text-[#999]">
                {formatSize(file.size)}{" "}
                • Uploaded
              </p>

            </div>

          </div>

          {/* REMOVE */}

          <button
            type="button"
            onClick={onRemove}
            className="ml-3 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#555] text-white transition hover:bg-[#333]"
            aria-label={`Remove ${title}`}
          >
            <X size={11} strokeWidth={2.5} />
          </button>

        </div>
      ) : (
        /* ================= EMPTY STATE ================= */

        <label className="flex w-full cursor-pointer flex-col items-center justify-center">

          <div className="mb-[9px] flex h-[31px] w-[31px] items-center justify-center rounded-[6px] bg-[#eeeeee]">
            <Upload
              size={16}
              strokeWidth={1.8}
              className="text-[#555]"
            />
          </div>

          <p className="text-[10px] font-medium text-[#333]">
            Upload{" "}
            <span className="text-[#ff5630]">
              {title}
            </span>
          </p>

          <p className="mt-[3px] text-[8px] text-[#a0a0a0]">
            Max 10MB
          </p>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={onUpload}
            className="hidden"
          />

        </label>
      )}

    </div>
  );
}