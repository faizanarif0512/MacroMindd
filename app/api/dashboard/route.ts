import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/backend";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const data = await getDashboardData(date);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API GET failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
