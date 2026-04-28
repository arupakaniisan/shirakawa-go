// Phase 2〜: 旅行詳細・更新
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  // TODO: Phase 2 — ITripRepository.getTripById(params.tripId)
  return NextResponse.json({ id: params.tripId });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const body = await req.json();
  // TODO: Phase 2 — ITripRepository.updateTrip(params.tripId, body)
  return NextResponse.json({ id: params.tripId, ...body });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  // TODO: Phase 2 — ITripRepository.deleteTrip(params.tripId)
  return NextResponse.json({ ok: true });
}
