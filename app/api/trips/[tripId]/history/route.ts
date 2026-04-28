// Phase 2〜: 旅行別走行履歴
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  // TODO: Phase 2 — ILocationHistoryRepository.getPositionsByTrip(params.tripId)
  return NextResponse.json([]);
}
