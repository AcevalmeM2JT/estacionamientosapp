import { NextResponse } from "next/server";

export async function GET() {
  const errors: string[] = [];

  try {
    const { prisma } = await import("@/lib/db");
    const count = await prisma.parkingFacility.count();
    return NextResponse.json({ ok: true, parkingCount: count });
  } catch (e: unknown) {
    errors.push(e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) errors.push(e.stack);
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }
}
