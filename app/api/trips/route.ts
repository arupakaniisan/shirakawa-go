// Phase 2〜: 旅行一覧・作成
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Phase 2 — ITripRepository.listTrips()
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: Phase 2 — ITripRepository.createTrip(body)
  return NextResponse.json({ id: "TODO", ...body }, { status: 201 });
}
