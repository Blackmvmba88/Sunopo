import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    const controlSecret = process.env.CONTROL_SECRET || "default_secret";

    if (secret === controlSecret) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid secret" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}
