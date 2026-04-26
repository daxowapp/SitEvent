import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUniversitiesForB2B } from "@/app/actions/b2b";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "EVENT_MANAGER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const universities = await getUniversitiesForB2B(id);
  return NextResponse.json(universities);
}
