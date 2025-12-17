import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;

    if (!file) {
      return Response.json({ error: "Missing image" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'Extract 5-10 short keywords for this lost-and-found item image. ' +
                'Return ONLY a JSON array of strings. Example: ["black","wallet"].',
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    const text = resp.choices?.[0]?.message?.content?.trim() ?? "";

    // handle ```json fences if any
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let keywords: string[] = [];
    try {
      keywords = JSON.parse(cleaned);
    } catch {
      keywords = cleaned
        .replace(/[\[\]\n"]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    keywords = [...new Set(keywords.map((k) => k.toLowerCase()))].slice(0, 10);

    return Response.json({ keywords });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Keyword extraction failed" },
      { status: 500 }
    );
  }
}
