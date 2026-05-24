import { NextResponse } from "next/server";
import { parseNaturalFood } from "@/lib/ai";
import { naturalLanguageSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = naturalLanguageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = await parseNaturalFood(parsed.data.text, parsed.data.mealType);
  return NextResponse.json(data);
}
