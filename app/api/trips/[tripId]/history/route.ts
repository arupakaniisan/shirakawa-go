export const dynamic = "force-dynamic";

// Phase 2〜: 旅行別走行履歴
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params: _params }: { params: { tripId: string } }
) {
  // TODO: Phase 2 — ILocationHistoryRepository.getPositionsByTrip(_params.tripId)
  return NextResponse.json([]);
}
