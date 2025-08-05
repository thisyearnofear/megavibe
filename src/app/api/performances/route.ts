import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const performanceSchema = z.object({
  cid: z.string(),
  filename: z.string(),
  filetype: z.string(),
  creator: z.string(),
  timestamp: z.number(),
});

type Performance = z.infer<typeof performanceSchema>;

const performances: Performance[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = performanceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid performance data", details: result.error.format() },
        { status: 400 }
      );
    }

    const performance = result.data;
    performances.push(performance);

    return NextResponse.json({
      success: true,
      performanceId: performances.length - 1,
      message: "Performance successfully recorded",
    });
  } catch (error) {
    console.error("Error recording performance:", error);
    return NextResponse.json(
      { error: "Failed to process performance data" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creator = searchParams.get("creator");

  if (creator) {
    const userPerformances = performances.filter(
      (p) => p.creator === creator
    );
    return NextResponse.json({ performances: userPerformances });
  } else {
    return NextResponse.json({ performances });
  }
}
