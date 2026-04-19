import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioId, path, firstChoice } = body;

    if (!scenarioId || !path || !firstChoice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("AMuN response recorded:", {
      scenarioId,
      firstChoice,
      pathLength: path.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to record response" },
      { status: 500 }
    );
  }
}