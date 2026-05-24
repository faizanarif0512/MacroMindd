import { NextRequest, NextResponse } from "next/server";
import { searchFoods } from "@/lib/food-search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const foods = await searchFoods(query);
  return NextResponse.json({ foods });
}
