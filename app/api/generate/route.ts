import { NextResponse } from "next/server";

export async function POST() {
  // Random delay between 1.5 and 3 seconds
  const delay = Math.random() * 1.5 + 1.5;
  await new Promise((resolve) => setTimeout(resolve, delay * 1000));

  // Return the sample audio file
  return NextResponse.json({
    audioUrl: "/samples/sample.mp3",
    success: true,
  });
}
