import { NextResponse } from "next/server";
import { extractAnswers } from "@/lib/extraction";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    // Check whether a file was uploaded
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Answer sheet file is required.",
        },
        {
          status: 400,
        }
      );
    }

    // Check for empty file
    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "Uploaded answer sheet is empty.",
        },
        {
          status: 400,
        }
      );
    }

    // Supported file types
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only PDF, PNG, JPG, JPEG and WEBP files are supported.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      `Starting answer extraction: ${file.name} (${file.type}, ${file.size} bytes)`
    );

    // Extract answers using Gemini
    const result = await extractAnswers(file);

    console.log("Answer extraction completed successfully.");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Answer extraction error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Answer extraction failed.",
      },
      {
        status: 500,
      }
    );
  }
}