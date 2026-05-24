import { NextResponse } from "next/server";
import { generateAiInsights } from "@/lib/ai";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const insights = await generateAiInsights(body.logs, body.profile);
  return NextResponse.json(insights);
}
