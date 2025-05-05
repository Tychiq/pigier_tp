import { getCurrentUser } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ isStudent: false });

  return NextResponse.json({ isStudent: user.isStudent });
}
