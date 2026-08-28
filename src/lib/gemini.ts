const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not configured.");
}

type GeminiPart = {
  text?: string;

  inlineData?: {
    mimeType: string;
    data: string;
  };
};

export async function generateGeminiJSON(
  parts: GeminiPart[]
) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Check your .env.local file."
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },

    body: JSON.stringify({
      contents: [
        {
          parts,
        },
      ],

      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  const responseText = await response.text();

  /*
   * 429 = quota/rate limit
   */
  if (response.status === 429) {
    console.error(
      "Gemini quota/rate limit exceeded:",
      responseText
    );

    throw new Error(
      "Gemini API quota exceeded. Please wait for the quota to reset or use an API project with available quota."
    );
  }

  /*
   * Other API errors
   */
  if (!response.ok) {
    console.error(
      `Gemini API error ${response.status}:`,
      responseText
    );

    throw new Error(
      `Gemini API error ${response.status}: ${responseText}`
    );
  }

  /*
   * Parse Gemini response
   */
  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Gemini returned an invalid API response."
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(
        (part: { text?: string }) =>
          part.text || ""
      )
      .join("") || "";

  if (!text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  /*
   * Parse model JSON
   */
  try {
    return JSON.parse(text);
  } catch {
    console.error(
      "Gemini returned invalid JSON:",
      text
    );

    throw new Error(
      "Gemini returned invalid JSON."
    );
  }
}