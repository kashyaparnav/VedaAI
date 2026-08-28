import { NextResponse } from "next/server";
import { extractAnswers } from "@/lib/extraction";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Answer sheet file is required",
        },
        {
          status: 400,
        }
      );
    }

    const result = await extractAnswers(file);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Answer extraction error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Answer extraction failed",
      },
      {
        status: 500,
      }
    );
  }
}