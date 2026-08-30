import { NextResponse } from "next/server";
import { extractQuestions } from "@/lib/extraction";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Question paper file is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "Uploaded file is empty.",
        },
        {
          status: 400,
        }
      );
    }

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

    const result = await extractQuestions(file);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Question extraction failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Question extraction failed.",
      },
      {
        status: 500,
      }
    );
  }
}